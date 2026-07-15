import { isProductionDeployment, resolveSiteOrigin } from "@/config/site";
import { validateStorageEnvironment } from "@/lib/storage/storage-config";

export type RuntimeValidationResult = {
  ok: boolean;
  mode: "development" | "production";
  errors: string[];
  warnings: string[];
};

const secretNamePattern = /(SECRET|PASSWORD|TOKEN|KEY|DATABASE_URL|SMTP_USER)/i;

export function validateRuntimeEnvironment(
  env: NodeJS.ProcessEnv = process.env
): RuntimeValidationResult {
  const production = isProductionDeployment(env);
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    resolveSiteOrigin(env);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "APP_ORIGIN is invalid.");
  }

  if (production) {
    requireValue(env, "DATABASE_URL", errors);
    requireValue(env, "TRUST_PROXY", errors);
    requireValue(env, "PRIVATE_STORAGE_ROOT", errors);

    if (env.TRUST_PROXY !== "true") {
      errors.push("TRUST_PROXY must be true behind a production reverse proxy.");
    }

    if (env.ADMIN_DEV_BYPASS === "true") {
      errors.push("ADMIN_DEV_BYPASS cannot be true in production.");
    }

    if (env.MAIL_PROVIDER === "smtp") {
      for (const name of ["SMTP_HOST", "SMTP_PORT", "MAIL_FROM_ADDRESS"]) {
        requireValue(env, name, errors);
      }
    }

    if (env.MAIL_PROVIDER && env.MAIL_PROVIDER !== "development") {
      const batchSize = Number(env.MAIL_WORKER_BATCH_SIZE ?? 25);
      if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 100) {
        errors.push("MAIL_WORKER_BATCH_SIZE must be an integer between 1 and 100.");
      }
    }

    if (!env.BACKUP_DIR?.trim()) {
      warnings.push("BACKUP_DIR is not set; database backup location must be explicit before go-live.");
    }

    if (env.MFA_REQUIRED === "true" || env.MFA_ENFORCEMENT === "true") {
      requireValue(env, "MFA_ENCRYPTION_KEY", errors);
    }
  } else {
    if (!env.DATABASE_URL) {
      warnings.push("DATABASE_URL is not set; database-backed features will be unavailable.");
    }
  }

  if (env.MAIL_PROVIDER === "development" && production) {
    errors.push("MAIL_PROVIDER=development is not allowed in production.");
  }

  const storage = validateStorageEnvironment(env);
  errors.push(...storage.errors);
  warnings.push(...storage.warnings);

  if (production && storage.provider === "s3-compatible") {
    errors.push("STORAGE_PROVIDER=s3-compatible is not production-ready until an object storage adapter is wired.");
  }

  return {
    ok: errors.length === 0,
    mode: production ? "production" : "development",
    errors: errors.map(redactEnvValue),
    warnings: warnings.map(redactEnvValue),
  };
}

function requireValue(env: NodeJS.ProcessEnv, name: string, errors: string[]) {
  if (!env[name]?.trim()) {
    errors.push(`${name} is required.`);
  }
}

function redactEnvValue(message: string) {
  return message
    .split(/\s+/)
    .map((part) => (secretNamePattern.test(part) && part.includes("=") ? part.split("=")[0] : part))
    .join(" ");
}
