import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  AdminAuthRepository,
  type AuthenticatedAdminSession,
} from "@/lib/auth/admin-auth-repository";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { hashAdminSessionToken } from "@/lib/auth/session-token";
import { assertServerOnly } from "@/lib/auth/server-only";
import {
  canAccessAdminRoute,
  hasPermission,
  type Permission,
} from "@/lib/rbac/permissions";

assertServerOnly("admin session");

export type AdminSessionMode = "authenticated";

export type AdminSession = AuthenticatedAdminSession & {
  actorId: string;
  mode: AdminSessionMode;
};

export type AdminAccessDecision =
  | { status: "allow"; session: AdminSession }
  | { status: "forbidden" }
  | { status: "redirect"; location: "/admin/login" };

export function isAdminDevBypassEnabled(env: NodeJS.ProcessEnv = process.env) {
  const isProductionDeployment =
    env.APP_ENV === "production" || env.VERCEL_ENV === "production";

  return env.ADMIN_DEV_BYPASS === "true" && !isProductionDeployment;
}

export async function getCurrentAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!rawToken) {
    return null;
  }

  const repository = await getAdminAuthRepository();
  const session = await repository.findValidSessionByTokenHash(
    hashAdminSessionToken(rawToken)
  );

  if (!session) {
    return null;
  }

  return {
    ...session,
    actorId: session.userId,
    mode: "authenticated",
  };
}

export function getAdminAccessDecision(
  session: AdminSession | null,
  pathname = "/admin/dashboard"
): AdminAccessDecision {
  if (!session) {
    return { status: "redirect", location: "/admin/login" };
  }

  if (!canAccessAdminRoute(session.role, pathname)) {
    return { status: "forbidden" };
  }

  return { status: "allow", session };
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
    redirect("/admin/forbidden");
  }

  return session;
}

async function getAdminAuthRepository() {
  const { prisma } = await import("@/lib/database/prisma");
  return new AdminAuthRepository(prisma);
}
