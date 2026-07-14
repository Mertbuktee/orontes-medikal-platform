"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/auth/admin-session";
import { AdminAuthRepository } from "@/lib/auth/admin-auth-repository";
import { getAdminRequestContext } from "@/lib/auth/request-context";
import { prisma } from "@/lib/database/prisma";
import { PrismaNotificationRepository } from "@/lib/database/repositories/notifications";
import { getTransactionalEmailProvider } from "@/lib/notifications/email-provider";
import { renderEmailTemplate } from "@/lib/notifications/email-templates";
import { getMailConfig } from "@/lib/notifications/mail-config";
import {
  emailDeliveryActionSchema,
  notificationPreferenceSchema,
  sendTestEmailSchema,
} from "@/lib/notifications/notification-validation";
import { isSameOriginHeaders } from "@/lib/security/action-origin";
import { InMemoryRateLimiter } from "@/lib/security/rate-limit";

const testEmailRateLimiter = new InMemoryRateLimiter(3, 15 * 60 * 1000);
const retryRateLimiter = new InMemoryRateLimiter(10, 15 * 60 * 1000);

export async function markNotificationRead(formData: FormData) {
  const session = await requirePermission("notifications.view");
  await assertSameOriginAction();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/notifications?status=invalid");
  await new PrismaNotificationRepository(prisma).markRead({
    userId: session.userId,
    id,
  });
  revalidateNotifications();
  redirect("/admin/notifications?status=read");
}

export async function markAllNotificationsRead() {
  const session = await requirePermission("notifications.view");
  await assertSameOriginAction();
  await new PrismaNotificationRepository(prisma).markAllRead(session.userId);
  revalidateNotifications();
  redirect("/admin/notifications?status=all-read");
}

export async function updateNotificationPreference(formData: FormData) {
  const session = await requirePermission("notifications.preferences.manage.own");
  await assertSameOriginAction();
  const parsed = notificationPreferenceSchema.safeParse({
    category: formData.get("category"),
    emailEnabled: formData.get("emailEnabled") === "on",
    inAppEnabled: formData.get("inAppEnabled") === "on",
  });
  if (!parsed.success) redirect("/admin/account/notifications?status=invalid");

  await new PrismaNotificationRepository(prisma).updateUserPreference({
    userId: session.userId,
    ...parsed.data,
  });
  await new AdminAuthRepository(prisma).appendAuditLog({
    actorId: session.userId,
    action: "UPDATE",
    entityType: "NotificationPreference",
    metadata: {
      category: parsed.data.category,
      changedFields: ["emailEnabled", "inAppEnabled"],
    },
    context: getAdminRequestContext(await headers()),
  });
  revalidateNotifications();
  redirect("/admin/account/notifications?status=updated");
}

export async function sendTestEmail(formData: FormData) {
  const session = await requirePermission("notifications.testEmail.send");
  await assertSameOriginAction();
  const parsed = sendTestEmailSchema.safeParse({
    recipient: formData.get("recipient"),
  });
  if (!parsed.success) redirect("/admin/settings/email?status=invalid");
  const context = getAdminRequestContext(await headers());
  const limit = testEmailRateLimiter.check(
    `${session.userId}::${context.ipAddress}`
  );
  if (!limit.allowed) redirect("/admin/settings/email?status=rate-limited");

  const config = getMailConfig();
  const repository = new PrismaNotificationRepository(prisma);
  const rendered = await renderEmailTemplate({
    key: "test-email",
    payload: {
      title: "Orontes test e-postasi",
      body: "Bu mesaj SMTP ve notification altyapisini test etmek icin olusturuldu.",
      ctaHref: "/admin/settings/email",
      ctaLabel: "E-posta ayarlarini ac",
    },
    supportEmail: config.supportEmail,
  });
  const provider = getTransactionalEmailProvider(config);
  const delivery = await repository.enqueueEmail({
    recipient: parsed.data.recipient,
    templateKey: "test-email",
    subject: rendered.subject,
    provider: config.provider,
    templatePayload: {
      title: "Orontes test e-postasi",
      body: "Bu mesaj SMTP ve notification altyapisini test etmek icin olusturuldu.",
    },
  });
  const result = await provider.send({
    to: [{ email: parsed.data.recipient }],
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    tags: ["test-email"],
  });
  if (result.accepted) {
    await repository.markSent({
      id: delivery.id,
      providerMessageId: result.providerMessageId,
    });
  } else {
    await repository.markFailed({
      id: delivery.id,
      errorCode: result.errorCode,
      errorSummary: result.errorCode,
    });
  }

  await new AdminAuthRepository(prisma).appendAuditLog({
    actorId: session.userId,
    action: "CREATE",
    entityType: "TestEmail",
    metadata: {
      provider: config.provider,
      status: result.accepted ? "sent" : "failed",
    },
    context,
  });

  redirect(`/admin/settings/email?status=${result.accepted ? "sent" : "failed"}`);
}

export async function retryEmailDelivery(formData: FormData) {
  const session = await requirePermission("notifications.emailDeliveries.retry");
  await assertSameOriginAction();
  const parsed = emailDeliveryActionSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) redirect("/admin/notifications/email-deliveries?status=invalid");
  const context = getAdminRequestContext(await headers());
  const limit = retryRateLimiter.check(`${session.userId}::${context.ipAddress}`);
  if (!limit.allowed) redirect("/admin/notifications/email-deliveries?status=rate-limited");
  await new PrismaNotificationRepository(prisma).retryFailed(parsed.data.id);
  await new AdminAuthRepository(prisma).appendAuditLog({
    actorId: session.userId,
    action: "UPDATE",
    entityType: "EmailDelivery",
    entityId: parsed.data.id,
    metadata: { status: "retry_requested" },
    context,
  });
  revalidatePath("/admin/notifications/email-deliveries");
}

export async function cancelEmailDelivery(formData: FormData) {
  const session = await requirePermission("notifications.emailDeliveries.cancel");
  await assertSameOriginAction();
  const parsed = emailDeliveryActionSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) redirect("/admin/notifications/email-deliveries?status=invalid");
  await new PrismaNotificationRepository(prisma).cancelPending(parsed.data.id);
  await new AdminAuthRepository(prisma).appendAuditLog({
    actorId: session.userId,
    action: "STATUS_CHANGE",
    entityType: "EmailDelivery",
    entityId: parsed.data.id,
    metadata: { status: "cancelled" },
    context: getAdminRequestContext(await headers()),
  });
  revalidatePath("/admin/notifications/email-deliveries");
}

async function assertSameOriginAction() {
  if (!isSameOriginHeaders(await headers())) {
    throw new Error("Invalid action origin.");
  }
}

function revalidateNotifications() {
  revalidatePath("/admin/notifications");
  revalidatePath("/admin/account/notifications");
  revalidatePath("/admin/dashboard");
}
