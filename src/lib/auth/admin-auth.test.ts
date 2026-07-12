import { describe, expect, it } from "vitest";

import { containsSensitiveAuditMetadata } from "@/lib/auth/audit-safety";
import {
  canCreateInitialSuperAdmin,
  isBootstrapBlockingSuperAdmin,
  parseAdminBootstrapEnv,
} from "@/lib/auth/bootstrap";
import {
  createLoginRateLimitKey,
  isLoginRateLimited,
  recordLoginFailure,
  resetLoginFailures,
} from "@/lib/auth/login-rate-limit";
import {
  adminPasswordPolicy,
  hashPassword,
  validateAdminPassword,
  verifyPassword,
} from "@/lib/auth/password";
import { canAuthenticateAdminSession } from "@/lib/auth/session-validation";
import { getAdminSessionCookieOptions } from "@/lib/auth/session-cookie";
import {
  ADMIN_SESSION_TOKEN_BYTES,
  generateAdminSessionToken,
  hashAdminSessionToken,
} from "@/lib/auth/session-token";
import { hasPermission, permissions } from "@/lib/rbac/permissions";

describe("secure admin authentication foundation", () => {
  it("hashes passwords using Argon2id", async () => {
    const hash = await hashPassword("very-secure-admin-password");

    expect(hash).toMatch(/^\$argon2id\$/);
  });

  it("verifies correct passwords and rejects incorrect passwords", async () => {
    const hash = await hashPassword("another-secure-admin-password");

    await expect(verifyPassword(hash, "another-secure-admin-password")).resolves.toBe(
      true
    );
    await expect(verifyPassword(hash, "wrong-secure-admin-password")).resolves.toBe(
      false
    );
  });

  it("enforces password length policy", () => {
    expect(validateAdminPassword("short")).toContain(
      String(adminPasswordPolicy.minLength)
    );
    expect(validateAdminPassword("x".repeat(129))).toContain(
      String(adminPasswordPolicy.maxLength)
    );
    expect(validateAdminPassword("x".repeat(12))).toBeNull();
  });

  it("generates high-entropy opaque session tokens", () => {
    const token = generateAdminSessionToken();

    expect(Buffer.from(token, "base64url").byteLength).toBe(
      ADMIN_SESSION_TOKEN_BYTES
    );
  });

  it("stores token hashes instead of raw tokens", () => {
    const token = generateAdminSessionToken();
    const hash = hashAdminSessionToken(token);

    expect(hash).not.toBe(token);
    expect(hash).toHaveLength(64);
  });

  it("scopes the admin session cookie to admin routes", () => {
    const options = getAdminSessionCookieOptions({
      APP_ENV: "development",
    } as NodeJS.ProcessEnv);

    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/admin");
    expect(options.secure).toBe(false);
  });

  it("validates active, unexpired and unrevoked sessions only", () => {
    const now = new Date("2026-01-01T12:00:00.000Z");
    const validSession = {
      revokedAt: null,
      expiresAt: new Date("2026-01-01T13:00:00.000Z"),
      user: { isActive: true },
    };

    expect(canAuthenticateAdminSession(validSession, now)).toBe(true);
    expect(
      canAuthenticateAdminSession(
        { ...validSession, expiresAt: new Date("2026-01-01T11:00:00.000Z") },
        now
      )
    ).toBe(false);
    expect(
      canAuthenticateAdminSession(
        { ...validSession, revokedAt: new Date("2026-01-01T12:30:00.000Z") },
        now
      )
    ).toBe(false);
    expect(
      canAuthenticateAdminSession(
        { ...validSession, user: { isActive: false } },
        now
      )
    ).toBe(false);
  });

  it("activates login rate limit and resets after successful login", () => {
    const key = createLoginRateLimitKey(
      `admin-${Date.now()}@example.com`,
      "direct-client"
    );

    expect(isLoginRateLimited(key).allowed).toBe(true);

    for (let index = 0; index < 5; index += 1) {
      recordLoginFailure(key);
    }

    expect(isLoginRateLimited(key).allowed).toBe(false);
    resetLoginFailures(key);
    expect(isLoginRateLimited(key).allowed).toBe(true);
  });

  it("bootstrap refuses missing variables and weak passwords", () => {
    expect(() => parseAdminBootstrapEnv({})).toThrow(
      "ADMIN_BOOTSTRAP_EMAIL"
    );
    expect(() =>
      parseAdminBootstrapEnv({
        ADMIN_BOOTSTRAP_EMAIL: "admin@example.com",
        ADMIN_BOOTSTRAP_NAME: "Admin",
        ADMIN_BOOTSTRAP_PASSWORD: "short",
      })
    ).toThrow(String(adminPasswordPolicy.minLength));
  });

  it("bootstrap avoids duplicate super admins", () => {
    expect(canCreateInitialSuperAdmin(0)).toBe(true);
    expect(canCreateInitialSuperAdmin(1)).toBe(false);
  });

  it("does not treat the visual QA admin as a bootstrap blocker", () => {
    expect(isBootstrapBlockingSuperAdmin("visual-qa-admin@orontes.local")).toBe(
      false
    );
    expect(isBootstrapBlockingSuperAdmin("admin@example.com")).toBe(true);
  });

  it("keeps audit metadata free from sensitive keys", () => {
    expect(
      containsSensitiveAuditMetadata({ success: true, reason: "invalid" })
    ).toBe(false);
    expect(containsSensitiveAuditMetadata({ password: "secret" })).toBe(true);
    expect(containsSensitiveAuditMetadata({ session: { token: "raw" } })).toBe(
      true
    );
  });

  it("keeps SUPER_ADMIN fully authorized and VIEWER restricted", () => {
    for (const permission of permissions) {
      expect(hasPermission("SUPER_ADMIN", permission)).toBe(true);
    }

    expect(hasPermission("VIEWER", "devices.manage")).toBe(false);
    expect(hasPermission("VIEWER", "serviceRequests.update")).toBe(false);
  });
});
