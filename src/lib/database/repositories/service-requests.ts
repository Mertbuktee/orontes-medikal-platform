import type {
  Attachment,
  PrismaClient,
  ServiceRequestStatus,
} from "@prisma/client";

import type { StoredFileRecord } from "@/lib/security/storage";
import type {
  ServiceRequestRecord,
  ServiceRequestRepository,
} from "@/lib/services/service-requests";
import type { ServiceRequestInput } from "@/lib/validation/service-request";

export class PrismaServiceRequestRepository
  implements ServiceRequestRepository
{
  constructor(private readonly client: PrismaClient) {}

  async save(
    input: ServiceRequestInput,
    attachment?: StoredFileRecord
  ): Promise<ServiceRequestRecord> {
    const record = await this.client.serviceRequest.create({
      data: {
        fullName: input.fullName,
        company: input.company,
        phone: input.phone,
        email: input.email,
        deviceBrand: input.deviceBrand ?? null,
        deviceModel: input.deviceModel ?? null,
        deviceSerialNumber: input.deviceSerialNumber ?? null,
        message: input.message,
        attachments: attachment
          ? {
              create: {
                storageKey: attachment.storageKey,
                mimeType: attachment.mimeType,
                size: attachment.size,
              },
            }
          : undefined,
      },
      include: {
        attachments: true,
      },
    });

    return {
      id: record.id,
      attachment,
    };
  }

  async list(input: {
    status?: ServiceRequestStatus;
    query?: string;
    take?: number;
  } = {}) {
    const query = input.query?.trim();

    return this.client.serviceRequest.findMany({
      where: {
        archivedAt: null,
        status: input.status,
        ...(query
          ? {
              OR: [
                { fullName: { contains: query, mode: "insensitive" } },
                { company: { contains: query, mode: "insensitive" } },
                { phone: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
                { deviceBrand: { contains: query, mode: "insensitive" } },
                { deviceModel: { contains: query, mode: "insensitive" } },
                { deviceSerialNumber: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: input.take ?? 50,
      include: {
        attachments: true,
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  getStatusCounts() {
    return this.client.serviceRequest.groupBy({
      by: ["status"],
      where: { archivedAt: null },
      _count: { status: true },
    });
  }

  findById(id: string) {
    return this.client.serviceRequest.findUnique({
      where: { id },
      include: {
        attachments: true,
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        internalNotes: {
          orderBy: { createdAt: "desc" },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
          include: {
            changedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async updateStatus(input: {
    id: string;
    status: ServiceRequestStatus;
    changedById: string;
  }) {
    return this.client.$transaction(async (tx) => {
      const current = await tx.serviceRequest.findUnique({
        where: { id: input.id },
        select: { id: true, status: true },
      });

      if (!current) {
        return null;
      }

      const updated = await tx.serviceRequest.update({
        where: { id: input.id },
        data: {
          status: input.status,
          archivedAt: input.status === "ARCHIVED" ? new Date() : null,
        },
      });

      if (current.status !== input.status) {
        await tx.serviceRequestStatusHistory.create({
          data: {
            serviceRequestId: input.id,
            fromStatus: current.status,
            toStatus: input.status,
            changedById: input.changedById,
          },
        });
      }

      return updated;
    });
  }

  addNote(input: {
    serviceRequestId: string;
    authorId: string;
    content: string;
  }) {
    return this.client.serviceRequestNote.create({
      data: {
        serviceRequestId: input.serviceRequestId,
        authorId: input.authorId,
        content: input.content,
      },
    });
  }

  findAttachment(input: { serviceRequestId: string; attachmentId: string }) {
    return this.client.attachment.findFirst({
      where: {
        id: input.attachmentId,
        serviceRequestId: input.serviceRequestId,
      },
    });
  }
}

export type AdminServiceRequestListItem = Awaited<
  ReturnType<PrismaServiceRequestRepository["list"]>
>[number];

export type AdminServiceRequestDetail = NonNullable<
  Awaited<ReturnType<PrismaServiceRequestRepository["findById"]>>
>;

export type AdminServiceRequestAttachment = Attachment;
