import type { AuditAction, Prisma, PrismaClient, Role } from "@prisma/client";

import type { AdminRequestContext } from "@/lib/auth/request-context";
import { canAuthenticateAdminSession } from "@/lib/auth/session-validation";

export type AuthUserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  lockedUntil: Date | null;
};

export type AuthenticatedAdminSession = {
  id: string;
  userId: string;
  role: Role;
  name: string;
  email: string;
  expiresAt: Date;
};

export class AdminAuthRepository {
  constructor(private readonly client: PrismaClient) {}

  findUserByEmail(email: string) {
    return this.client.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
        lockedUntil: true,
      },
    });
  }

  async createSession(input: {
    user: AuthUserRecord;
    tokenHash: string;
    expiresAt: Date;
    context: AdminRequestContext;
  }) {
    const session = await this.client.adminSession.create({
      data: {
        userId: input.user.id,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        lastSeenAt: new Date(),
        ipAddress: input.context.ipAddress,
        userAgent: input.context.userAgent,
      },
    });

    await this.client.user.update({
      where: { id: input.user.id },
      data: {
        lastLoginAt: new Date(),
        failedLoginCount: 0,
      },
    });

    return session;
  }

  recordFailedLogin(userId: string) {
    return this.client.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: {
          increment: 1,
        },
      },
    });
  }

  async findValidSessionByTokenHash(tokenHash: string, now = new Date()) {
    const session = await this.client.adminSession.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!session || !canAuthenticateAdminSession(session, now)) {
      return null;
    }

    if (shouldUpdateLastSeen(session.lastSeenAt, now)) {
      await this.client.adminSession.update({
        where: { id: session.id },
        data: { lastSeenAt: now },
      });
    }

    return {
      id: session.id,
      userId: session.user.id,
      role: session.user.role,
      name: session.user.name,
      email: session.user.email,
      expiresAt: session.expiresAt,
    } satisfies AuthenticatedAdminSession;
  }

  async revokeSessionByTokenHash(tokenHash: string) {
    const session = await this.client.adminSession.findUnique({
      where: { tokenHash },
      select: { id: true, revokedAt: true, userId: true },
    });

    if (!session || session.revokedAt) {
      return null;
    }

    return this.client.adminSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
  }

  revokeAllUserSessions(userId: string) {
    return this.client.adminSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  deleteExpiredSessions(now = new Date()) {
    return this.client.adminSession.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });
  }

  appendAuditLog(input: {
    actorId?: string | null;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
    context: AdminRequestContext;
  }) {
    return this.client.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata,
        ipAddress: input.context.ipAddress,
        userAgent: input.context.userAgent,
      },
    });
  }
}

export function normalizeAdminEmail(email: string) {
  return email.trim().toLowerCase();
}

export function shouldUpdateLastSeen(
  lastSeenAt: Date | null,
  now = new Date(),
  throttleMs = 5 * 60 * 1000
) {
  return !lastSeenAt || now.getTime() - lastSeenAt.getTime() >= throttleMs;
}
