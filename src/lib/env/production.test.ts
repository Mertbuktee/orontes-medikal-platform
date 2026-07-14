import { describe, expect, it } from "vitest";

import { validateRuntimeEnvironment } from "@/lib/env/production";

describe("runtime production environment validation", () => {
  it("allows development fallback with warnings", () => {
    const result = validateRuntimeEnvironment({ APP_ENV: "development" });

    expect(result.ok).toBe(true);
    expect(result.mode).toBe("development");
    expect(result.warnings.join(" ")).toContain("DATABASE_URL");
  });

  it("requires production origin, database and trusted proxy", () => {
    const result = validateRuntimeEnvironment({ APP_ENV: "production" });

    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain("APP_ORIGIN");
    expect(result.errors.join(" ")).toContain("DATABASE_URL");
    expect(result.errors.join(" ")).toContain("TRUST_PROXY");
  });

  it("accepts a minimal production configuration", () => {
    const result = validateRuntimeEnvironment({
      APP_ENV: "production",
      APP_ORIGIN: "https://orontesteknoloji.com",
      TRUST_PROXY: "true",
      DATABASE_URL: "postgresql://user:pass@db:5432/orontes",
      MAIL_PROVIDER: "smtp",
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      MAIL_FROM_ADDRESS: "noreply@example.com",
    });

    expect(result.ok).toBe(true);
  });

  it("rejects production localhost and development mail provider", () => {
    const result = validateRuntimeEnvironment({
      APP_ENV: "production",
      APP_ORIGIN: "https://localhost:3000",
      TRUST_PROXY: "true",
      DATABASE_URL: "postgresql://user:pass@db:5432/orontes",
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
});
