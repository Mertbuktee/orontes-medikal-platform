import type { Prisma, PrismaClient, Role } from "@prisma/client";

import type { Permission } from "@/lib/rbac/permissions";
import { rolePermissions } from "@/lib/rbac/permissions";
import { normalizeAdminEmail } from "@/lib/auth/admin-auth-repository";

export type AdminUserListInput = {
  page?: number;
  pageSize?: number;
  query?: string;
  role?: Role;
  active?: "active" | "inactive" | "all";
  mfa?: "enabled" | "disabled" | "all";
  locked?: "locked" | "unlocked" | "all";
  sort?: "newest" | "oldest" | "updated";
};

export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  mfaEnabled: boolean;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  activeSessionCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export class PrismaAdminUserRepository {
  constructor(private readonly client: PrismaClient) {}

  async listAdminUsers(input: AdminUserListInput = {}) {
    const page = input.page && input.page > 0 ? input.page : 1;
    const pageSize = [20, 50, 100].includes(input.pageSize ?? 20)
      ? input.pageSize ?? 20
      : 20;
    const now = new Date();
    const where = getUserListWhere(input, now);

    const [records, total] = await this.client.$transaction([
      this.client.user.findMany({
        where,
        orderBy: getUserOrderBy(input.sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          mfaEnabled: true,
          lockedUntil: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          adminSessions: {
            where: { revokedAt: null, expiresAt: { gt: now } },
            select: { id: true },
          },
        },
      }),
      this.client.user.count({ where }),
    ]);

    return {
      items: records.map((record) => ({
        id: record.id,
        name: record.name,
        email: record.email,
        role: record.role,
        isActive: record.isActive,
        mfaEnabled: record.mfaEnabled,
        lockedUntil: record.lockedUntil,
        lastLoginAt: record.lastLoginAt,
        activeSessionCount: record.adminSessions.length,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      })),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getAdminUserById(id: string) {
    const now = new Date();
    const user = await this.client.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        passwordChangedAt: true,
        failedLoginCount: true,
        lockedUntil: true,
        mfaEnabled: true,
        mfaVerifiedAt: true,
        securityVersion: true,
        createdAt: true,
        updatedAt: true,
        createdBy: { select: { id: true, name: true, email: true } },
        updatedBy: { select: { id: true, name: true, email: true } },
        deactivatedAt: true,
        deactivationReason: true,
        deactivatedBy: { select: { id: true, name: true, email: true } },
        assignedRequests: {
          where: { archivedAt: null, status: { notIn: ["COMPLETED", "CANCELLED", "ARCHIVED"] } },
          select: { id: true },
        },
        adminSessions: {
          where: { revokedAt: null, expiresAt: { gt: now } },
          orderBy: [{ lastSeenAt: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            createdAt: true,
            lastSeenAt: true,
            expiresAt: true,
            remembered: true,
            userAgent: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      ...user,
      activeAssignedRequestCount: user.assignedRequests.length,
      activeSessionCount: user.adminSessions.length,
      effectivePermissions: this.getUserEffectivePermissions(user.role),
      adminSessions: user.adminSessions.map((session) => ({
        id: session.id,
        createdAt: session.createdAt,
        lastSeenAt: session.lastSeenAt,
        expiresAt: session.expiresAt,
        remembered: session.remembered,
        clientSummary: summarizeUserAgent(session.userAgent),
      })),
      assignedRequests: undefined,
    };
  }

  createAdminUser(input: {
    name: string;
    email: string;
    role: Role;
    isActive: boolean;
    passwordHash: string;
    createdById: string;
    resetTokenHash: string;
    resetExpiresAt: Date;
  }) {
    return this.client.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: normalizeAdminEmail(input.email),
          role: input.role,
          isActive: input.isActive,
          passwordHash: input.passwordHash,
          createdById: input.createdById,
          updatedById: input.createdById,
          passwordResetTokens: {
            create: {
              tokenHash: input.resetTokenHash,
              expiresAt: input.resetExpiresAt,
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      return user;
    });
  }

  async updateAdminUser(input: {
    id: string;
    name: string;
    email: string;
    role: Role;
    updatedById: string;
  }) {
    return this.client.$transaction(async (tx) => {
      const current = await tx.user.findUnique({
        where: { id: input.id },
        select: { id: true, email: true, role: true },
      });

      if (!current) return null;

      if (current.email !== input.email) {
        await tx.passwordResetToken.updateMany({
          where: { userId: input.id, usedAt: null },
          data: { usedAt: new Date() },
        });
      }

      const roleChanged = current.role !== input.role;
      const updated = await tx.user.update({
        where: { id: input.id },
        data: {
          name: input.name,
          email: normalizeAdminEmail(input.email),
          role: input.role,
          updatedById: input.updatedById,
          securityVersion: roleChanged ? { increment: 1 } : undefined,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      if (roleChanged) {
        await tx.adminSession.updateMany({
          where: { userId: input.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      return { updated, previousRole: current.role, roleChanged };
    });
  }

  async setUserActiveState(input: {
    id: string;
    isActive: boolean;
    actorId: string;
    reason?: string;
  }) {
    return this.client.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: input.id },
        data: input.isActive
          ? {
              isActive: true,
              deactivatedAt: null,
              deactivatedById: null,
              deactivationReason: null,
              updatedById: input.actorId,
            }
          : {
              isActive: false,
              deactivatedAt: new Date(),
              deactivatedById: input.actorId,
              deactivationReason: input.reason,
              updatedById: input.actorId,
            },
        select: { id: true, role: true, isActive: true },
      });

      let revokedCount = 0;
      if (!input.isActive) {
        const revoked = await tx.adminSession.updateMany({
          where: { userId: input.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        revokedCount = revoked.count;
        await tx.passwordResetToken.updateMany({
          where: { userId: input.id, usedAt: null },
          data: { usedAt: new Date() },
        });
      }

      return { updated, revokedCount };
    });
  }

  async forcePasswordReset(input: {
    id: string;
    actorId: string;
    resetTokenHash: string;
    resetExpiresAt: Date;
  }) {
    return this.client.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: { userId: input.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      const token = await tx.passwordResetToken.create({
        data: {
          userId: input.id,
          tokenHash: input.resetTokenHash,
          expiresAt: input.resetExpiresAt,
        },
      });
      const revoked = await tx.adminSession.updateMany({
        where: { userId: input.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.user.update({
        where: { id: input.id },
        data: {
          updatedById: input.actorId,
          securityVersion: { increment: 1 },
        },
      });
      return { token, revokedCount: revoked.count };
    });
  }

  async revokeUserSessions(input: { userId: string; sessionId?: string }) {
    return this.client.adminSession.updateMany({
      where: {
        userId: input.userId,
        id: input.sessionId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  clearUserLock(input: { userId: string; actorId: string }) {
    return this.client.user.update({
      where: { id: input.userId },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        updatedById: input.actorId,
      },
      select: { id: true, lockedUntil: true },
    });
  }

  countActiveSuperAdmins() {
    return this.client.user.count({
      where: { role: "SUPER_ADMIN", isActive: true },
    });
  }

  async emailExists(email: string, exceptUserId?: string) {
    const count = await this.client.user.count({
      where: {
        email: normalizeAdminEmail(email),
        id: exceptUserId ? { not: exceptUserId } : undefined,
      },
    });
    return count > 0;
  }

  getUserEffectivePermissions(role: Role): Permission[] {
    return [...rolePermissions[role]];
  }

  getRoleUserCounts() {
    return this.client.user.groupBy({
      by: ["role"],
      where: { isActive: true },
      _count: { role: true },
    });
  }

  listRecentUserAuditEvents(userId: string, take = 12) {
    return this.client.auditLog.findMany({
      where: {
        OR: [
          { entityType: "User", entityId: userId },
          { actorId: userId },
          { metadata: { path: ["targetUserId"], equals: userId } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
    });
  }

  listAssignableUsersForServiceRequests() {
    const assignableRoles: Role[] = ["SUPER_ADMIN", "ADMIN", "SERVICE_STAFF"];
    return this.client.user.findMany({
      where: { isActive: true, role: { in: assignableRoles } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true },
    });
  }
}

function getUserListWhere(input: AdminUserListInput, now: Date) {
  const where: Prisma.UserWhereInput = {};
  const and: Prisma.UserWhereInput[] = [];

  if (input.query) {
    and.push({
      OR: [
        { name: { contains: input.query, mode: "insensitive" } },
        { email: { contains: input.query, mode: "insensitive" } },
      ],
    });
  }

  if (input.role) where.role = input.role;
  if (input.active === "active") where.isActive = true;
  if (input.active === "inactive") where.isActive = false;
  if (input.mfa === "enabled") where.mfaEnabled = true;
  if (input.mfa === "disabled") where.mfaEnabled = false;
  if (input.locked === "locked") where.lockedUntil = { gt: now };
  if (input.locked === "unlocked") {
    and.push({ OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }] });
  }

  if (and.length > 0) where.AND = and;

  return where;
}

function getUserOrderBy(sort: AdminUserListInput["sort"]) {
  if (sort === "oldest") return { createdAt: "asc" } satisfies Prisma.UserOrderByWithRelationInput;
  if (sort === "updated") return { updatedAt: "desc" } satisfies Prisma.UserOrderByWithRelationInput;
  return { createdAt: "desc" } satisfies Prisma.UserOrderByWithRelationInput;
}

function summarizeUserAgent(userAgent: string | null) {
  if (!userAgent) return "Bilinmeyen istemci";
  if (userAgent.includes("Chrome")) return "Chrome tabanlı tarayıcı";
  if (userAgent.includes("Firefox")) return "Firefox tarayıcı";
  if (userAgent.includes("Safari")) return "Safari tarayıcı";
  if (userAgent.includes("Edg")) return "Edge tarayıcı";
  return "Admin oturumu";
}
