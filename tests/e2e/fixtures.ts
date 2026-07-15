import { readFileSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import argon2 from 'argon2';
import type { BrowserContext, Page } from '@playwright/test';
import { expect } from '@playwright/test';

type PrismaModule = typeof import('@/lib/database/prisma');
type PrismaClient = PrismaModule['prisma'];

const fixtureDomain = 'e2e.local';
const password = 'E2eFixturePass!2026';
const attachmentBody = Buffer.from('orontes e2e private attachment\n', 'utf8');

export type E2EFixture = Awaited<ReturnType<typeof createE2EFixture>>;

export async function createE2EFixture() {
  loadLocalEnv();

  const { prisma } = await import('@/lib/database/prisma');
  await cleanupE2EFixture(prisma);

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 3,
    parallelism: 1,
    hashLength: 32,
  });

  const suffix = Date.now().toString(36);
  const users = {
    admin: await createUser(prisma, {
      name: 'E2E Owner',
      email: `admin-${suffix}@${fixtureDomain}`,
      role: 'SUPER_ADMIN',
      passwordHash,
    }),
    serviceStaff: await createUser(prisma, {
      name: 'E2E Service Staff',
      email: `service-${suffix}@${fixtureDomain}`,
      role: 'SERVICE_STAFF',
      passwordHash,
    }),
    viewer: await createUser(prisma, {
      name: 'E2E Viewer',
      email: `viewer-${suffix}@${fixtureDomain}`,
      role: 'VIEWER',
      passwordHash,
    }),
    editor: await createUser(prisma, {
      name: 'E2E Editor',
      email: `editor-${suffix}@${fixtureDomain}`,
      role: 'EDITOR',
      passwordHash,
    }),
  };

  const storageKey = `e2e-private-${suffix}.txt`;
  const storageRoot = path.join(process.cwd(), 'storage', 'private', 'service-requests');
  await mkdir(storageRoot, { recursive: true });
  await writeFile(path.join(storageRoot, storageKey), attachmentBody, { flag: 'wx' });

  const serviceRequest = await prisma.serviceRequest.create({
    data: {
      fullName: 'E2E Klinik Kullanici',
      company: `E2E Klinik ${suffix}`,
      phone: '05536065703',
      email: `request-${suffix}@${fixtureDomain}`,
      deviceBrand: 'Medikal Marka',
      deviceModel: 'E2E-100',
      deviceSerialNumber: `SN-${suffix}`,
      message: 'E2E servis talebi, yetki ve ek dosya akisi icin olusturuldu.',
      status: 'IN_REPAIR',
      attachments: {
        create: {
          storageKey,
          mimeType: 'text/plain',
          size: attachmentBody.length,
          originalName: 'e2e-private.txt',
        },
      },
    },
    include: { attachments: true },
  });

  return {
    password,
    users,
    serviceRequest,
    attachment: serviceRequest.attachments[0],
    storagePath: path.join(storageRoot, storageKey),
    async cleanup() {
      await cleanupE2EFixture(prisma);
      await rm(path.join(storageRoot, storageKey), { force: true });
      await prisma.$disconnect();
    },
  };
}

export async function loginAs(context: BrowserContext, email: string) {
  const response = await context.request.post('/api/admin/auth/login', {
    data: { email, password, rememberMe: false },
    headers: { origin: context.pages()[0]?.url() || 'http://127.0.0.1' },
  });

  expect(response.status()).toBe(200);
  await expect(response).toBeOK();
}

export async function expectAdminRoute(page: Page, pathName: string, allowed: boolean) {
  await page.goto(pathName, { waitUntil: 'domcontentloaded' });

  if (allowed) {
    await expect(page).not.toHaveURL(/\/admin\/forbidden|\/admin\/login/);
    return;
  }

  await expect(page).toHaveURL(
    /\/admin\/forbidden|\/admin\/login|\/technical\/forbidden|\/technical\/dashboard/,
  );
}

async function createUser(
  prisma: PrismaClient,
  input: {
    name: string;
    email: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'SERVICE_STAFF' | 'VIEWER' | 'EDITOR';
    passwordHash: string;
  },
) {
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      role: input.role,
      passwordHash: input.passwordHash,
      passwordChangedAt: new Date(),
    },
  });
}

async function cleanupE2EFixture(prisma: PrismaClient) {
  const requests = await prisma.serviceRequest.findMany({
    where: { email: { endsWith: `@${fixtureDomain}` } },
    include: { attachments: true },
  });

  await prisma.serviceRequest.deleteMany({
    where: { id: { in: requests.map((request) => request.id) } },
  });

  await Promise.all(
    requests.flatMap((request) =>
      request.attachments.map((attachment) =>
        rm(path.join(process.cwd(), 'storage', 'private', 'service-requests', attachment.storageKey), {
          force: true,
        }),
      ),
    ),
  );

  const users = await prisma.user.findMany({
    where: { email: { endsWith: `@${fixtureDomain}` } },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);

  await prisma.adminSession.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.auditLog.deleteMany({ where: { actorId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  try {
    for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const separator = trimmed.indexOf('=');
      if (separator <= 0) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, '');
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // Playwright can also receive DATABASE_URL through the shell environment.
  }
}
