import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  passwordChangeSchema,
  resetPasswordSchema,
} from "@/lib/auth/account-security-validation";
import {
  decryptMfaSecret,
  encryptMfaSecret,
  generateRecoveryCodes,
  hashRecoveryCode,
  validateMfaEncryptionKey,
} from "@/lib/auth/mfa-crypto";
import {
  generatePasswordResetToken,
  getPasswordResetExpiresAt,
  hashPasswordResetToken,
  PASSWORD_RESET_TOKEN_BYTES,
} from "@/lib/auth/password-reset";

describe("admin account security helpers", () => {
  it("generates high-entropy password reset tokens and stores only hashes", () => {
    const token = generatePasswordResetToken();
    const hash = hashPasswordResetToken(token);

    expect(Buffer.from(token, "base64url").byteLength).toBe(
      PASSWORD_RESET_TOKEN_BYTES
    );
    expect(hash).toHaveLength(64);
    expect(hash).not.toBe(token);
  });

  it("uses bounded password reset expiry from environment", () => {
    expect(
      getPasswordResetExpiresAt(new Date("2026-01-01T00:00:00.000Z"), {
        PASSWORD_RESET_TOKEN_TTL_SECONDS: "1800",
      } as NodeJS.ProcessEnv)
    ).toEqual(new Date("2026-01-01T00:30:00.000Z"));
  });

  it("validates forgot and reset password input safely", () => {
    expect(
      forgotPasswordSchema.parse({ email: " ADMIN@EXAMPLE.COM " }).email
    ).toBe("admin@example.com");
    expect(
      resetPasswordSchema.safeParse({
        token: "invalid token",
        newPassword: "valid-password-1234",
        confirmPassword: "valid-password-1234",
      }).success
    ).toBe(false);
    expect(
      passwordChangeSchema.safeParse({
        currentPassword: "valid-password-1234",
        newPassword: "valid-password-1234",
        confirmPassword: "valid-password-1234",
      }).success
    ).toBe(false);
  });

  it("encrypts MFA secrets with authenticated encryption and unique nonces", () => {
    const key = Buffer.alloc(32, 7).toString("base64");
    const env = { MFA_ENCRYPTION_KEY: key } as NodeJS.ProcessEnv;

    expect(validateMfaEncryptionKey(key)).toBe(true);

    const first = encryptMfaSecret("totp-secret", env);
    const second = encryptMfaSecret("totp-secret", env);

    expect(first).not.toBe(second);
    expect(decryptMfaSecret(first, env)).toBe("totp-secret");
    expect(() =>
      decryptMfaSecret(first, {
        MFA_ENCRYPTION_KEY: Buffer.alloc(32, 8).toString("base64"),
      } as NodeJS.ProcessEnv)
    ).toThrow();
  });

  it("generates recovery codes and stores only hashes", () => {
    const codes = generateRecoveryCodes(4);
    const hashes = codes.map(hashRecoveryCode);

    expect(codes).toHaveLength(4);
    expect(new Set(codes).size).toBe(4);
    expect(hashes.every((hash) => hash.length === 64)).toBe(true);
    expect(hashes).not.toContain(codes[0]);
  });
});
