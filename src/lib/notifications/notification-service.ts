import type { NotificationCategory, Prisma } from "@prisma/client";

import { AdminAuthRepository } from "@/lib/auth/admin-auth-repository";
import type { AdminRequestContext } from "@/lib/auth/request-context";
import { assertServerOnly } from "@/lib/auth/server-only";
import { prisma } from "@/lib/database/prisma";
import { PrismaNotificationRepository } from "@/lib/database/repositories/notifications";
import {
  getTransactionalEmailProvider,
  type EmailRecipient,
} from "@/lib/notifications/email-provider";
import {
  renderEmailTemplate,
  type EmailTemplateKey,
} from "@/lib/notifications/email-templates";
import { getMailConfig } from "@/lib/notifications/mail-config";
import { getPublicSiteSettingsUncached } from "@/lib/site-settings/public-site-settings";

assertServerOnly("notification service");

export type NotifyUserInput = {
  userId: string;
  category: NotificationCategory;
  title: string;
  message: string;
  linkUrl?: string;
  email?: {
    to: EmailRecipient;
    templateKey: EmailTemplateKey;
    payload: Prisma.InputJsonValue;
    idempotencyKey?: string;
  };
  mandatoryEmail?: boolean;
  context?: AdminRequestContext;
};

export class NotificationService {
  constructor(
    private readonly repository = new PrismaNotificationRepository(prisma),
    private readonly auditRepository = new AdminAuthRepository(prisma)
  ) {}

  async notifyUser(input: NotifyUserInput) {
    const preferences = await this.repository.getUserPreferences(input.userId);
    const preference = preferences.find((item) => item.category === input.category);
    const notification =
      preference?.inAppEnabled !== false
        ? await this.repository.createNotification({
            userId: input.userId,
            category: input.category,
            title: input.title,
            message: input.message,
            linkUrl: sanitizeInternalLink(input.linkUrl),
          })
        : null;

    if (input.email && (input.mandatoryEmail || preference?.emailEnabled !== false)) {
      await this.enqueueEmail({
        notificationId: notification?.id,
        ...input.email,
        context: input.context,
      });
    }

    return notification;
  }

  async enqueueEmail(input: {
    notificationId?: string | null;
    to: EmailRecipient;
    templateKey: EmailTemplateKey;
    payload: Prisma.InputJsonValue;
    idempotencyKey?: string;
    context?: AdminRequestContext;
  }) {
    const mailConfig = getMailConfig();
    const settings = await getPublicSiteSettingsUncached();
    const supportEmail =
      mailConfig.supportEmail || settings.contact.emailSupport || settings.contact.emailPrimary;
    const rendered = await renderEmailTemplate({
      key: input.templateKey,
      payload: input.payload,
      companyName: settings.general.companyName,
      supportEmail,
    });
    const delivery = await this.repository.enqueueEmail({
      notificationId: input.notificationId,
      templateKey: input.templateKey,
      recipient: input.to.email,
      subject: rendered.subject,
      provider: mailConfig.provider,
      templatePayload: input.payload,
      idempotencyKey: input.idempotencyKey,
    });

    if (input.context) {
      await this.auditRepository.appendAuditLog({
        action: "CREATE",
        entityType: "EmailDelivery",
        entityId: delivery.id,
        metadata: {
          templateKey: input.templateKey,
          provider: mailConfig.provider,
          status: delivery.status,
        },
        context: input.context,
      });
    }

    return delivery;
  }

  getUnreadCount(userId: string) {
    return this.repository.getUnreadCount(userId);
  }

  async notifyNewServiceRequest(input: {
    serviceRequestId: string;
    requestShortId: string;
    customerLabel: string;
    hasAttachment: boolean;
  }) {
    const recipients = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ["SUPER_ADMIN", "ADMIN", "SERVICE_STAFF"] },
      },
      select: { id: true, email: true, name: true },
      take: 50,
    });
    const adminUrl = await import("@/lib/notifications/email-templates").then((mod) =>
      mod.makeAdminUrl(`/admin/service-requests/${input.serviceRequestId}`)
    );

    await Promise.all(
      recipients.map((user) =>
        this.notifyUser({
          userId: user.id,
          category: "SERVICE_REQUEST_NEW",
          title: "Yeni servis talebi",
          message: `Talep ${input.requestShortId} admin paneline dustu.`,
          linkUrl: `/admin/service-requests/${input.serviceRequestId}`,
          email: {
            to: { email: user.email, name: user.name },
            templateKey: "new-service-request-internal",
            payload: {
              requestShortId: input.requestShortId,
              customerLabel: input.customerLabel,
              hasAttachment: input.hasAttachment,
              adminUrl,
            },
            idempotencyKey: `service-request-new:${input.serviceRequestId}:${user.id}`,
          },
        })
      )
    );
  }

  async processDueEmails(input: { batchSize: number; context?: AdminRequestContext }) {
    const provider = getTransactionalEmailProvider();
    const mailConfig = getMailConfig();
    const settings = await getPublicSiteSettingsUncached();
    const supportEmail =
      mailConfig.supportEmail || settings.contact.emailSupport || settings.contact.emailPrimary;
    const claimed = await this.repository.claimDueBatch(input.batchSize);
    const results = {
      claimed: claimed.length,
      sent: 0,
      retryScheduled: 0,
      failed: 0,
    };

    for (const delivery of claimed) {
      const rendered = await renderEmailTemplate({
        key: delivery.templateKey as EmailTemplateKey,
        payload: delivery.templatePayload,
        companyName: settings.general.companyName,
        supportEmail,
      });
      const result = await provider.send({
        to: [{ email: delivery.recipient }],
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        idempotencyKey: delivery.idempotencyKey ?? undefined,
        tags: [delivery.templateKey],
      });

      if (result.accepted) {
        await this.repository.markSent({
          id: delivery.id,
          providerMessageId: result.providerMessageId,
        });
        results.sent += 1;
        continue;
      }

      if (result.transientFailure) {
        await this.repository.scheduleRetry({
          id: delivery.id,
          errorCode: result.errorCode,
          errorSummary: result.errorCode,
          maxAttempts: getMailMaxAttempts(),
        });
        results.retryScheduled += 1;
      } else {
        await this.repository.markFailed({
          id: delivery.id,
          errorCode: result.errorCode,
          errorSummary: result.errorCode,
        });
        results.failed += 1;
      }
    }

    return results;
  }
}

export function getMailMaxAttempts(env: NodeJS.ProcessEnv = process.env) {
  const parsed = Number(env.MAIL_MAX_ATTEMPTS ?? 5);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 10 ? parsed : 5;
}

function sanitizeInternalLink(value: string | undefined) {
  if (!value) return undefined;
  if (!value.startsWith("/admin/")) return undefined;
  return value.slice(0, 300);
}
