import { constants } from 'node:fs';
import { access, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { prisma } from '@/lib/database/prisma';
import { SiteSettingsRepository } from '@/lib/database/repositories/site-settings';
import { validateRuntimeEnvironment } from '@/lib/env/production';
import { validateProductionSiteSettings } from '@/lib/site-settings/site-settings-validation';

export const dynamic = 'force-dynamic';

type ComponentState = 'ok' | 'degraded' | 'failed';

export async function GET() {
  const started = Date.now();
  const [database, storage, siteSettings] = await Promise.all([
    checkDatabase(),
    checkStorage(),
    checkSiteSettings(),
  ]);
  const environment = validateRuntimeEnvironment();
  const components = { database, storage, siteSettings };
  const ok =
    database.status === 'ok' &&
    storage.status === 'ok' &&
    siteSettings.status !== 'failed' &&
    environment.ok;

  return Response.json(
    {
      status: ok ? 'ready' : 'not-ready',
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      components,
      environment: {
        mode: environment.mode,
        status: environment.ok ? 'ok' : 'failed',
        errors: environment.errors,
        warnings: environment.warnings,
      },
    },
    {
      status: ok ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  );
}

async function checkDatabase(): Promise<{ status: ComponentState }> {
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, 2500);
    return { status: 'ok' };
  } catch {
    return { status: 'failed' };
  }
}

async function checkStorage(): Promise<{ status: ComponentState }> {
  const storagePath = path.join(process.cwd(), 'storage', 'private');
  const probePath = path.join(
    storagePath,
    `.health-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  try {
    await withTimeout(stat(storagePath), 1500);
    await withTimeout(
      access(storagePath, constants.R_OK | constants.W_OK),
      1500,
    );
    await withTimeout(writeFile(probePath, 'ok', { flag: 'wx' }), 1500);
    return { status: 'ok' };
  } catch {
    return { status: 'failed' };
  } finally {
    await unlink(probePath).catch(() => undefined);
  }
}

async function checkSiteSettings(): Promise<{
  status: ComponentState;
  errors: string[];
  warnings: string[];
}> {
  try {
    const repository = new SiteSettingsRepository(prisma);
    const missingGroups = await withTimeout(
      repository.getMissingGroups(),
      2500,
    );
    const settings = await withTimeout(repository.getSettings(), 2500);
    const validation = validateProductionSiteSettings(settings);
    const errors = [
      ...missingGroups.map((key) => `Missing Site Settings group: ${key}`),
      ...validation.errors,
    ];

    if (errors.length) {
      return { status: 'failed', errors, warnings: validation.warnings };
    }

    return {
      status: validation.warnings.length ? 'degraded' : 'ok',
      errors: [],
      warnings: validation.warnings,
    };
  } catch (error) {
    return {
      status: 'failed',
      errors: [
        error instanceof Error
          ? error.message
          : 'Site Settings could not be verified.',
      ],
      warnings: [],
    };
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeout: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error('HEALTH_CHECK_TIMEOUT')),
      timeoutMs,
    );
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
