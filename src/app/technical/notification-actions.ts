"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaNotificationRepository } from "@/lib/database/repositories/notifications";
import { isSameOriginHeaders } from "@/lib/security/action-origin";

export async function markTechnicalNotificationRead(formData: FormData) {
  const session = await requirePermission("notifications.view");
  await assertSameOriginAction();

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/technical/notifications?status=invalid");

  await new PrismaNotificationRepository(prisma).markRead({
    userId: session.userId,
    id,
  });

  revalidateTechnicalNotifications();
  redirect("/technical/notifications?status=read");
}

export async function markAllTechnicalNotificationsRead() {
  const session = await requirePermission("notifications.view");
  await assertSameOriginAction();

  await new PrismaNotificationRepository(prisma).markAllRead(session.userId);
  revalidateTechnicalNotifications();
  redirect("/technical/notifications?status=all-read");
}

async function assertSameOriginAction() {
  if (!isSameOriginHeaders(await headers())) {
    throw new Error("Invalid action origin.");
  }
}

function revalidateTechnicalNotifications() {
  revalidatePath("/technical/notifications");
  revalidatePath("/technical/dashboard");
}
