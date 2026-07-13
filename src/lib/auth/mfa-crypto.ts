import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

import { assertServerOnly } from "@/lib/auth/server-only";

assertServerOnly("mfa encryption");

const ivBytes = 12;
const authTagBytes = 16;

export function validateMfaEncryptionKey(value: string | undefined) {
  if (!value) return false;
  try {
    return Buffer.from(value, "base64").length === 32;
  } catch {
    return false;
  }
}

export function requireMfaEncryptionKey(env: NodeJS.ProcessEnv = process.env) {
  const key = env.MFA_ENCRYPTION_KEY;
  if (!validateMfaEncryptionKey(key)) {
    throw new Error("MFA_ENCRYPTION_KEY must be a base64 encoded 32-byte key.");
  }
  return Buffer.from(key as string, "base64");
}

export function encryptMfaSecret(
  secret: string,
  env: NodeJS.ProcessEnv = process.env
) {
  const key = requireMfaEncryptionKey(env);
  const iv = randomBytes(ivBytes);
  const cipher = createCipheriv("aes-256-gcm", key, iv, {
    authTagLength: authTagBytes,
  });
  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptMfaSecret(
  encryptedSecret: string,
  env: NodeJS.ProcessEnv = process.env
) {
  const [, ivPart, tagPart, encryptedPart] = encryptedSecret.split(".");
  if (!ivPart || !tagPart || !encryptedPart) {
    throw new Error("Invalid encrypted MFA secret.");
  }

  const key = requireMfaEncryptionKey(env);
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivPart, "base64url"),
    { authTagLength: authTagBytes }
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function hashRecoveryCode(code: string) {
  return createHash("sha256")
    .update(normalizeRecoveryCode(code), "utf8")
    .digest("hex");
}

export function normalizeRecoveryCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function generateRecoveryCodes(count = 10) {
  return Array.from({ length: count }, () =>
    `${randomBytes(4).toString("hex")}-${randomBytes(4).toString("hex")}`.toUpperCase()
  );
}

export function generateTotpSecretSeed() {
  return randomBytes(20).toString("base64url");
}
