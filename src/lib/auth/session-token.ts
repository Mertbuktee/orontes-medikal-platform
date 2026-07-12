import { createHash, randomBytes } from "node:crypto";

import { assertServerOnly } from "@/lib/auth/server-only";

assertServerOnly("admin session tokens");

export const ADMIN_SESSION_TOKEN_BYTES = 32;

export function generateAdminSessionToken() {
  return randomBytes(ADMIN_SESSION_TOKEN_BYTES).toString("base64url");
}

export function hashAdminSessionToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
