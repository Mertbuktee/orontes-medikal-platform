import { validateAdminPassword } from "./password.ts";
import { assertServerOnly } from "./server-only.ts";

assertServerOnly("admin bootstrap");

export type AdminBootstrapInput = {
  email: string;
  name: string;
  password: string;
};

export function parseAdminBootstrapEnv(
  env: NodeJS.ProcessEnv = process.env
): AdminBootstrapInput {
  const email = requireEnv(env, "ADMIN_BOOTSTRAP_EMAIL");
  const name = requireEnv(env, "ADMIN_BOOTSTRAP_NAME");
  const password = requireEnv(env, "ADMIN_BOOTSTRAP_PASSWORD");
  const policyError = validateAdminPassword(password);

  if (policyError) {
    throw new Error(policyError);
  }

  return { email, name, password };
}

export function canCreateInitialSuperAdmin(existingSuperAdminCount: number) {
  return existingSuperAdminCount === 0;
}

export function isBootstrapBlockingSuperAdmin(email: string) {
  return email.trim().toLowerCase() !== "visual-qa-admin@orontes.local";
}

function requireEnv(env: NodeJS.ProcessEnv, name: string) {
  const value = env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}
