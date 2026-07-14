import type { Prisma, PrismaClient } from "@prisma/client";

import { stripForbiddenAuditMetadata } from "@/lib/audit/audit-presentation";
import type { AdminRequestContext } from "@/lib/auth/request-context";
import { assertServerOnly } from "@/lib/auth/server-only";

assertServerOnly("account security repository");

export type SafeAdminSessionRecord = {
  id: string;
  createdAt: Date;
  lastSeenAt: Date | null;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  remembered: boolean;
  isCurrent: boolean;
};

export class AccountSecurityRepository {
  constructor(private readonly client: PrismaClient) {}

  getUserSecurityRecord(userId: string) {
    return this.client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
        passwordChangedAt: true,
        failedLoginCount: true,
        lockedUntil: true,
        mfaEnabled: true,
        mfaVerifiedAt: true,
        securityVersion: true,
      },
    });
  }

  async listOwnSessions(userId: string, currentSessionId: string) {
    const sessions = await this.client.adminSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: [{ lastSeenAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        createdAt: true,
        lastSeenAt: true,
        expiresAt: true,
        ipAddress: true,
        userAgent: true,
        remembered: true,
      },
    });

    return sessions.map((session) => ({
      ...session,
      isCurrent: session.id === currentSessionId,
    })) satisfies SafeAdminSessionRecord[];
  }

  createPasswordResetToken(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    context: AdminRequestContext;
  }) {
    return this.client.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: { userId: input.userId, usedAt: null },
        data: { usedAt: new Date() },
      });

      return tx.passwordResetToken.create({
        data: {
          userId: input.userId,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
          requestedIp: input.context.ipAddress,
          userAgent: input.context.userAgent,
        },
        select: { id: true, expiresAt: true },
      });
    });
  }

  getValidPasswordResetToken(tokenHash: string, now = new Date()) {
    return this.client.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: now },
        user: { isActive: true },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            isActive: true,
          },
        },
      },
    });
  }

  resetPasswordWithToken(input: {
    tokenHash: string;
    passwordHash: string;
  }) {
    return this.client.$transaction(async (tx) => {
      const token = await tx.passwordResetToken.findFirst({
        where: {
          tokenHash: input.tokenHash,
          usedAt: null,
          expiresAt: { gt: new Date() },
          user: { isActive: true },
        },
        select: { id: true, userId: true },
      });

      if (!token) return null;

      await tx.user.update({
        where: { id: token.userId },
        data: {
          passwordHash: input.passwordHash,
          passwordChangedAt: new Date(),
          failedLoginCount: 0,
          lockedUntil: null,
          securityVersion: { increment: 1 },
        },
      });
      await tx.passwordResetToken.updateMany({
        where: { userId: token.userId, usedAt: null },
        data: { usedAt: new Date() },
      });
      await tx.adminSession.updateMany({
        where: { userId: token.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      return token;
    });
  }

  changePassword(input: {
    userId: string;
    currentSessionId: string;
    passwordHash: string;
  }) {
    return this.client.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: input.userId },
        data: {
          passwordHash: input.passwordHash,
          passwordChangedAt: new Date(),
          failedLoginCount: 0,
          lockedUntil: null,
          securityVersion: { increment: 1 },
        },
      });
      return tx.adminSession.updateMany({
        where: {
          userId: input.userId,
          revokedAt: null,
          id: { not: input.currentSessionId },
        },
        data: { revokedAt: new Date() },
      });
    });
  }

  revokeOwnSession(input: { userId: string; sessionId: string }) {
    return this.client.adminSession.updateMany({
      where: {
        id: input.sessionId,
        userId: input.userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  revokeOtherOwnSessions(userId: string, currentSessionId: string) {
    return this.client.adminSession.updateMany({
      where: {
        userId,
        revokedAt: null,
        id: { not: currentSessionId },
      },
      data: { revokedAt: new Date() },
    });
  }

  revokeAllOwnSessions(userId: string) {
    return this.client.adminSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  cleanupExpiredSessions(now = new Date()) {
    return this.client.adminSession.deleteMany({
      where: { expiresAt: { lt: now } },
    });
  }

  async replaceRecoveryCodes(input: {
    userId: string;
    codeHashes: string[];
  }) {
    await this.client.$transaction(async (tx) => {
      await tx.mfaRecoveryCode.updateMany({
        where: { userId: input.userId, usedAt: null },
        data: { usedAt: new Date() },
      });
      await tx.mfaRecoveryCode.createMany({
        data: input.codeHashes.map((codeHash) => ({
          userId: input.userId,
          codeHash,
        })),
      });
    });
  }

  appendAuditLog(input: {
    actorId?: string | null;
    action: Prisma.AuditLogCreateInput["action"];
    entityType: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
    context: AdminRequestContext;
  }) {
    const safeMetadata = stripForbiddenAuditMetadata(input.metadata);
    return this.client.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: safeMetadata as Prisma.InputJsonValue,
        ipAddress: input.context.ipAddress,
        userAgent: input.context.userAgent?.slice(0, 512),
      },
    });
  }
}
