import {
  EmailDeliveryStatus,
  NotificationCategory,
  type Prisma,
  type PrismaClient,
} from "@prisma/client";

import { assertServerOnly } from "@/lib/auth/server-only";
import type { EmailTemplateKey } from "@/lib/notifications/email-templates";
import { validateTemplatePayload } from "@/lib/notifications/email-templates";

assertServerOnly("notifications repository");

export type NotificationListInput = {
  userId: string;
  page: number;
  pageSize: number;
  state: "all" | "unread" | "read";
  category?: NotificationCategory;
};

export type EmailDeliveryListInput = {
  page: number;
  pageSize: number;
  status?: EmailDeliveryStatus;
  templateKey?: string;
  failedOnly?: boolean;
};

export type EnqueueEmailInput = {
  notificationId?: string | null;
  templateKey: EmailTemplateKey;
  recipient: string;
  subject: string;
  provider: string;
  templatePayload: Prisma.InputJsonValue;
  idempotencyKey?: string;
  nextAttemptAt?: Date;
};

export class PrismaNotificationRepository {
  constructor(private readonly client: PrismaClient) {}

  createNotification(input: {
    userId: string;
    category: NotificationCategory;
    title: string;
    message: string;
    linkUrl?: string;
    expiresAt?: Date;
  }) {
    return this.client.notification.create({
      data: {
        userId: input.userId,
        category: input.category,
        title: input.title,
        message: input.message,
        linkUrl: input.linkUrl,
        expiresAt: input.expiresAt,
      },
    });
  }

  async listForUser(input: NotificationListInput) {
    const where = {
      userId: input.userId,
      ...(input.category ? { category: input.category } : {}),
      ...(input.state === "unread" ? { readAt: null } : {}),
      ...(input.state === "read" ? { readAt: { not: null } } : {}),
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    } satisfies Prisma.NotificationWhereInput;
    const [items, total] = await Promise.all([
      this.client.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      this.client.notification.count({ where }),
    ]);
    return {
      items,
      total,
      page: input.page,
      pageSize: input.pageSize,
      pageCount: Math.max(1, Math.ceil(total / input.pageSize)),
    };
  }

  getUnreadCount(userId: string) {
    return this.client.notification.count({
      where: {
        userId,
        readAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
  }

  markRead(input: { userId: string; id: string }) {
    return this.client.notification.updateMany({
      where: { id: input.id, userId: input.userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  markAllRead(userId: string) {
    return this.client.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async getUserPreferences(userId: string) {
    await this.ensurePreferenceDefaults(userId);
    return this.client.notificationPreference.findMany({
      where: { userId },
      orderBy: { category: "asc" },
    });
  }

  async updateUserPreference(input: {
    userId: string;
    category: NotificationCategory;
    emailEnabled: boolean;
    inAppEnabled: boolean;
  }) {
    const mandatory = isMandatorySecurityCategory(input.category);
    return this.client.notificationPreference.upsert({
      where: {
        userId_category: {
          userId: input.userId,
          category: input.category,
        },
      },
      create: {
        userId: input.userId,
        category: input.category,
        emailEnabled: mandatory ? true : input.emailEnabled,
        inAppEnabled: input.inAppEnabled,
      },
      update: {
        emailEnabled: mandatory ? true : input.emailEnabled,
        inAppEnabled: input.inAppEnabled,
      },
    });
  }

  async enqueueEmail(input: EnqueueEmailInput) {
    validateTemplatePayload(input.templateKey, input.templatePayload);
    if (input.idempotencyKey) {
      const existing = await this.client.emailDelivery.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existing) return existing;
    }
    return this.client.emailDelivery.create({
      data: {
        notificationId: input.notificationId,
        templateKey: input.templateKey,
        recipient: normalizeEmail(input.recipient),
        subject: input.subject,
        provider: input.provider,
        templatePayload: input.templatePayload,
        idempotencyKey: input.idempotencyKey,
        nextAttemptAt: input.nextAttemptAt ?? new Date(),
      },
    });
  }

  async claimDueBatch(batchSize: number, now = new Date()) {
    const due = await this.client.emailDelivery.findMany({
      where: {
        status: { in: ["PENDING", "RETRY_SCHEDULED"] },
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      },
      orderBy: { createdAt: "asc" },
      take: batchSize,
    });

    const claimed = [];
    for (const item of due) {
      const updated = await this.client.emailDelivery.updateMany({
        where: {
          id: item.id,
          status: item.status,
          attemptCount: item.attemptCount,
        },
        data: {
          status: "SENDING",
          attemptCount: { increment: 1 },
          lastAttemptAt: now,
        },
      });
      if (updated.count === 1) {
        const fresh = await this.client.emailDelivery.findUnique({
          where: { id: item.id },
        });
        if (fresh) claimed.push(fresh);
      }
    }
    return claimed;
  }

  async markSent(input: { id: string; providerMessageId?: string }) {
    const item = await this.client.emailDelivery.findUnique({
      where: { id: input.id },
      select: { attemptCount: true },
    });
    if (!item) return null;
    const now = new Date();
    return this.client.emailDelivery.update({
      where: { id: input.id },
      data: {
        status: "SENT",
        providerMessageId: input.providerMessageId,
        sentAt: now,
        failedAt: null,
        nextAttemptAt: null,
        errorCode: null,
        errorSummary: null,
        attempts: {
          create: {
            attemptNumber: item.attemptCount,
            status: "SENT",
            attemptedAt: now,
          },
        },
      },
    });
  }

  async scheduleRetry(input: {
    id: string;
    errorCode?: string;
    errorSummary?: string;
    maxAttempts: number;
  }) {
    const item = await this.client.emailDelivery.findUnique({
      where: { id: input.id },
    });
    if (!item) return null;
    const now = new Date();
    const exhausted = item.attemptCount >= input.maxAttempts;
    const updated = await this.client.emailDelivery.update({
      where: { id: input.id },
      data: {
        status: exhausted ? "FAILED" : "RETRY_SCHEDULED",
        failedAt: exhausted ? now : null,
        nextAttemptAt: exhausted ? null : getNextAttemptAt(item.attemptCount, now),
        errorCode: safeError(input.errorCode),
        errorSummary: safeError(input.errorSummary, 500),
        attempts: {
          create: {
            attemptNumber: item.attemptCount,
            status: exhausted ? "FAILED" : "RETRY_SCHEDULED",
            errorCode: safeError(input.errorCode),
            errorSummary: safeError(input.errorSummary, 500),
            attemptedAt: now,
          },
        },
      },
    });
    return updated;
  }

  async markFailed(input: { id: string; errorCode?: string; errorSummary?: string }) {
    const item = await this.client.emailDelivery.findUnique({
      where: { id: input.id },
    });
    if (!item) return null;
    const now = new Date();
    return this.client.emailDelivery.update({
      where: { id: input.id },
      data: {
        status: "FAILED",
        failedAt: now,
        nextAttemptAt: null,
        errorCode: safeError(input.errorCode),
        errorSummary: safeError(input.errorSummary, 500),
        attempts: {
          create: {
            attemptNumber: item.attemptCount,
            status: "FAILED",
            errorCode: safeError(input.errorCode),
            errorSummary: safeError(input.errorSummary, 500),
            attemptedAt: now,
          },
        },
      },
    });
  }

  cancelPending(id: string) {
    return this.client.emailDelivery.updateMany({
      where: { id, status: { in: ["PENDING", "RETRY_SCHEDULED"] } },
      data: { status: "CANCELLED", nextAttemptAt: null },
    });
  }

  retryFailed(id: string) {
    return this.client.emailDelivery.updateMany({
      where: { id, status: "FAILED" },
      data: {
        status: "RETRY_SCHEDULED",
        nextAttemptAt: new Date(),
        failedAt: null,
      },
    });
  }

  async listAdminDeliveries(input: EmailDeliveryListInput) {
    const where = {
      ...(input.status ? { status: input.status } : {}),
      ...(input.templateKey ? { templateKey: input.templateKey } : {}),
      ...(input.failedOnly
        ? { status: { in: ["FAILED", "RETRY_SCHEDULED"] as EmailDeliveryStatus[] } }
        : {}),
    } satisfies Prisma.EmailDeliveryWhereInput;
    const [items, total] = await Promise.all([
      this.client.emailDelivery.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      this.client.emailDelivery.count({ where }),
    ]);
    return {
      items: items.map(toSafeDelivery),
      total,
      page: input.page,
      pageSize: input.pageSize,
      pageCount: Math.max(1, Math.ceil(total / input.pageSize)),
    };
  }

  getDeliveryById(id: string) {
    return this.client.emailDelivery.findUnique({
      where: { id },
      include: { attempts: { orderBy: { attemptedAt: "desc" }, take: 10 } },
    });
  }

  async getQueueHealth() {
    const counts = await this.client.emailDelivery.groupBy({
      by: ["status"],
      _count: { status: true },
    });
    return counts.map((item) => ({
      status: item.status,
      count: item._count.status,
    }));
  }

  private async ensurePreferenceDefaults(userId: string) {
    await this.client.notificationPreference.createMany({
      data: Object.values(NotificationCategory).map((category) => ({
        userId,
        category,
        emailEnabled: true,
        inAppEnabled: true,
      })),
      skipDuplicates: true,
    });
  }

}

export function toSafeDelivery(item: {
  id: string;
  templateKey: string;
  recipient: string;
  subject: string;
  provider: string;
  status: EmailDeliveryStatus;
  attemptCount: number;
  lastAttemptAt: Date | null;
  nextAttemptAt: Date | null;
  sentAt: Date | null;
  failedAt: Date | null;
  errorCode: string | null;
  errorSummary: string | null;
  createdAt: Date;
}) {
  return {
    ...item,
    recipient: redactEmail(item.recipient),
  };
}

export function getNextAttemptAt(attemptCount: number, now = new Date()) {
  const delays = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000, 12 * 60 * 60_000];
  const delay = delays[Math.min(Math.max(attemptCount - 1, 0), delays.length - 1)];
  const jitter = Math.floor(Math.random() * 15_000);
  return new Date(now.getTime() + delay + jitter);
}

export function isMandatorySecurityCategory(category: NotificationCategory) {
  return [
    "SECURITY_ALERT",
    "PASSWORD_CHANGED",
    "MFA_CHANGED",
    "SESSION_REVOKED",
  ].includes(category);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function redactEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "[redacted]";
  return `${name.slice(0, 2)}***@${domain}`;
}

function safeError(value: string | undefined, max = 120) {
  if (!value) return undefined;
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email-redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .slice(0, max);
}
