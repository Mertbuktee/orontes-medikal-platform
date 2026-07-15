"use server";

import { randomUUID } from "node:crypto";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";

import { requirePermission } from "@/lib/auth/admin-session";
import { AdminAuthRepository } from "@/lib/auth/admin-auth-repository";
import { getAdminRequestContext } from "@/lib/auth/request-context";
import { prisma } from "@/lib/database/prisma";
import { PrismaServiceRequestRepository } from "@/lib/database/repositories/service-requests";
import { noopServiceRequestEventPublisher } from "@/lib/domain/service-request-events";
import { NotificationService } from "@/lib/notifications/notification-service";
import { assertSameOriginAction } from "@/lib/security/action-origin";

const technicalServiceRequestSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  company: z.string().trim().min(2).max(150),
  phone: z.string().trim().min(1).max(30),
  email: z.string().trim().email().max(254),
  deviceBrand: z.string().trim().max(120).optional(),
  deviceModel: z.string().trim().max(120).optional(),
  deviceSerialNumber: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10).max(3000),
});

export async function createTechnicalServiceRequest(formData: FormData) {
  const session = await requirePermission("serviceRequests.create");
  await assertSameOriginAction();

  const parsed = technicalServiceRequestSchema.safeParse({
    fullName: formData.get("fullName"),
    company: formData.get("company"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    deviceBrand: formData.get("deviceBrand") || undefined,
    deviceModel: formData.get("deviceModel") || undefined,
    deviceSerialNumber: formData.get("deviceSerialNumber") || undefined,
    message: formData.get("message"),
  });

  if (!parsed.success) {
    redirect("/technical/service-requests/new?status=invalid");
  }

  const repository = new PrismaServiceRequestRepository(prisma);
  const saved = await repository.save({
    ...parsed.data,
    website: "",
    formStartedAt: Date.now(),
  });
  const context = getAdminRequestContext(await headers());

  await new AdminAuthRepository(prisma).appendAuditLog({
    actorId: session.userId,
    action: "CREATE",
    entityType: "ServiceRequest",
    entityId: saved.id,
    metadata: {
      source: "technical-panel",
      requestId: randomUUID(),
    },
    context,
  });

  await noopServiceRequestEventPublisher.publish({
    type: "service_request.created",
    serviceRequestId: saved.id,
    hasAttachment: false,
  });

  await new NotificationService()
    .notifyNewServiceRequest({
      serviceRequestId: saved.id,
      requestShortId: saved.id.slice(0, 8).toUpperCase(),
      customerLabel: parsed.data.company || parsed.data.fullName,
      hasAttachment: false,
    })
    .catch(() => undefined);

  redirect(`/technical/service-requests/${saved.id}`);
}
