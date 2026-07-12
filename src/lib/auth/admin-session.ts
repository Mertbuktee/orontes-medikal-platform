import { redirect } from "next/navigation";

import { hasPermission, type Permission, type Role } from "@/lib/rbac/permissions";

export type AdminSessionMode = "authenticated" | "development-bypass";

export type AdminSession = {
  actorId: string | null;
  role: Role;
  mode: AdminSessionMode;
};

export type AdminAccessDecision =
  | { status: "allow"; session: AdminSession }
  | { status: "redirect"; location: "/admin/login" };

export function isAdminDevBypassEnabled(env: NodeJS.ProcessEnv = process.env) {
  const isProductionDeployment =
    env.APP_ENV === "production" || env.VERCEL_ENV === "production";

  return env.ADMIN_DEV_BYPASS === "true" && !isProductionDeployment;
}

export async function getCurrentAdminSession(
  env: NodeJS.ProcessEnv = process.env
): Promise<AdminSession | null> {
  if (isAdminDevBypassEnabled(env)) {
    return {
      actorId: null,
      role: "SUPER_ADMIN",
      mode: "development-bypass",
    };
  }

  return null;
}

export function getAdminAccessDecision(
  session: AdminSession | null,
  env: NodeJS.ProcessEnv = process.env
): AdminAccessDecision {
  if (session) {
    return { status: "allow", session };
  }

  if (isAdminDevBypassEnabled(env)) {
    return {
      status: "allow",
      session: {
        actorId: null,
        role: "SUPER_ADMIN",
        mode: "development-bypass",
      },
    };
  }

  return { status: "redirect", location: "/admin/login" };
}

export async function requireAdminSession() {
  const session = await getCurrentAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

export async function requirePermission(permission: Permission) {
  const session = await requireAdminSession();

  if (!hasPermission(session.role, permission)) {
    redirect("/admin/login");
  }

  return session;
}
