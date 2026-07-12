import argon2 from "argon2";

import { assertServerOnly } from "@/lib/auth/server-only";

assertServerOnly("password authentication");

export const adminPasswordPolicy = {
  minLength: 12,
  maxLength: 128,
} as const;

export const argon2idParameters = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 3,
  parallelism: 1,
  hashLength: 32,
} as const;

export function validateAdminPassword(password: string) {
  if (password.length < adminPasswordPolicy.minLength) {
    return `Sifre en az ${adminPasswordPolicy.minLength} karakter olmalidir.`;
  }

  if (password.length > adminPasswordPolicy.maxLength) {
    return `Sifre en fazla ${adminPasswordPolicy.maxLength} karakter olabilir.`;
  }

  return null;
}

export async function hashPassword(password: string) {
  const policyError = validateAdminPassword(password);

  if (policyError) {
    throw new Error(policyError);
  }

  return argon2.hash(password, argon2idParameters);
}

export async function verifyPassword(hash: string, password: string) {
  if (password.length > adminPasswordPolicy.maxLength) {
    return false;
  }

  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}
