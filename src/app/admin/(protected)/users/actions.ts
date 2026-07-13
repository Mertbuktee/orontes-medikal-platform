"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminAuthRepository } from "@/lib/auth/admin-auth-repository";
import { requirePermission } from "@/lib/auth/admin-session";
import { hashPassword } from "@/lib/auth/password";
import {
  generatePasswordResetToken,
  getPasswordResetExpiresAt,
  hashPasswordResetToken,
} from "@/lib/auth/password-reset";
import { getAdminRequestContext } from "@/lib/auth/request-context";
import { getTransactionalEmailService } from "@/lib/auth/transactional-email";
import { prisma } from "@/lib/database/prisma";
import { PrismaAdminUserRepository } from "@/lib/database/repositories/admin-users";
import { publicAbsoluteUrl } from "@/lib/site-settings/public-site-settings";
import { isSameOriginHeaders } from "@/lib/security/action-origin";
import {
  canManageUser,
  type UserManagementOperation,
} from "@/lib/users/user-management-policy";
import {
  createUserSchema,
  updateUserSchema,
  userActionIdSchema,
  userActiveStateSchema,
  userRoleAssignmentSchema,
  userSessionRevokeSchema,
} from "@/lib/users/user-management-validation";

export async function createAdminUser(formData: FormData) {
  const session = await requirePermission("users.create");
  await assertSameOriginAction();

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) redirect("/admin/users/new?status=invalid");
  if (!canManageUser(session, null, "create", { nextRole: parsed.data.role })) {
    redirect("/admin/forbidden");
  }

  const repository = new PrismaAdminUserRepository(prisma);
  if (await repository.emailExists(parsed.data.email)) {
    redirect("/admin/users/new?status=email-exists");
  }

  const rawToken = generatePasswordResetToken();
  const expiresAt = getPasswordResetExpiresAt();
  const user = await repository.createAdminUser({
    ...parsed.data,
    passwordHash: await hashPassword(randomBytes(32).toString("base64url")),
    createdById: session.userId,
    resetTokenHash: hashPasswordResetToken(rawToken),
    resetExpiresAt: expiresAt,
  });

  const context = getAdminRequestContext(await headers());
  const auditRepository = new AdminAuthRepository(prisma);
  await auditRepository.appendAuditLog({
    actorId: session.userId,
    action: "CREATE",
    entityType: "User",
    entityId: user.id,
    metadata: {
      targetUserId: user.id,
      role: user.role,
      active: user.isActive,
      onboarding: "password_setup_link",
    },
    context,
  });

  const emailQueued = await sendSetupEmail({
    email: user.email,
    name: user.name,
    token: rawToken,
    expiresAt,
    auditEntityId: user.id,
    actorId: session.userId,
    context,
  });

  revalidateUserManagementPaths(user.id);
  redirect(`/admin/users/${user.id}?status=${emailQueued ? "created" : "created-email-failed"}`);
}

export async function updateAdminUser(formData: FormData) {
  const session = await requirePermission("users.update");
  await assertSameOriginAction();

  const parsed = updateUserSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) redirect("/admin/users?status=invalid");

  const repository = new PrismaAdminUserRepository(prisma);
  const target = await repository.getAdminUserById(parsed.data.id);
  if (!target) redirect("/admin/users?status=missing");

  const activeSuperAdminCount = await repository.countActiveSuperAdmins();
  if (
    !canManageUser(session, target, "update", {
      nextRole: parsed.data.role,
      activeSuperAdminCount,
    }) ||
    (target.role !== parsed.data.role &&
      !canManageUser(session, target, "assignRole", {
        nextRole: parsed.data.role,
        activeSuperAdminCount,
      }))
  ) {
    redirect("/admin/forbidden");
  }

  if (await repository.emailExists(parsed.data.email, parsed.data.id)) {
    redirect(`/admin/users/${parsed.data.id}/edit?status=email-exists`);
  }

  const result = await repository.updateAdminUser({
    ...parsed.data,
    updatedById: session.userId,
  });

  if (!result) redirect("/admin/users?status=missing");

  const context = getAdminRequestContext(await headers());
  await new AdminAuthRepository(prisma).appendAuditLog({
    actorId: session.userId,
    action: result.roleChanged ? "STATUS_CHANGE" : "UPDATE",
    entityType: "User",
    entityId: result.updated.id,
    metadata: {
      targetUserId: result.updated.id,
      changedFields: ["name", "email", "role"],
      fromRole: result.previousRole,
      toRole: result.updated.role,
      roleChanged: result.roleChanged,
      sessionsRevoked: result.roleChanged,
    },
    context,
  });

  revalidateUserManagementPaths(parsed.data.id);
  redirect(`/admin/users/${parsed.data.id}?status=updated`);
}

export async function deactivateAdminUser(formData: FormData) {
  await setAdminUserActiveState(formData, false);
}

export async function activateAdminUser(formData: FormData) {
  await setAdminUserActiveState(formData, true);
}

export async function assignAdminUserRole(formData: FormData) {
  const session = await requirePermission("users.assignRole");
  await assertSameOriginAction();
  const parsed = userRoleAssignmentSchema.safeParse({
    id: formData.get("id"),
    role: formData.get("role"),
  });
  if (!parsed.success) redirect("/admin/users?status=invalid");

  const repository = new PrismaAdminUserRepository(prisma);
  const target = await repository.getAdminUserById(parsed.data.id);
  if (!target) redirect("/admin/users?status=missing");

  const activeSuperAdminCount = await repository.countActiveSuperAdmins();
  if (
    !canManageUser(session, target, "assignRole", {
      nextRole: parsed.data.role,
      activeSuperAdminCount,
    })
  ) {
    redirect("/admin/forbidden");
  }

  const result = await repository.updateAdminUser({
    id: parsed.data.id,
    name: target.name,
    email: target.email,
    role: parsed.data.role,
    updatedById: session.userId,
  });

  if (!result) redirect("/admin/users?status=missing");

  await new AdminAuthRepository(prisma).appendAuditLog({
    actorId: session.userId,
    action: "STATUS_CHANGE",
    entityType: "User",
    entityId: parsed.data.id,
    metadata: {
      targetUserId: parsed.data.id,
      fromRole: target.role,
      toRole: parsed.data.role,
      sessionsRevoked: result.roleChanged,
    },
    context: getAdminRequestContext(await headers()),
  });

  revalidateUserManagementPaths(parsed.data.id);
  redirect(`/admin/users/${parsed.data.id}?status=role-updated`);
}

export async function forceAdminUserPasswordReset(formData: FormData) {
  const session = await requirePermission("users.password.forceReset");
  await assertSameOriginAction();
  const parsed = userActionIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) redirect("/admin/users?status=invalid");

  const repository = new PrismaAdminUserRepository(prisma);
  const target = await repository.getAdminUserById(parsed.data.id);
  if (!target) redirect("/admin/users?status=missing");
  if (!canManageUser(session, target, "forcePasswordReset")) {
    redirect("/admin/forbidden");
  }

  const rawToken = generatePasswordResetToken();
  const expiresAt = getPasswordResetExpiresAt();
  const result = await repository.forcePasswordReset({
    id: parsed.data.id,
    actorId: session.userId,
    resetTokenHash: hashPasswordResetToken(rawToken),
    resetExpiresAt: expiresAt,
  });

  const context = getAdminRequestContext(await headers());
  await new AdminAuthRepository(prisma).appendAuditLog({
    actorId: session.userId,
    action: "PASSWORD_RESET_REQUESTED",
    entityType: "User",
    entityId: parsed.data.id,
    metadata: {
      targetUserId: parsed.data.id,
      forced: true,
      revokedCount: result.revokedCount,
    },
    context,
  });

  const emailQueued = await sendSetupEmail({
    email: target.email,
    name: target.name,
    token: rawToken,
    expiresAt,
    auditEntityId: target.id,
    actorId: session.userId,
    context,
  });

  revalidateUserManagementPaths(parsed.data.id);
  redirect(`/admin/users/${parsed.data.id}?status=${emailQueued ? "reset-sent" : "reset-email-failed"}`);
}

export async function revokeAdminUserSession(formData: FormData) {
  const session = await requirePermission("users.sessions.revoke");
  await assertSameOriginAction();
  const parsed = userSessionRevokeSchema.safeParse({
    userId: formData.get("userId"),
    sessionId: formData.get("sessionId"),
  });
  if (!parsed.success) redirect("/admin/users?status=invalid");

  const repository = new PrismaAdminUserRepository(prisma);
  const target = await repository.getAdminUserById(parsed.data.userId);
  if (!target) redirect("/admin/users?status=missing");
  if (!canManageUser(session, target, "revokeSessions")) {
    redirect("/admin/forbidden");
  }

  const result = await repository.revokeUserSessions(parsed.data);
  await new AdminAuthRepository(prisma).appendAuditLog({
    actorId: session.userId,
    action: "SESSION_REVOKED",
    entityType: "AdminSession",
    entityId: parsed.data.sessionId,
    metadata: {
      targetUserId: parsed.data.userId,
      revokedCount: result.count,
      crossUser: true,
    },
    context: getAdminRequestContext(await headers()),
  });

  revalidateUserManagementPaths(parsed.data.userId);
  redirect(`/admin/users/${parsed.data.userId}?status=session-revoked`);
}

export async function revokeAllAdminUserSessions(formData: FormData) {
  const session = await requirePermission("users.sessions.revoke");
  await assertSameOriginAction();
  const parsed = userActionIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) redirect("/admin/users?status=invalid");

  const repository = new PrismaAdminUserRepository(prisma);
  const target = await repository.getAdminUserById(parsed.data.id);
  if (!target) redirect("/admin/users?status=missing");
  if (!canManageUser(session, target, "revokeSessions")) {
    redirect("/admin/forbidden");
  }

  const result = await repository.revokeUserSessions({ userId: parsed.data.id });
  await new AdminAuthRepository(prisma).appendAuditLog({
    actorId: session.userId,
    action: "ALL_SESSIONS_REVOKED",
    entityType: "User",
    entityId: parsed.data.id,
    metadata: {
      targetUserId: parsed.data.id,
      revokedCount: result.count,
      crossUser: true,
    },
    context: getAdminRequestContext(await headers()),
  });

  revalidateUserManagementPaths(parsed.data.id);
  redirect(`/admin/users/${parsed.data.id}?status=sessions-revoked`);
}

export async function clearAdminUserLock(formData: FormData) {
  const session = await requirePermission("users.update");
  await assertSameOriginAction();
  const parsed = userActionIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) redirect("/admin/users?status=invalid");

  const repository = new PrismaAdminUserRepository(prisma);
  const target = await repository.getAdminUserById(parsed.data.id);
  if (!target) redirect("/admin/users?status=missing");
  if (!canManageUser(session, target, "clearLock")) redirect("/admin/forbidden");

  await repository.clearUserLock({
    userId: parsed.data.id,
    actorId: session.userId,
  });
  await new AdminAuthRepository(prisma).appendAuditLog({
    actorId: session.userId,
    action: "UPDATE",
    entityType: "User",
    entityId: parsed.data.id,
    metadata: { targetUserId: parsed.data.id, clearedLock: true },
    context: getAdminRequestContext(await headers()),
  });

  revalidateUserManagementPaths(parsed.data.id);
  redirect(`/admin/users/${parsed.data.id}?status=lock-cleared`);
}

async function setAdminUserActiveState(formData: FormData, isActive: boolean) {
  const session = await requirePermission(
    isActive ? "users.activate" : "users.deactivate"
  );
  await assertSameOriginAction();

  const parsed = userActiveStateSchema.safeParse({
    id: formData.get("id"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) redirect("/admin/users?status=invalid");
  if (!isActive && !parsed.data.reason) {
    redirect(`/admin/users/${parsed.data.id}?status=reason-required`);
  }

  const repository = new PrismaAdminUserRepository(prisma);
  const target = await repository.getAdminUserById(parsed.data.id);
  if (!target) redirect("/admin/users?status=missing");
  const activeSuperAdminCount = await repository.countActiveSuperAdmins();
  const operation: UserManagementOperation = isActive ? "activate" : "deactivate";
  if (
    !canManageUser(session, target, operation, {
      activeSuperAdminCount,
    })
  ) {
    redirect("/admin/forbidden");
  }

  const result = await repository.setUserActiveState({
    id: parsed.data.id,
    isActive,
    actorId: session.userId,
    reason: parsed.data.reason,
  });
  await new AdminAuthRepository(prisma).appendAuditLog({
    actorId: session.userId,
    action: "STATUS_CHANGE",
    entityType: "User",
    entityId: parsed.data.id,
    metadata: {
      targetUserId: parsed.data.id,
      active: result.updated.isActive,
      revokedCount: result.revokedCount,
      reasonProvided: Boolean(parsed.data.reason),
    },
    context: getAdminRequestContext(await headers()),
  });

  revalidateUserManagementPaths(parsed.data.id);
  redirect(
    `/admin/users/${parsed.data.id}?status=${isActive ? "activated" : "deactivated"}`
  );
}

async function sendSetupEmail(input: {
  email: string;
  name: string;
  token: string;
  expiresAt: Date;
  auditEntityId: string;
  actorId: string;
  context: ReturnType<typeof getAdminRequestContext>;
}) {
  const resetUrl = await publicAbsoluteUrl(
    `/admin/reset-password?token=${encodeURIComponent(input.token)}`
  );
  try {
    await getTransactionalEmailService().sendPasswordResetEmail({
      recipientEmail: input.email,
      recipientName: input.name,
      resetUrl,
      expiresAt: input.expiresAt,
    });
  } catch {
    await new AdminAuthRepository(prisma).appendAuditLog({
      actorId: input.actorId,
      action: "PASSWORD_RESET_REQUESTED",
      entityType: "User",
      entityId: input.auditEntityId,
      metadata: { delivery: "failed", setup: true },
      context: input.context,
    });
    return false;
  }
  await new AdminAuthRepository(prisma).appendAuditLog({
    actorId: input.actorId,
    action: "PASSWORD_RESET_REQUESTED",
    entityType: "User",
    entityId: input.auditEntityId,
    metadata: { delivery: "queued", setup: true },
    context: input.context,
  });
  return true;
}

function revalidateUserManagementPaths(userId: string) {
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath(`/admin/users/${userId}/edit`);
  revalidatePath("/admin/roles");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/service-requests");
}

async function assertSameOriginAction() {
  if (!isSameOriginHeaders(await headers())) {
    throw new Error("Request origin could not be verified.");
  }
}
