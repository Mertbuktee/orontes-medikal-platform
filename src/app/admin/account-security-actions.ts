"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  genericForgotPasswordMessage,
  forgotPasswordSchema,
  passwordChangeSchema,
  resetPasswordSchema,
  revokeSessionSchema,
} from "@/lib/auth/account-security-validation";
import { AccountSecurityRepository } from "@/lib/auth/account-security-repository";
import {
  createAccountSecurityRateLimitKey,
  recordAccountSecurityAttempt,
  resetAccountSecurityAttempts,
} from "@/lib/auth/account-rate-limit";
import { getCurrentAdminSession, requireAdminSession } from "@/lib/auth/admin-session";
import { AdminAuthRepository } from "@/lib/auth/admin-auth-repository";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  generatePasswordResetToken,
  getPasswordResetExpiresAt,
  hashPasswordResetToken,
} from "@/lib/auth/password-reset";
import { getAdminRequestContext } from "@/lib/auth/request-context";
import {
  ADMIN_SESSION_COOKIE_NAME,
  getExpiredAdminSessionCookieOptions,
} from "@/lib/auth/session-cookie";
import { getTransactionalEmailService } from "@/lib/auth/transactional-email";
import { prisma } from "@/lib/database/prisma";
import { publicAbsoluteUrl } from "@/lib/site-settings/public-site-settings";
import { isSameOriginHeaders } from "@/lib/security/action-origin";

export type AccountSecurityActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const defaultState: AccountSecurityActionState = {
  success: false,
  message: "",
};

export async function changeOwnPassword(
  _state: AccountSecurityActionState = defaultState,
  formData: FormData
): Promise<AccountSecurityActionState> {
  void _state;
  const session = await requireAdminSession();
  await assertSameOriginAction();

  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Şifre bilgileri geçersiz.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const repository = new AccountSecurityRepository(prisma);
  const user = await repository.getUserSecurityRecord(session.userId);

  if (!user || !(await verifyPassword(user.passwordHash, parsed.data.currentPassword))) {
    return { success: false, message: "Mevcut şifre doğrulanamadı." };
  }

  if (await verifyPassword(user.passwordHash, parsed.data.newPassword)) {
    return {
      success: false,
      message: "Yeni şifre mevcut şifreden farklı olmalıdır.",
    };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  const result = await repository.changePassword({
    userId: session.userId,
    currentSessionId: session.id,
    passwordHash,
  });
  await repository.appendAuditLog({
    actorId: session.userId,
    action: "PASSWORD_CHANGED",
    entityType: "User",
    entityId: session.userId,
    metadata: { revokedOtherSessions: result.count },
    context: getAdminRequestContext(await headers()),
  });

  return {
    success: true,
    message: "Şifreniz güncellendi. Diğer oturumlar iptal edildi.",
  };
}

export async function requestPasswordReset(
  _state: AccountSecurityActionState = defaultState,
  formData: FormData
): Promise<AccountSecurityActionState> {
  void _state;
  await assertSameOriginAction();
  const context = getAdminRequestContext(await headers());
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { success: true, message: genericForgotPasswordMessage };
  }

  const rateLimitKey = createAccountSecurityRateLimitKey(
    "forgot-password",
    parsed.data.email,
    context.ipAddress
  );
  const limit = recordAccountSecurityAttempt(rateLimitKey);
  if (!limit.allowed) {
    return { success: true, message: genericForgotPasswordMessage };
  }

  const repository = new AccountSecurityRepository(prisma);
  const authRepository = new AdminAuthRepository(prisma);
  const user = await authRepository.findUserByEmail(parsed.data.email);

  if (!user || !user.isActive) {
    return { success: true, message: genericForgotPasswordMessage };
  }

  const rawToken = generatePasswordResetToken();
  const expiresAt = getPasswordResetExpiresAt();
  const resetToken = await repository.createPasswordResetToken({
    userId: user.id,
    tokenHash: hashPasswordResetToken(rawToken),
    expiresAt,
    context,
  });
  const resetUrl = await publicAbsoluteUrl(
    `/admin/reset-password?token=${encodeURIComponent(rawToken)}`
  );

  try {
    await getTransactionalEmailService().sendPasswordResetEmail({
      recipientEmail: user.email,
      recipientName: user.name,
      resetUrl,
      expiresAt,
    });
    resetAccountSecurityAttempts(rateLimitKey);
  } catch {
    await repository.appendAuditLog({
      actorId: user.id,
      action: "PASSWORD_RESET_REQUESTED",
      entityType: "PasswordResetToken",
      entityId: resetToken.id,
      metadata: { delivery: "failed" },
      context,
    });
    return {
      success: false,
      message: "Parola sıfırlama servisi geçici olarak kullanılamıyor.",
    };
  }

  await repository.appendAuditLog({
    actorId: user.id,
    action: "PASSWORD_RESET_REQUESTED",
    entityType: "PasswordResetToken",
    entityId: resetToken.id,
    metadata: { delivery: "queued" },
    context,
  });

  return { success: true, message: genericForgotPasswordMessage };
}

export async function resetPassword(
  _state: AccountSecurityActionState = defaultState,
  formData: FormData
): Promise<AccountSecurityActionState> {
  void _state;
  await assertSameOriginAction();
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Parola sıfırlama bilgileri geçersiz.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const tokenHash = hashPasswordResetToken(parsed.data.token);
  const repository = new AccountSecurityRepository(prisma);
  const token = await repository.getValidPasswordResetToken(tokenHash);

  if (!token) {
    return { success: false, message: "Parola sıfırlama bağlantısı geçersiz veya süresi dolmuş." };
  }

  if (await verifyPassword(token.user.passwordHash, parsed.data.newPassword)) {
    return {
      success: false,
      message: "Yeni şifre mevcut şifreden farklı olmalıdır.",
    };
  }

  const result = await repository.resetPasswordWithToken({
    tokenHash,
    passwordHash: await hashPassword(parsed.data.newPassword),
  });

  if (!result) {
    return { success: false, message: "Parola sıfırlama bağlantısı geçersiz veya süresi dolmuş." };
  }

  await repository.appendAuditLog({
    actorId: result.userId,
    action: "PASSWORD_RESET_COMPLETED",
    entityType: "PasswordResetToken",
    entityId: result.id,
    metadata: { sessionsRevoked: true },
    context: getAdminRequestContext(await headers()),
  });

  redirect("/admin/login?reset=success");
}

export async function revokeOwnSession(formData: FormData) {
  const session = await requireAdminSession();
  await assertSameOriginAction();
  const parsed = revokeSessionSchema.safeParse({
    sessionId: formData.get("sessionId"),
  });
  if (!parsed.success) redirect("/admin/account/security?status=invalid-session");

  const repository = new AccountSecurityRepository(prisma);
  const result = await repository.revokeOwnSession({
    userId: session.userId,
    sessionId: parsed.data.sessionId,
  });
  await repository.appendAuditLog({
    actorId: session.userId,
    action: "SESSION_REVOKED",
    entityType: "AdminSession",
    entityId: parsed.data.sessionId,
    metadata: { selfService: true },
    context: getAdminRequestContext(await headers()),
  });

  if (result.count > 0 && parsed.data.sessionId === session.id) {
    (await cookies()).set(
      ADMIN_SESSION_COOKIE_NAME,
      "",
      getExpiredAdminSessionCookieOptions()
    );
    redirect("/admin/login");
  }

  redirect("/admin/account/security?status=session-revoked");
}

export async function revokeOtherOwnSessions() {
  const session = await requireAdminSession();
  await assertSameOriginAction();
  const repository = new AccountSecurityRepository(prisma);
  const result = await repository.revokeOtherOwnSessions(session.userId, session.id);
  await repository.appendAuditLog({
    actorId: session.userId,
    action: "ALL_SESSIONS_REVOKED",
    entityType: "AdminSession",
    entityId: session.id,
    metadata: { revokedCount: result.count, currentPreserved: true },
    context: getAdminRequestContext(await headers()),
  });

  redirect("/admin/account/security?status=other-sessions-revoked");
}

export async function revokeAllOwnSessions() {
  const session = await getCurrentAdminSession();
  if (!session) redirect("/admin/login");
  await assertSameOriginAction();
  const repository = new AccountSecurityRepository(prisma);
  const result = await repository.revokeAllOwnSessions(session.userId);
  await repository.appendAuditLog({
    actorId: session.userId,
    action: "ALL_SESSIONS_REVOKED",
    entityType: "AdminSession",
    entityId: session.id,
    metadata: { revokedCount: result.count, currentPreserved: false },
    context: getAdminRequestContext(await headers()),
  });
  (await cookies()).set(
    ADMIN_SESSION_COOKIE_NAME,
    "",
    getExpiredAdminSessionCookieOptions()
  );
  redirect("/admin/login");
}

async function assertSameOriginAction() {
  if (!isSameOriginHeaders(await headers())) {
    throw new Error("Request origin could not be verified.");
  }
}
