import type {
  AuditAction,
  ContentStatus,
  PrismaClient,
  Role,
  ServiceRequestStatus,
} from "@prisma/client";

import { resolveSettingsOrigin } from "@/lib/site-settings/public-site-settings";
import type { SiteSettings } from "@/lib/site-settings/site-settings-types";
import type { Permission } from "@/lib/rbac/permissions";
import { hasPermission } from "@/lib/rbac/permissions";

export const dashboardRanges = ["7d", "30d", "90d", "year"] as const;
export type DashboardRange = (typeof dashboardRanges)[number];

export type DashboardActor = {
  userId: string;
  role: Role;
};

export type DashboardRangeWindow = {
  key: DashboardRange;
  label: string;
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
  bucket: "day" | "week" | "month";
};

export type Trend = {
  current: number;
  previous: number;
  delta: number;
  percent: number | null;
};

const activeServiceRequestStatuses: ServiceRequestStatus[] = [
  "NEW",
  "REVIEWING",
  "WAITING_FOR_CUSTOMER",
  "APPROVED",
  "IN_REPAIR",
];

const visibleStatusDistribution: ServiceRequestStatus[] = [
  "NEW",
  "REVIEWING",
  "WAITING_FOR_CUSTOMER",
  "APPROVED",
  "IN_REPAIR",
  "COMPLETED",
  "CANCELLED",
];

export class AdminDashboardRepository {
  constructor(private readonly client: PrismaClient) {}

  async getServiceRequestSummary(range: DashboardRangeWindow) {
    const completedWhere = {
      status: "COMPLETED" as const,
      archivedAt: null,
      updatedAt: { gte: range.from, lt: range.to },
    };
    const previousCompletedWhere = {
      status: "COMPLETED" as const,
      archivedAt: null,
      updatedAt: { gte: range.previousFrom, lt: range.previousTo },
    };

    const [
      newCurrent,
      newPrevious,
      reviewingCurrent,
      reviewingPrevious,
      repairCurrent,
      repairPrevious,
      completedCurrent,
      completedPrevious,
    ] = await Promise.all([
      this.client.serviceRequest.count({
        where: { status: "NEW", archivedAt: null },
      }),
      this.client.serviceRequest.count({
        where: {
          status: "NEW",
          archivedAt: null,
          createdAt: { gte: range.previousFrom, lt: range.previousTo },
        },
      }),
      this.client.serviceRequest.count({
        where: {
          status: { in: ["REVIEWING", "WAITING_FOR_CUSTOMER"] },
          archivedAt: null,
        },
      }),
      this.client.serviceRequest.count({
        where: {
          status: { in: ["REVIEWING", "WAITING_FOR_CUSTOMER"] },
          archivedAt: null,
          updatedAt: { gte: range.previousFrom, lt: range.previousTo },
        },
      }),
      this.client.serviceRequest.count({
        where: { status: { in: ["APPROVED", "IN_REPAIR"] }, archivedAt: null },
      }),
      this.client.serviceRequest.count({
        where: {
          status: { in: ["APPROVED", "IN_REPAIR"] },
          archivedAt: null,
          updatedAt: { gte: range.previousFrom, lt: range.previousTo },
        },
      }),
      this.client.serviceRequest.count({ where: completedWhere }),
      this.client.serviceRequest.count({ where: previousCompletedWhere }),
    ]);

    return [
      {
        key: "new",
        label: "Yeni Talepler",
        href: "/admin/service-requests?status=NEW",
        trend: createTrend(newCurrent, newPrevious),
      },
      {
        key: "reviewing",
        label: "İncelenen Talepler",
        href: "/admin/service-requests?status=REVIEWING",
        trend: createTrend(reviewingCurrent, reviewingPrevious),
      },
      {
        key: "repair",
        label: "Onarımda",
        href: "/admin/service-requests?status=IN_REPAIR",
        trend: createTrend(repairCurrent, repairPrevious),
      },
      {
        key: "completed",
        label: "Tamamlanan",
        href: "/admin/service-requests?status=COMPLETED",
        trend: createTrend(completedCurrent, completedPrevious),
      },
    ];
  }

  async getServiceRequestTimeline(range: DashboardRangeWindow) {
    const records = await this.client.serviceRequest.findMany({
      where: {
        archivedAt: null,
        createdAt: { gte: range.from, lt: range.to },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    const buckets = createTimelineBuckets(range);
    const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

    for (const record of records) {
      const key = getBucketKey(record.createdAt, range.bucket);
      const bucket = byKey.get(key);
      if (bucket) bucket.count += 1;
    }

    return buckets;
  }

  async getServiceRequestStatusDistribution() {
    const counts = await this.client.serviceRequest.groupBy({
      by: ["status"],
      where: {
        archivedAt: null,
        status: { in: visibleStatusDistribution },
      },
      _count: { status: true },
    });
    const byStatus = new Map(
      counts.map((item) => [item.status, item._count.status])
    );

    return visibleStatusDistribution.map((status) => ({
      status,
      count: byStatus.get(status) ?? 0,
    }));
  }

  async getOpenWorkload(actor: DashboardActor) {
    const attentionBefore = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const [unassigned, assignedToCurrent, waitingForCustomer, stale, withAttachment] =
      await Promise.all([
        this.client.serviceRequest.count({
          where: {
            archivedAt: null,
            assignedUserId: null,
            status: { in: activeServiceRequestStatuses },
          },
        }),
        this.client.serviceRequest.count({
          where: {
            archivedAt: null,
            assignedUserId: actor.userId,
            status: { in: activeServiceRequestStatuses },
          },
        }),
        this.client.serviceRequest.count({
          where: { archivedAt: null, status: "WAITING_FOR_CUSTOMER" },
        }),
        this.client.serviceRequest.count({
          where: {
            archivedAt: null,
            status: { in: activeServiceRequestStatuses },
            updatedAt: { lt: attentionBefore },
          },
        }),
        this.client.serviceRequest.count({
          where: {
            archivedAt: null,
            attachments: { some: {} },
          },
        }),
      ]);

    return [
      { label: "Atanmamış açık talep", value: unassigned },
      { label: "Bana atanan", value: assignedToCurrent },
      { label: "Müşteriden bilgi bekleyen", value: waitingForCustomer },
      { label: "Uzun süredir güncellenmeyen", value: stale },
      { label: "Dosyalı talep", value: withAttachment },
    ];
  }

  getAssignedWork(userId: string) {
    return this.client.serviceRequest.findMany({
      where: {
        archivedAt: null,
        assignedUserId: userId,
        status: { in: activeServiceRequestStatuses },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        company: true,
        fullName: true,
        updatedAt: true,
      },
    });
  }

  getRecentServiceRequests(limit = 8) {
    return this.client.serviceRequest.findMany({
      where: { archivedAt: null },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        fullName: true,
        company: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        assignedUser: { select: { name: true } },
        attachments: { select: { id: true }, take: 1 },
      },
    });
  }

  async getContentHealth() {
    const [blog, devices, services, homepage, hero] = await Promise.all([
      this.getBlogHealth(),
      this.getDeviceHealth(),
      this.getServiceHealth(),
      this.getHomepageHealth(),
      this.getHeroHealth(),
    ]);

    return { blog, devices, services, homepage, hero };
  }

  async getMediaHealth() {
    const [active, archived, unused, missingAlt, storage, latest] =
      await Promise.all([
        this.client.media.count({ where: { archivedAt: null } }),
        this.client.media.count({ where: { archivedAt: { not: null } } }),
        this.client.media.count({
          where: {
            archivedAt: null,
            heroSlides: { none: {} },
            deviceGroups: { none: {} },
            deviceGroupOpenGraphs: { none: {} },
            services: { none: {} },
            serviceOpenGraphs: { none: {} },
            blogPostCovers: { none: {} },
            blogPostOpenGraphs: { none: {} },
          },
        }),
        this.client.media.count({
          where: {
            archivedAt: null,
            usageType: { in: ["IMAGE", "LOGO", "OPEN_GRAPH"] },
            OR: [{ altText: null }, { altText: "" }],
          },
        }),
        this.client.mediaVariant.aggregate({
          _sum: { size: true },
        }),
        this.client.media.findMany({
          where: { archivedAt: null },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            title: true,
            mimeType: true,
            size: true,
            createdAt: true,
          },
        }),
      ]);

    return {
      active,
      archived,
      unused,
      missingAlt,
      totalVariantSize: storage._sum.size ?? 0,
      latest,
    };
  }

  async getSiteReadiness(settings: SiteSettings) {
    const origin = resolveSettingsOrigin(settings);
    const isDevelopmentOrigin = /localhost|127\.0\.0\.1|\[::1\]/.test(origin);

    return [
      readiness("Firma adı", Boolean(settings.general.companyName), "/admin/settings#general"),
      readiness("Telefon", Boolean(settings.contact.phonePrimary), "/admin/settings#contact"),
      readiness("E-posta", Boolean(settings.contact.emailPrimary), "/admin/settings#contact"),
      readiness("Adres", Boolean(settings.address.addressLine), "/admin/settings#address"),
      readiness("SEO başlığı", Boolean(settings.seo.defaultTitle), "/admin/settings#seo"),
      readiness("SEO açıklaması", Boolean(settings.seo.defaultDescription), "/admin/settings#seo"),
      readiness("Varsayılan OG görsel", Boolean(settings.branding.defaultOgImageMediaId), "/admin/settings#branding", "informational"),
      readiness("Logo", Boolean(settings.branding.logoMediaId || settings.branding.logoFallbackPath), "/admin/settings#branding"),
      readiness("Favicon", Boolean(settings.branding.faviconMediaId), "/admin/settings#branding", "informational"),
      readiness("Hukuki sayfalar", settings.legal.privacyPolicyEnabled && settings.legal.cookiePolicyEnabled && settings.legal.kvkkEnabled, "/admin/settings#legal"),
      readiness("Canonical origin", Boolean(origin) && !isDevelopmentOrigin, "/admin/settings#seo", isDevelopmentOrigin ? "development" : "required"),
      readiness("Bakım modu", !settings.system.maintenanceMode, "/admin/settings#system", settings.system.maintenanceMode ? "warning" : "informational"),
      readiness("Analytics", Boolean(settings.analytics.googleAnalyticsId || settings.analytics.googleTagManagerId), "/admin/settings#analytics", "informational"),
    ];
  }

  async getSecuritySummary(range: DashboardRangeWindow) {
    const [
      successfulLogins,
      failedLogins,
      lockedAccounts,
      activeSessions,
      passwordResetRequests,
      mfaEnabledUsers,
      activeUsers,
      inactiveUsers,
      usersByRole,
      recentCritical,
    ] = await Promise.all([
      this.client.auditLog.count({
        where: { action: "LOGIN", createdAt: { gte: range.from, lt: range.to } },
      }),
      this.client.auditLog.count({
        where: {
          action: "LOGIN_FAILURE",
          createdAt: { gte: range.from, lt: range.to },
        },
      }),
      this.client.user.count({
        where: { lockedUntil: { gt: new Date() }, isActive: true },
      }),
      this.client.adminSession.count({
        where: { revokedAt: null, expiresAt: { gt: new Date() } },
      }),
      this.client.auditLog.count({
        where: {
          action: "PASSWORD_RESET_REQUESTED",
          createdAt: { gte: range.from, lt: range.to },
        },
      }),
      this.client.user.count({ where: { mfaEnabled: true, isActive: true } }),
      this.client.user.count({ where: { isActive: true } }),
      this.client.user.count({ where: { isActive: false } }),
      this.client.user.groupBy({
        by: ["role"],
        where: { isActive: true },
        _count: { role: true },
      }),
      this.client.auditLog.findMany({
        where: {
          action: {
            in: [
              "LOGIN_FAILURE",
              "ACCOUNT_LOCKED",
              "PASSWORD_RESET_REQUESTED",
              "PASSWORD_RESET_COMPLETED",
              "SESSION_REVOKED",
              "ALL_SESSIONS_REVOKED",
            ],
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          createdAt: true,
          actor: { select: { name: true } },
        },
      }),
    ]);

    return {
      successfulLogins,
      failedLogins,
      lockedAccounts,
      activeSessions,
      passwordResetRequests,
      mfaEnabledUsers,
      activeUsers,
      inactiveUsers,
      usersByRole: usersByRole.map((item) => ({
        role: item.role,
        count: item._count.role,
      })),
      recentCritical: recentCritical.map(presentAuditEvent),
    };
  }

  async getRecentActivity(input: {
    permissions: readonly Permission[];
    limit?: number;
  }) {
    const events = await this.client.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        createdAt: true,
        actor: { select: { name: true } },
      },
    });

    return events
      .filter((event) => canSeeAuditEvent(event.entityType, input.permissions))
      .slice(0, input.limit ?? 15)
      .map(presentAuditEvent);
  }

  private async getBlogHealth() {
    const [counts, missingSeo, missingCover, latest] = await Promise.all([
      this.client.blogPost.groupBy({
        by: ["status"],
        where: { archivedAt: null },
        _count: { status: true },
      }),
      this.client.blogPost.count({
        where: {
          archivedAt: null,
          OR: [{ seoTitle: "" }, { seoDescription: "" }],
        },
      }),
      this.client.blogPost.count({
        where: { archivedAt: null, coverImageId: null },
      }),
      this.client.blogPost.findFirst({
        where: { archivedAt: null },
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, updatedAt: true },
      }),
    ]);
    const byStatus = new Map<ContentStatus, number>(
      counts.map((item) => [item.status, item._count.status])
    );

    return {
      draft: byStatus.get("DRAFT") ?? 0,
      published: byStatus.get("PUBLISHED") ?? 0,
      archived: byStatus.get("ARCHIVED") ?? 0,
      scheduled: await this.client.blogPost.count({
        where: {
          archivedAt: null,
          scheduledFor: { gt: new Date() },
        },
      }),
      missingSeo,
      missingCover,
      latest,
    };
  }

  private async getDeviceHealth() {
    const [active, inactive, featured, missingSeo, withoutImage, latest] =
      await Promise.all([
        this.client.deviceGroup.count({
          where: { isActive: true, archivedAt: null },
        }),
        this.client.deviceGroup.count({
          where: { isActive: false, archivedAt: null },
        }),
        this.client.deviceGroup.count({
          where: { isActive: true, isFeatured: true, archivedAt: null },
        }),
        this.client.deviceGroup.count({
          where: {
            archivedAt: null,
            OR: [{ seoTitle: "" }, { seoDescription: "" }],
          },
        }),
        this.client.deviceGroup.count({
          where: { archivedAt: null, imageId: null },
        }),
        this.client.deviceGroup.findFirst({
          where: { archivedAt: null },
          orderBy: { updatedAt: "desc" },
          select: { id: true, title: true, updatedAt: true },
        }),
      ]);

    return { active, inactive, featured, missingSeo, withoutImage, latest };
  }

  private async getServiceHealth() {
    const [active, inactive, featured, missingSeo, latest] = await Promise.all([
      this.client.service.count({ where: { isActive: true, archivedAt: null } }),
      this.client.service.count({ where: { isActive: false, archivedAt: null } }),
      this.client.service.count({
        where: { isActive: true, isFeatured: true, archivedAt: null },
      }),
      this.client.service.count({
        where: {
          archivedAt: null,
          OR: [{ seoTitle: "" }, { seoDescription: "" }],
        },
      }),
      this.client.service.findFirst({
        where: { archivedAt: null },
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, updatedAt: true },
      }),
    ]);

    return { active, inactive, featured, missingSeo, latest };
  }

  private async getHomepageHealth() {
    const [visible, hidden, latest] = await Promise.all([
      this.client.homepageSection.count({ where: { isVisible: true } }),
      this.client.homepageSection.count({ where: { isVisible: false } }),
      this.client.homepageSection.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { key: true, title: true, updatedAt: true },
      }),
    ]);

    return { visible, hidden, latest };
  }

  private async getHeroHealth() {
    const [active, inactive, autoplay, latest] = await Promise.all([
      this.client.heroSlide.count({ where: { isActive: true } }),
      this.client.heroSlide.count({ where: { isActive: false } }),
      this.client.heroSlide.count({
        where: { isActive: true, includeInAutoplay: true },
      }),
      this.client.heroSlide.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, updatedAt: true },
      }),
    ]);

    return { active, inactive, autoplay, latest };
  }
}

export function parseDashboardRange(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return dashboardRanges.includes(candidate as DashboardRange)
    ? (candidate as DashboardRange)
    : "30d";
}

export function createDashboardRangeWindow(
  key: DashboardRange,
  now = new Date()
): DashboardRangeWindow {
  const days = key === "7d" ? 7 : key === "90d" ? 90 : key === "year" ? 365 : 30;
  const to = now;
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  const previousTo = from;
  const previousFrom = new Date(previousTo.getTime() - days * 24 * 60 * 60 * 1000);

  return {
    key,
    label:
      key === "7d"
        ? "Son 7 Gün"
        : key === "90d"
          ? "Son 90 Gün"
          : key === "year"
            ? "Bu Yıl"
            : "Son 30 Gün",
    from,
    to,
    previousFrom,
    previousTo,
    bucket: key === "90d" ? "week" : key === "year" ? "month" : "day",
  };
}

export function createTrend(current: number, previous: number): Trend {
  return {
    current,
    previous,
    delta: current - previous,
    percent: previous === 0 ? null : Math.round(((current - previous) / previous) * 100),
  };
}

export function createTimelineBuckets(range: DashboardRangeWindow) {
  const buckets: Array<{ key: string; label: string; count: number }> = [];
  const cursor = new Date(range.from);

  while (cursor < range.to) {
    buckets.push({
      key: getBucketKey(cursor, range.bucket),
      label: formatBucketLabel(cursor, range.bucket),
      count: 0,
    });

    if (range.bucket === "day") cursor.setUTCDate(cursor.getUTCDate() + 1);
    else if (range.bucket === "week") cursor.setUTCDate(cursor.getUTCDate() + 7);
    else cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return dedupeBuckets(buckets);
}

export function getBucketKey(date: Date, bucket: "day" | "week" | "month") {
  const parts = getIstanbulDateParts(date);
  if (bucket === "month") return `${parts.year}-${parts.month}`;
  if (bucket === "week") {
    const week = Math.ceil(parts.dayOfYear / 7);
    return `${parts.year}-W${String(week).padStart(2, "0")}`;
  }
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function getIstanbulDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = Number(parts.find((item) => item.type === "year")?.value ?? "0");
  const month = parts.find((item) => item.type === "month")?.value ?? "01";
  const day = parts.find((item) => item.type === "day")?.value ?? "01";
  const start = Date.UTC(year, 0, 1);
  const current = Date.UTC(year, Number(month) - 1, Number(day));
  const dayOfYear = Math.floor((current - start) / (24 * 60 * 60 * 1000)) + 1;
  return { year, month, day, dayOfYear };
}

function formatBucketLabel(date: Date, bucket: "day" | "week" | "month") {
  if (bucket === "month") {
    return new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  if (bucket === "week") {
    return `${new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      day: "2-digit",
      month: "short",
    }).format(date)} haftası`;
  }

  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "short",
  }).format(date);
}

function dedupeBuckets<T extends { key: string; count: number }>(buckets: T[]) {
  const map = new Map<string, T>();
  for (const bucket of buckets) {
    if (!map.has(bucket.key)) map.set(bucket.key, bucket);
  }
  return [...map.values()];
}

function readiness(
  label: string,
  ok: boolean,
  href: string,
  severity: "required" | "informational" | "warning" | "development" = "required"
) {
  return { label, ok, href, severity };
}

type ActivityRecord = {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  createdAt: Date;
  actor: { name: string } | null;
};

function presentAuditEvent(event: ActivityRecord) {
  return {
    id: event.id,
    label: getAuditLabel(event.action, event.entityType),
    actorName: event.actor?.name ?? "Sistem",
    entityType: event.entityType,
    entityId: event.entityId,
    createdAt: event.createdAt,
    href: getAuditHref(event.entityType, event.entityId),
  };
}

function getAuditLabel(action: AuditAction, entityType: string) {
  const actionLabel: Record<AuditAction, string> = {
    LOGIN: "Giriş yapıldı",
    LOGIN_FAILURE: "Başarısız giriş",
    LOGOUT: "Çıkış yapıldı",
    CREATE: "Oluşturuldu",
    UPDATE: "Güncellendi",
    DELETE: "Silindi",
    PUBLISH: "Yayınlandı",
    ARCHIVE: "Arşivlendi",
    STATUS_CHANGE: "Durum değişti",
    SESSION_REVOKED: "Oturum iptal edildi",
    ALL_SESSIONS_REVOKED: "Oturumlar iptal edildi",
    PASSWORD_CHANGED: "Şifre değişti",
    PASSWORD_RESET_REQUESTED: "Şifre sıfırlama istendi",
    PASSWORD_RESET_COMPLETED: "Şifre sıfırlandı",
    MFA_ENROLLMENT_STARTED: "MFA kurulumu başlatıldı",
    MFA_ENABLED: "MFA etkinleştirildi",
    MFA_DISABLED: "MFA kapatıldı",
    MFA_RECOVERY_CODES_REGENERATED: "MFA kurtarma kodları yenilendi",
    MFA_CHALLENGE_SUCCESS: "MFA doğrulandı",
    MFA_CHALLENGE_FAILURE: "MFA başarısız",
    RECOVERY_CODE_USED: "Kurtarma kodu kullanıldı",
    ACCOUNT_LOCKED: "Hesap kilitlendi",
  };

  return `${actionLabel[action] ?? "Aktivite"} · ${entityType}`;
}

function getAuditHref(entityType: string, entityId: string | null) {
  if (!entityId) return null;
  if (entityType === "ServiceRequest") return `/admin/service-requests/${entityId}`;
  if (entityType === "Media") return `/admin/media/${entityId}`;
  if (entityType === "HeroSlide") return `/admin/hero-slides/${entityId}`;
  if (entityType === "BlogPost") return `/admin/blog/${entityId}`;
  if (entityType === "DeviceGroup") return `/admin/devices/${entityId}`;
  if (entityType === "Service") return `/admin/services/${entityId}`;
  if (entityType === "HomepageSection") return "/admin/homepage";
  if (entityType === "SiteSetting") return "/admin/settings";
  return null;
}

function canSeeAuditEvent(entityType: string, permissions: readonly Permission[]) {
  const has = (permission: Permission) => permissions.includes(permission);
  if (entityType.startsWith("ServiceRequest")) return has("serviceRequests.view");
  if (entityType === "Media") return has("media.view");
  if (entityType === "HeroSlide") return has("heroSlides.view");
  if (entityType === "BlogPost" || entityType === "BlogCategory") return has("blog.view");
  if (entityType === "DeviceGroup") return has("devices.view");
  if (entityType === "Service") return has("services.view");
  if (entityType === "HomepageSection") return has("homepage.view");
  if (entityType === "SiteSetting") return has("settings.view");
  if (
    entityType === "AdminSession" ||
    entityType === "PasswordResetToken" ||
    entityType === "User" ||
    entityType === "AdminAuth"
  ) {
    return has("audit.view") || has("account.security.manage");
  }
  return has("audit.view");
}

export function getPermissionsForRole(role: Role): Permission[] {
  return (
    [
      "dashboard.view",
      "serviceRequests.view",
      "devices.view",
      "services.view",
      "blog.view",
      "media.view",
      "heroSlides.view",
      "homepage.view",
      "settings.view",
      "users.view",
      "roles.view",
      "audit.view",
      "account.security.manage",
    ] as const
  ).filter((permission) => hasPermission(role, permission));
}
