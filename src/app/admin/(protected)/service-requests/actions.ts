"use server";

import { ServiceRequestStatus } from "@prisma/client";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission } from "@/lib/auth/admin-session";
import { AdminAuthRepository } from "@/lib/auth/admin-auth-repository";
import { getAdminRequestContext } from "@/lib/auth/request-context";
import { prisma } from "@/lib/database/prisma";
import { PrismaServiceRequestRepository } from "@/lib/database/repositories/service-requests";

const statusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(ServiceRequestStatus),
});

const noteSchema = z.object({
  serviceRequestId: z.string().min(1),
  content: z.string().trim().min(2).max(2000),
});

export async function updateServiceRequestStatus(formData: FormData) {
  const session = await requirePermission("serviceRequests.update");
  const parsed = statusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return;
  }

  const requestContext = getAdminRequestContext(await headers());
  const repository = new PrismaServiceRequestRepository(prisma);
  const auditRepository = new AdminAuthRepository(prisma);
  const updated = await repository.updateStatus({
    id: parsed.data.id,
    status: parsed.data.status,
    changedById: session.userId,
  });

  if (updated) {
    await auditRepository.appendAuditLog({
      actorId: session.userId,
      action: "STATUS_CHANGE",
      entityType: "ServiceRequest",
      entityId: updated.id,
      metadata: {
        status: parsed.data.status,
      },
      context: requestContext,
    });
  }

  revalidatePath("/admin/service-requests");
  revalidatePath(`/admin/service-requests/${parsed.data.id}`);
}

export async function addServiceRequestNote(formData: FormData) {
  const session = await requirePermission("serviceRequests.update");
  const parsed = noteSchema.safeParse({
    serviceRequestId: formData.get("serviceRequestId"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return;
  }

  const requestContext = getAdminRequestContext(await headers());
  const repository = new PrismaServiceRequestRepository(prisma);
  const auditRepository = new AdminAuthRepository(prisma);
  const note = await repository.addNote({
    serviceRequestId: parsed.data.serviceRequestId,
    authorId: session.userId,
    content: parsed.data.content,
  });

  await auditRepository.appendAuditLog({
    actorId: session.userId,
    action: "UPDATE",
    entityType: "ServiceRequestNote",
    entityId: note.id,
    metadata: {
      serviceRequestId: parsed.data.serviceRequestId,
    },
    context: requestContext,
  });

  revalidatePath(`/admin/service-requests/${parsed.data.serviceRequestId}`);
}
