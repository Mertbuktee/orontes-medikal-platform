'use server';

import { ServiceRequestStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';

import { canTransitionServiceRequestStatus } from '@/components/admin/service-request-status';
import { requirePermission } from '@/lib/auth/admin-session';
import { AdminAuthRepository } from '@/lib/auth/admin-auth-repository';
import { getAdminRequestContext } from '@/lib/auth/request-context';
import { prisma } from '@/lib/database/prisma';
import { PrismaServiceRequestRepository } from '@/lib/database/repositories/service-requests';
import { noopServiceRequestEventPublisher } from '@/lib/domain/service-request-events';
import { makeAdminUrl } from '@/lib/notifications/email-templates';
import { NotificationService } from '@/lib/notifications/notification-service';
import { assertSameOriginAction } from '@/lib/security/action-origin';

const statusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(ServiceRequestStatus),
  reason: z.string().trim().max(500).optional(),
});

const assignmentSchema = z.object({
  id: z.string().min(1),
  assignedUserId: z.string().min(1).optional(),
});

const noteSchema = z.object({
  serviceRequestId: z.string().min(1),
  content: z.string().trim().min(1).max(2000),
});

const archiveSchema = z.object({
  id: z.string().min(1),
  reason: z.string().trim().max(500).optional(),
});

export async function updateServiceRequestStatus(formData: FormData) {
  const session = await requirePermission('serviceRequests.update');
  await assertSameOriginAction();
  const parsed = statusSchema.safeParse({
    id: formData.get('id'),
    status: formData.get('status'),
    reason: formData.get('reason') || undefined,
  });

  if (!parsed.success) {
    return;
  }

  if (parsed.data.status === 'ARCHIVED') {
    await requirePermission('serviceRequests.archive');
  }

  const repository = new PrismaServiceRequestRepository(prisma);
  const current = await repository.findById(parsed.data.id);

  if (
    !current ||
    !canTransitionServiceRequestStatus(current.status, parsed.data.status)
  ) {
    return;
  }

  const requestContext = getAdminRequestContext(await headers());
  const auditRepository = new AdminAuthRepository(prisma);
  const updated = await repository.updateStatus({
    id: parsed.data.id,
    status: parsed.data.status,
    changedById: session.userId,
  });

  if (updated) {
    await auditRepository.appendAuditLog({
      actorId: session.userId,
      action: 'STATUS_CHANGE',
      entityType: 'ServiceRequest',
      entityId: updated.id,
      metadata: {
        fromStatus: current.status,
        toStatus: parsed.data.status,
        reason: parsed.data.reason || undefined,
      },
      context: requestContext,
    });

    await noopServiceRequestEventPublisher.publish({
      type: 'service_request.status_changed',
      serviceRequestId: updated.id,
      fromStatus: current.status,
      toStatus: parsed.data.status,
    });
  }

  revalidateServiceRequestPaths(parsed.data.id);
}

export async function assignServiceRequest(formData: FormData) {
  const session = await requirePermission('serviceRequests.assign');
  await assertSameOriginAction();
  const parsed = assignmentSchema.safeParse({
    id: formData.get('id'),
    assignedUserId: formData.get('assignedUserId') || undefined,
  });

  if (!parsed.success) {
    return;
  }

  const repository = new PrismaServiceRequestRepository(prisma);
  const requestContext = getAdminRequestContext(await headers());
  const auditRepository = new AdminAuthRepository(prisma);
  const updated = await repository.assignUser({
    id: parsed.data.id,
    assignedUserId: parsed.data.assignedUserId ?? null,
  });

  if (parsed.data.assignedUserId) {
    const assignee = await prisma.user.findUnique({
      where: { id: parsed.data.assignedUserId },
      select: { id: true, email: true, name: true },
    });
    if (assignee) {
      await new NotificationService().notifyUser({
        userId: assignee.id,
        category: 'SERVICE_REQUEST_ASSIGNED',
        title: 'Servis talebi atandi',
        message: `Talep ${updated.id.slice(0, 8).toUpperCase()} size atandi.`,
        linkUrl: `/admin/service-requests/${updated.id}`,
        email: {
          to: { email: assignee.email, name: assignee.name },
          templateKey: 'service-request-assigned',
          payload: {
            requestShortId: updated.id.slice(0, 8).toUpperCase(),
            customerLabel: updated.company || updated.fullName,
            hasAttachment: false,
            adminUrl: await makeAdminUrl(
              `/admin/service-requests/${updated.id}`,
            ),
          },
          idempotencyKey: `service-request-assigned:${updated.id}:${assignee.id}:${Date.now()}`,
        },
        context: requestContext,
      });
    }
  }

  await auditRepository.appendAuditLog({
    actorId: session.userId,
    action: 'UPDATE',
    entityType: 'ServiceRequestAssignment',
    entityId: updated.id,
    metadata: {
      assignedUserId: parsed.data.assignedUserId ?? null,
    },
    context: requestContext,
  });

  revalidateServiceRequestPaths(parsed.data.id);
}

export async function archiveServiceRequest(formData: FormData) {
  const session = await requirePermission('serviceRequests.archive');
  await assertSameOriginAction();
  const parsed = archiveSchema.safeParse({
    id: formData.get('id'),
    reason: formData.get('reason') || undefined,
  });

  if (!parsed.success) {
    return;
  }

  const repository = new PrismaServiceRequestRepository(prisma);
  const current = await repository.findById(parsed.data.id);

  if (
    !current ||
    !canTransitionServiceRequestStatus(current.status, 'ARCHIVED')
  ) {
    return;
  }

  const requestContext = getAdminRequestContext(await headers());
  const auditRepository = new AdminAuthRepository(prisma);
  const updated = await repository.archive({
    id: parsed.data.id,
    changedById: session.userId,
  });

  if (updated) {
    await auditRepository.appendAuditLog({
      actorId: session.userId,
      action: 'ARCHIVE',
      entityType: 'ServiceRequest',
      entityId: updated.id,
      metadata: {
        fromStatus: current.status,
        toStatus: 'ARCHIVED',
        reason: parsed.data.reason || undefined,
      },
      context: requestContext,
    });

    await noopServiceRequestEventPublisher.publish({
      type: 'service_request.status_changed',
      serviceRequestId: updated.id,
      fromStatus: current.status,
      toStatus: 'ARCHIVED',
    });
  }

  revalidateServiceRequestPaths(parsed.data.id);
}

export async function addServiceRequestNote(formData: FormData) {
  const session = await requirePermission('serviceRequests.notes.create');
  await assertSameOriginAction();
  const parsed = noteSchema.safeParse({
    serviceRequestId: formData.get('serviceRequestId'),
    content: formData.get('content'),
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
    action: 'UPDATE',
    entityType: 'ServiceRequestNote',
    entityId: note.id,
    metadata: {
      serviceRequestId: parsed.data.serviceRequestId,
    },
    context: requestContext,
  });

  await noopServiceRequestEventPublisher.publish({
    type: 'service_request.note_added',
    serviceRequestId: parsed.data.serviceRequestId,
    noteId: note.id,
  });

  revalidateServiceRequestPaths(parsed.data.serviceRequestId);
}

function revalidateServiceRequestPaths(id: string) {
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/service-requests');
  revalidatePath(`/admin/service-requests/${id}`);
}
