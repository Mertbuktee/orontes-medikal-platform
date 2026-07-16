"use server";

import { randomUUID } from "node:crypto";

import type { AuditAction, Prisma } from "@prisma/client";
import {
  ServicePriority,
  ServiceRequestPartOperation,
  ServiceRequestTechnicalActionType,
  TechnicalServiceType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
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

const technicalFieldsSchema = z.object({
  serviceRequestId: z.string().min(1),
  priority: z.enum(ServicePriority),
  serviceType: z.enum(TechnicalServiceType),
  reportedFault: z.string().trim().max(4000).optional(),
  initialAssessment: z.string().trim().max(4000).optional(),
  diagnosis: z.string().trim().max(4000).optional(),
  workPerformed: z.string().trim().max(4000).optional(),
  testResult: z.string().trim().max(4000).optional(),
  finalResult: z.string().trim().max(4000).optional(),
});

const requestIdSchema = z.object({
  serviceRequestId: z.string().min(1),
});

const technicalActionSchema = z.object({
  serviceRequestId: z.string().min(1),
  actionType: z.enum(ServiceRequestTechnicalActionType),
  description: z.string().trim().min(2).max(4000),
});

const partSchema = z.object({
  serviceRequestId: z.string().min(1),
  partName: z.string().trim().min(1).max(180),
  partNumber: z.string().trim().max(120).optional(),
  serialNumber: z.string().trim().max(120).optional(),
  quantity: z.coerce.number().int().min(1).max(999),
  operation: z.enum(ServiceRequestPartOperation),
  notes: z.string().trim().max(2000).optional(),
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

export async function updateTechnicalServiceFields(formData: FormData) {
  const session = await requirePermission("serviceRequests.update");
  await assertSameOriginAction();
  const parsed = technicalFieldsSchema.safeParse({
    serviceRequestId: formData.get("serviceRequestId"),
    priority: formData.get("priority"),
    serviceType: formData.get("serviceType"),
    reportedFault: formData.get("reportedFault") || undefined,
    initialAssessment: formData.get("initialAssessment") || undefined,
    diagnosis: formData.get("diagnosis") || undefined,
    workPerformed: formData.get("workPerformed") || undefined,
    testResult: formData.get("testResult") || undefined,
    finalResult: formData.get("finalResult") || undefined,
  });

  if (!parsed.success) return;

  const repository = new PrismaServiceRequestRepository(prisma);
  const updated = await repository.updateTechnicalFields(
    parsed.data.serviceRequestId,
    parsed.data,
  );

  await appendTechnicalAudit(session.userId, "UPDATE", updated.id, {
    serviceRequestId: updated.id,
    section: "technical-fields",
  });
  revalidateTechnicalRequest(updated.id);
}

export async function startTechnicalService(formData: FormData) {
  const session = await requirePermission("serviceRequests.update");
  await assertSameOriginAction();
  const parsed = requestIdSchema.safeParse({
    serviceRequestId: formData.get("serviceRequestId"),
  });

  if (!parsed.success) return;

  const repository = new PrismaServiceRequestRepository(prisma);
  const updated = await repository.startTechnicalService({
    id: parsed.data.serviceRequestId,
    changedById: session.userId,
  });

  if (!updated) return;

  await appendTechnicalAudit(session.userId, "UPDATE", updated.id, {
    serviceRequestId: updated.id,
    action: "start-technical-service",
  });
  revalidateTechnicalRequest(updated.id);
}

export async function addTechnicalServiceAction(formData: FormData) {
  const session = await requirePermission("serviceRequests.update");
  await assertSameOriginAction();
  const parsed = technicalActionSchema.safeParse({
    serviceRequestId: formData.get("serviceRequestId"),
    actionType: formData.get("actionType"),
    description: formData.get("description"),
  });

  if (!parsed.success) return;

  const repository = new PrismaServiceRequestRepository(prisma);
  const action = await repository.addTechnicalAction({
    serviceRequestId: parsed.data.serviceRequestId,
    actionType: parsed.data.actionType,
    description: parsed.data.description,
    performedById: session.userId,
  });

  await appendTechnicalAudit(session.userId, "UPDATE", action.id, {
    serviceRequestId: parsed.data.serviceRequestId,
    actionType: parsed.data.actionType,
    section: "technical-action",
  });
  revalidateTechnicalRequest(parsed.data.serviceRequestId);
}

export async function addServiceRequestPart(formData: FormData) {
  const session = await requirePermission("serviceRequests.update");
  await assertSameOriginAction();
  const parsed = partSchema.safeParse({
    serviceRequestId: formData.get("serviceRequestId"),
    partName: formData.get("partName"),
    partNumber: formData.get("partNumber") || undefined,
    serialNumber: formData.get("serialNumber") || undefined,
    quantity: formData.get("quantity"),
    operation: formData.get("operation"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) return;

  const repository = new PrismaServiceRequestRepository(prisma);
  const part = await repository.addPart({
    serviceRequestId: parsed.data.serviceRequestId,
    partName: parsed.data.partName,
    partNumber: parsed.data.partNumber,
    serialNumber: parsed.data.serialNumber,
    quantity: parsed.data.quantity,
    operation: parsed.data.operation,
    notes: parsed.data.notes,
    createdById: session.userId,
  });

  await appendTechnicalAudit(session.userId, "UPDATE", part.id, {
    serviceRequestId: parsed.data.serviceRequestId,
    operation: parsed.data.operation,
    section: "part",
  });
  revalidateTechnicalRequest(parsed.data.serviceRequestId);
}

export async function completeTechnicalService(formData: FormData) {
  const session = await requirePermission("serviceRequests.update");
  await assertSameOriginAction();
  const parsed = requestIdSchema.safeParse({
    serviceRequestId: formData.get("serviceRequestId"),
  });

  if (!parsed.success) return;

  const repository = new PrismaServiceRequestRepository(prisma);
  const updated = await repository.completeTechnicalServiceRequest({
    id: parsed.data.serviceRequestId,
    completedById: session.userId,
  });

  if (!updated) {
    redirect(`/technical/service-requests/${parsed.data.serviceRequestId}?status=completion-blocked`);
  }

  await appendTechnicalAudit(session.userId, "STATUS_CHANGE", updated.id, {
    serviceRequestId: updated.id,
    toStatus: "COMPLETED",
    completedById: session.userId,
  });
  revalidateTechnicalRequest(updated.id);
}

async function appendTechnicalAudit(
  actorId: string,
  action: AuditAction,
  entityId: string,
  metadata: Prisma.InputJsonValue,
) {
  await new AdminAuthRepository(prisma).appendAuditLog({
    actorId,
    action,
    entityType: "ServiceRequest",
    entityId,
    metadata,
    context: getAdminRequestContext(await headers()),
  });
}

function revalidateTechnicalRequest(id: string) {
  revalidatePath("/technical/service-requests");
  revalidatePath(`/technical/service-requests/${id}`);
  revalidatePath("/technical/history");
  revalidatePath("/technical/devices");
  revalidatePath("/admin/service-requests");
  revalidatePath(`/admin/service-requests/${id}`);
}
