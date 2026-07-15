import { describe, expect, it } from "vitest";

import { validateRuntimeEnvironment } from "@/lib/env/production";

describe("runtime production environment validation", () => {
  it("allows development fallback with warnings", () => {
    const result = validateRuntimeEnvironment({ APP_ENV: "development" });

    expect(result.ok).toBe(true);
    expect(result.mode).toBe("development");
    expect(result.warnings.join(" ")).toContain("DATABASE_URL");
  });

  it("requires production origin, database, trusted proxy and storage root", () => {
    const result = validateRuntimeEnvironment({ APP_ENV: "production" });

    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain("APP_ORIGIN");
    expect(result.errors.join(" ")).toContain("DATABASE_URL");
    expect(result.errors.join(" ")).toContain("TRUST_PROXY");
    expect(result.errors.join(" ")).toContain("PRIVATE_STORAGE_ROOT");
  });

  it("accepts a minimal production configuration", () => {
    const result = validateRuntimeEnvironment({
      APP_ENV: "production",
      APP_ORIGIN: "https://orontesteknoloji.com",
      TRUST_PROXY: "true",
      DATABASE_URL: "postgresql://user:pass@db:5432/orontes",
      PRIVATE_STORAGE_ROOT: "/app/storage/private",
      MAIL_PROVIDER: "smtp",
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      MAIL_FROM_ADDRESS: "noreply@example.com",
      BACKUP_DIR: "/backups",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects production localhost and development mail provider", () => {
    const result = validateRuntimeEnvironment({
      APP_ENV: "production",
      APP_ORIGIN: "https://localhost:3000",
      TRUST_PROXY: "true",
      DATABASE_URL: "postgresql://user:pass@db:5432/orontes",
      PRIVATE_STORAGE_ROOT: "/app/storage/private",
      MAIL_PROVIDER: "development",
    });

    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain("localhost");
    expect(result.errors.join(" ")).toContain("MAIL_PROVIDER=development");
  });

  it("does not echo secret values in errors", () => {
    const result = validateRuntimeEnvironment({
      APP_ENV: "production",
      APP_ORIGIN: "http://orontesteknoloji.com",
      TRUST_PROXY: "false",
      DATABASE_URL: "postgresql://user:super-secret@db:5432/orontes",
    });

    expect(result.errors.join(" ")).not.toContain("super-secret");
  });

  it("blocks s3-compatible storage until the runtime adapter is wired", () => {
    const result = validateRuntimeEnvironment({
      APP_ENV: "production",
      APP_ORIGIN: "https://example.com",
      TRUST_PROXY: "true",
      DATABASE_URL: "postgresql://user:pass@example.com:5432/app",
      PRIVATE_STORAGE_ROOT: "/app/storage/private",
      MAIL_PROVIDER: "smtp",
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      MAIL_FROM_ADDRESS: "info@example.com",
      STORAGE_PROVIDER: "s3-compatible",
      S3_ENDPOINT: "https://s3.example.com",
      S3_REGION: "eu-central-1",
      S3_BUCKET: "orontes",
      S3_ACCESS_KEY_ID: "key",
      S3_SECRET_ACCESS_KEY: "secret",
    } as NodeJS.ProcessEnv);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "STORAGE_PROVIDER=s3-compatible is not production-ready until an object storage adapter is wired."
    );
  });
});
