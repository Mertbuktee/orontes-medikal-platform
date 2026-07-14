import { stat } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/database/prisma";
import { validateRuntimeEnvironment } from "@/lib/env/production";

export const dynamic = "force-dynamic";

type ComponentState = "ok" | "degraded" | "failed";

export async function GET() {
  const started = Date.now();
  const [database, storage] = await Promise.all([checkDatabase(), checkStorage()]);
  const environment = validateRuntimeEnvironment();
  const components = { database, storage };
  const ok =
    database.status === "ok" &&
    storage.status === "ok" &&
    environment.ok;

  return Response.json(
    {
      status: ok ? "ready" : "not-ready",
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      components,
      environment: {
        mode: environment.mode,
        status: environment.ok ? "ok" : "failed",
        errors: environment.errors,
        warnings: environment.warnings,
      },
    },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}

async function checkDatabase(): Promise<{ status: ComponentState }> {
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, 2500);
    return { status: "ok" };
  } catch {
    return { status: "failed" };
  }
}

async function checkStorage(): Promise<{ status: ComponentState }> {
  try {
    await withTimeout(stat(path.join(process.cwd(), "storage", "private")), 1500);
    return { status: "ok" };
  } catch {
    return { status: "failed" };
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeout: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("HEALTH_CHECK_TIMEOUT")), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
