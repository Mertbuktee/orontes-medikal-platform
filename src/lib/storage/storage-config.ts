export type StorageProvider = "local" | "s3-compatible";

const storageProviders = new Set<StorageProvider>(["local", "s3-compatible"]);

export function getStorageProvider(env: NodeJS.ProcessEnv = process.env): StorageProvider {
  const value = env.STORAGE_PROVIDER?.trim() || "local";

  if (storageProviders.has(value as StorageProvider)) {
    return value as StorageProvider;
  }

  return "local";
}

export function resolvePrivateStorageRoot(env: NodeJS.ProcessEnv = process.env) {
  const configuredRoot = env.PRIVATE_STORAGE_ROOT?.trim() || "storage/private";

  if (isAbsoluteStorageRoot(configuredRoot)) {
    return configuredRoot;
  }

  return `${process.cwd().replaceAll("\\", "/")}/${configuredRoot.replace(/^[/\\]+/, "")}`;
}

export function resolvePrivateStoragePath(segment: string, env: NodeJS.ProcessEnv = process.env) {
  return `${resolvePrivateStorageRoot(env).replace(/[/\\]+$/, "")}/${segment.replace(/^[/\\]+/, "")}`;
}

export function validateStorageEnvironment(env: NodeJS.ProcessEnv = process.env) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const provider = env.STORAGE_PROVIDER?.trim() || "local";

  if (!storageProviders.has(provider as StorageProvider)) {
    errors.push("STORAGE_PROVIDER must be local or s3-compatible.");
  }

  if (provider === "local" && !env.PRIVATE_STORAGE_ROOT?.trim()) {
    warnings.push("PRIVATE_STORAGE_ROOT is not set; using storage/private.");
  }

  if (provider === "s3-compatible") {
    for (const name of [
      "S3_ENDPOINT",
      "S3_REGION",
      "S3_BUCKET",
      "S3_ACCESS_KEY_ID",
      "S3_SECRET_ACCESS_KEY",
    ]) {
      if (!env[name]?.trim()) errors.push(`${name} is required for s3-compatible storage.`);
    }

    warnings.push(
      "S3-compatible storage configuration is validated, but the runtime adapter is not enabled yet."
    );
  }

  return { provider, errors, warnings };
}

function isAbsoluteStorageRoot(value: string) {
  return value.startsWith("/") || /^[A-Za-z]:[/\\]/.test(value) || value.startsWith("\\\\");
}
