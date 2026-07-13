import { createHash, randomBytes } from "node:crypto";

import { assertServerOnly } from "@/lib/auth/server-only";

assertServerOnly("password reset tokens");

export const PASSWORD_RESET_TOKEN_BYTES = 32;
export const DEFAULT_PASSWORD_RESET_TOKEN_TTL_SECONDS = 45 * 60;

export function generatePasswordResetToken() {
  return randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString("base64url");
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function getPasswordResetTokenTtlSeconds(
  env: NodeJS.ProcessEnv = process.env
) {
  const raw = env.PASSWORD_RESET_TOKEN_TTL_SECONDS;
  if (!raw) return DEFAULT_PASSWORD_RESET_TOKEN_TTL_SECONDS;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 5 * 60 || parsed > 2 * 60 * 60) {
    return DEFAULT_PASSWORD_RESET_TOKEN_TTL_SECONDS;
  }

  return Math.floor(parsed);
}

export function getPasswordResetExpiresAt(
  now = new Date(),
  env: NodeJS.ProcessEnv = process.env
) {
  return new Date(now.getTime() + getPasswordResetTokenTtlSeconds(env) * 1000);
}
