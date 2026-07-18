import type { AuditAction, PrismaClient, Role } from "@prisma/client";

import {
  getAuditCategoryLabel,
  getAuditSeverityLabel,
  presentAuditEvent,
  redactIpAddress,
  summarizeUserAgent,
  type AuditCategory,
  type AuditPresentation,
  type AuditSeverity,
  type AuditSuccess,
  type SafeMetadataItem,
} from "@/lib/audit/audit-presentation";
import type {
  AuditExportInput,
  AuditListInput,
  SecurityRange,
} from "@/lib/audit/audit-validation";

export type AuditListItem = {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  actor: {
    id: string;
    name: string;
    emailLabel: string;
    role: Role;
  } | null;
  createdAt: Date;
  presentation: AuditPresentation;
  ipAddressLabel: string;
  userAgentLabel: string;
};

export type AuditDetail = AuditListItem & {
  safeMetadata: SafeMetadataItem[];
  relatedEvents: AuditListItem[];
};

export type AuditListResult = {
  items: AuditListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type SecurityCenterSummary = {
  rangeLabel: string;
  authentication: {
    successfulLogins: number;
    failedLogins: number;
    accountLocks: number;
    passwordResetRequests: number;
    passwordResetCompletions: number;
    mfaFailures: number;
    recoveryCodeUses: number;
  };
  accounts: {
    total: number;
    active: number;
    inactive: number;
    locked: number;
    mfaEnabled: number;
    mfaDisabled: number;
    byRole: Array<{ role: Role; count: number }>;
  };
  sessions: {
    active: number;
    remembered: number;
    expiredUncleaned: number;
    revokedInRange: number;
    recent: Array<{
      id: string;
      userName: string;
      userRole: Role;
      createdAt: Date;
      lastSeenAt: Date | null;
      expiresAt: Date;
      remembered: boolean;
      ipAddressLabel: string;
      userAgentLabel: string;
    }>;
  };
  configuration: Array<{
    key: string;
    label: string;
    status: "ok" | "warning" | "info";
    description: string;
  }>;
  recommendations: Array<{
    key: string;
    severity: "info" | "warning";
    title: string;
    description: string;
    href?: string;
  }>;
  recentSecurityEvents: AuditListItem[];
};

const rangeLabels: Record<SecurityRange, string> = {
  "24h": "Son 24 saat",
  "7d": "Son 7 gun",
  "30d": "Son 30 gun",
  "90d": "Son 90 gun",
};

const rangeDays: Record<SecurityRange, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export class PrismaAuditLogRepository {
  constructor(private readonly client: PrismaClient) {}

  async listAuditEvents(input: AuditListInput): Promise<AuditListResult> {
    const where = buildAuditWhere(input);
    const orderBy = { createdAt: input.sort === "oldest" ? "asc" : "desc" } as const;
    const overfetchMultiplier =
      input.category || input.severity || input.success ? 5 : 1;
    const take = input.pageSize * overfetchMultiplier;
    const skip = (input.page - 1) * input.pageSize;
    const [rows, total] = await Promise.all([
      this.client.auditLog.findMany({
        where,
        orderBy,
        skip,
        take,
        include: auditInclude,
      }),
      this.client.auditLog.count({ where }),
    ]);

    const filtered = rows
      .map(mapAuditRow)
      .filter((item) => matchesDerivedFilters(item.presentation, input))
      .slice(0, input.pageSize);

    return {
      items: filtered,
      total,
      page: input.page,
      pageSize: input.pageSize,
      pageCount: Math.max(1, Math.ceil(total / input.pageSize)),
    };
  }

  async getAuditEventById(id: string): Promise<AuditDetail | null> {
    const row = await this.client.auditLog.findUnique({
      where: { id },
      include: auditInclude,
    });
    if (!row) return null;

    const item = mapAuditRow(row);
    const relatedRows = await this.client.auditLog.findMany({
      where: {
        id: { not: row.id },
        OR: [
          row.entityId
            ? { entityType: row.entityType, entityId: row.entityId }
            : { entityType: row.entityType },
          row.actorId ? { actorId: row.actorId } : { id: "__none__" },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: auditInclude,
    });

    return {
      ...item,
      safeMetadata: item.presentation.safeMetadata,
      relatedEvents: relatedRows.map(mapAuditRow),
    };
  }

  async exportAuditEvents(input: AuditExportInput) {
    const where = buildAuditWhere(input);
    const rows = await this.client.auditLog.findMany({
      where,
      orderBy: { createdAt: input.sort === "oldest" ? "asc" : "desc" },
      take: input.limit,
      include: auditInclude,
    });

    return rows
      .map(mapAuditRow)
      .filter((item) => matchesDerivedFilters(item.presentation, input));
  }

  async getSecurityCenterSummary(
    range: SecurityRange
  ): Promise<SecurityCenterSummary> {
    const now = new Date();
    const since = new Date(now.getTime() - rangeDays[range] * 24 * 60 * 60 * 1000);

    const [
      authCounts,
      totalUsers,
      activeUsers,
      inactiveUsers,
      lockedUsers,
      mfaEnabledUsers,
      usersByRole,
      activeSessions,
      rememberedSessions,
      expiredUncleanedSessions,
      revokedSessions,
      recentSessions,
      recentSecurityRows,
    ] = await Promise.all([
      this.client.auditLog.groupBy({
        by: ["action"],
        where: {
          createdAt: { gte: since, lte: now },
          action: {
            in: [
              "LOGIN",
              "LOGIN_FAILURE",
              "ACCOUNT_LOCKED",
              "PASSWORD_RESET_REQUESTED",
              "PASSWORD_RESET_COMPLETED",
              "MFA_CHALLENGE_FAILURE",
              "RECOVERY_CODE_USED",
            ],
          },
        },
        _count: { action: true },
      }),
      this.client.user.count(),
      this.client.user.count({ where: { isActive: true } }),
      this.client.user.count({ where: { isActive: false } }),
      this.client.user.count({ where: { lockedUntil: { gt: now } } }),
      this.client.user.count({ where: { mfaEnabled: true } }),
      this.client.user.groupBy({
        by: ["role"],
        _count: { role: true },
      }),
      this.client.adminSession.count({
        where: { revokedAt: null, expiresAt: { gt: now } },
      }),
      this.client.adminSession.count({
        where: { revokedAt: null, expiresAt: { gt: now }, remembered: true },
      }),
      this.client.adminSession.count({
        where: { revokedAt: null, expiresAt: { lt: now } },
      }),
      this.client.adminSession.count({
        where: { revokedAt: { gte: since, lte: now } },
      }),
      this.client.adminSession.findMany({
        where: { revokedAt: null, expiresAt: { gt: now } },
        orderBy: [{ lastSeenAt: "desc" }, { createdAt: "desc" }],
        take: 8,
        select: {
          id: true,
          createdAt: true,
          lastSeenAt: true,
          expiresAt: true,
          remembered: true,
          ipAddress: true,
          userAgent: true,
          user: {
            select: {
              name: true,
              role: true,
            },
          },
        },
      }),
      this.client.auditLog.findMany({
        where: {
          createdAt: { gte: since, lte: now },
          OR: [
            { action: { in: ["LOGIN_FAILURE", "ACCOUNT_LOCKED", "MFA_CHALLENGE_FAILURE"] } },
            { entityType: { in: ["User", "AdminSession"] } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 12,
        include: auditInclude,
      }),
    ]);

    const actionCount = (action: AuditAction) =>
      authCounts.find((item) => item.action === action)?._count.action ?? 0;

    return {
      rangeLabel: rangeLabels[range],
      authentication: {
        successfulLogins: actionCount("LOGIN"),
        failedLogins: actionCount("LOGIN_FAILURE"),
        accountLocks: actionCount("ACCOUNT_LOCKED"),
        passwordResetRequests: actionCount("PASSWORD_RESET_REQUESTED"),
        passwordResetCompletions: actionCount("PASSWORD_RESET_COMPLETED"),
        mfaFailures: actionCount("MFA_CHALLENGE_FAILURE"),
        recoveryCodeUses: actionCount("RECOVERY_CODE_USED"),
      },
      accounts: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        locked: lockedUsers,
        mfaEnabled: mfaEnabledUsers,
        mfaDisabled: Math.max(0, activeUsers - mfaEnabledUsers),
        byRole: usersByRole.map((item) => ({
          role: item.role,
          count: item._count.role,
        })),
      },
      sessions: {
        active: activeSessions,
        remembered: rememberedSessions,
        expiredUncleaned: expiredUncleanedSessions,
        revokedInRange: revokedSessions,
        recent: recentSessions.map((session) => ({
          id: session.id,
          userName: session.user.name,
          userRole: session.user.role,
          createdAt: session.createdAt,
          lastSeenAt: session.lastSeenAt,
          expiresAt: session.expiresAt,
          remembered: session.remembered,
          ipAddressLabel: redactIpAddress(session.ipAddress),
          userAgentLabel: summarizeUserAgent(session.userAgent),
        })),
      },
      configuration: getSecurityConfigurationChecks(),
      recommendations: getSecurityRecommendations({
        activeUsers,
        mfaEnabledUsers,
        failedLogins: actionCount("LOGIN_FAILURE"),
        expiredUncleanedSessions,
      }),
      recentSecurityEvents: recentSecurityRows.map(mapAuditRow),
    };
  }
}

const auditInclude = {
  actor: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} as const;

type AuditRow = Awaited<
  ReturnType<PrismaAuditLogRepository["exportAuditEvents"]>
>[number];

type PrismaAuditRow = {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  actor: {
    id: string;
    name: string;
    email: string;
    role: Role;
  } | null;
};

function mapAuditRow(row: PrismaAuditRow): AuditListItem {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    actor: row.actor
      ? {
          id: row.actor.id,
          name: row.actor.name,
          emailLabel: redactEmail(row.actor.email),
          role: row.actor.role,
        }
      : null,
    createdAt: row.createdAt,
    presentation: presentAuditEvent({
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      metadata: row.metadata,
    }),
    ipAddressLabel: redactIpAddress(row.ipAddress),
    userAgentLabel: summarizeUserAgent(row.userAgent),
  };
}

function buildAuditWhere(
  input: Pick<
    AuditListInput,
    | "query"
    | "action"
    | "entityType"
    | "entityId"
    | "actorId"
    | "dateFrom"
    | "dateTo"
  >
) {
  const createdAt: { gte?: Date; lte?: Date } = {};
  if (input.dateFrom) createdAt.gte = new Date(input.dateFrom);
  if (input.dateTo) createdAt.lte = new Date(input.dateTo);

  return {
    ...(Object.keys(createdAt).length ? { createdAt } : {}),
    ...(input.action ? { action: input.action } : {}),
    ...(input.entityType ? { entityType: input.entityType } : {}),
    ...(input.entityId ? { entityId: input.entityId } : {}),
    ...(input.actorId ? { actorId: input.actorId } : {}),
    ...(input.query
      ? {
          OR: [
            { entityType: { contains: input.query, mode: "insensitive" as const } },
            { entityId: { contains: input.query, mode: "insensitive" as const } },
            {
              actor: {
                name: { contains: input.query, mode: "insensitive" as const },
              },
            },
            {
              actor: {
                email: { contains: input.query, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };
}

function matchesDerivedFilters(
  presentation: AuditPresentation,
  input: Partial<{
    category: AuditCategory;
    severity: AuditSeverity;
    success: AuditSuccess;
  }>
) {
  return (
    (!input.category || presentation.category === input.category) &&
    (!input.severity || presentation.severity === input.severity) &&
    (!input.success || presentation.success === input.success)
  );
}

function getSecurityConfigurationChecks() {
  const appOrigin = process.env.APP_ORIGIN ?? "";
  const appEnv = process.env.APP_ENV ?? process.env.NODE_ENV ?? "development";
  return [
    {
      key: "app-origin",
      label: "Canonical origin",
      status:
        appOrigin.startsWith("https://") || appEnv !== "production"
          ? ("ok" as const)
          : ("warning" as const),
      description: appOrigin.includes("localhost")
        ? "Gelistirme origin'i kullaniliyor."
        : "APP_ORIGIN ortam degiskeni kontrol edildi.",
    },
    {
      key: "mfa-key",
      label: "MFA sifreleme anahtari",
      status: process.env.MFA_ENCRYPTION_KEY ? ("ok" as const) : ("warning" as const),
      description: process.env.MFA_ENCRYPTION_KEY
        ? "MFA sir saklama anahtari tanimli."
        : "Production oncesi MFA_ENCRYPTION_KEY tanimlanmali.",
    },
    {
      key: "mail",
      label: "Transactional e-posta",
      status: process.env.MAIL_PROVIDER ? ("ok" as const) : ("info" as const),
      description: process.env.MAIL_PROVIDER
        ? "Mail provider tanimli."
        : "E-posta provider'i yoksa reset/setup teslimati manuel kalir.",
    },
    {
      key: "trust-proxy",
      label: "Proxy guveni",
      status: process.env.TRUST_PROXY === "true" ? ("ok" as const) : ("info" as const),
      description:
        process.env.TRUST_PROXY === "true"
          ? "Guvenilir proxy basliklari etkin."
          : "TRUST_PROXY kapali; yerel gelistirme icin guvenli varsayilan.",
    },
  ];
}

function getSecurityRecommendations(input: {
  activeUsers: number;
  mfaEnabledUsers: number;
  failedLogins: number;
  expiredUncleanedSessions: number;
}) {
  const items: SecurityCenterSummary["recommendations"] = [];
  if (input.activeUsers > input.mfaEnabledUsers) {
    items.push({
      key: "mfa-coverage",
      severity: "warning",
      title: "MFA kapsami tamamlanmadi",
      description:
        "Aktif kullanicilarin tamami MFA kullanmiyor. Canli oncesi en az yetkili roller icin zorunlu kilinmali.",
      href: "/admin/users",
    });
  }
  if (input.failedLogins > 0) {
    items.push({
      key: "failed-logins",
      severity: "warning",
      title: "Başarısız giriş hareketi var",
      description:
        "Seçili aralıkta başarısız giriş olayları görüldü. Audit Log üzerinden actor ve zaman akışını inceleyin.",
      href: "/admin/audit?action=LOGIN_FAILURE",
    });
  }
  if (input.expiredUncleanedSessions > 0) {
    items.push({
      key: "expired-sessions",
      severity: "info",
      title: "Suresi gecmis oturum temizligi",
      description:
        "Suresi gecmis oturum kayitlari var. Periyodik cleanup komutu production runbook'a baglanmali.",
    });
  }
  if (items.length === 0) {
    items.push({
      key: "baseline",
      severity: "info",
      title: "Kritik güvenlik uyarısı yok",
      description:
        "Seçili aralıkta dashboard tarafında kritik bir hesap güvenliği sinyali görünmüyor.",
    });
  }
  return items;
}

function redactEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "[email-redacted]";
  return `${name.slice(0, 2)}***@${domain}`;
}

export function getAuditCsv(items: AuditRow[]) {
  const headers = [
    "id",
    "createdAt",
    "action",
    "category",
    "severity",
    "success",
    "entityType",
    "entityId",
    "actor",
    "summary",
  ];
  const rows = items.map((item) => [
    item.id,
    item.createdAt.toISOString(),
    item.action,
    getAuditCategoryLabel(item.presentation.category),
    getAuditSeverityLabel(item.presentation.severity),
    item.presentation.success,
    item.entityType,
    item.entityId ?? "",
    item.actor?.name ?? "System",
    item.presentation.summary,
  ]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}
