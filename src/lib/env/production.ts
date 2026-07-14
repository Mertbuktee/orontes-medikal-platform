import { isProductionDeployment, resolveSiteOrigin } from "@/config/site";

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
