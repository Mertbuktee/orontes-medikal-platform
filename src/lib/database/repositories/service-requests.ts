import type {
  Attachment,
  Prisma,
  PrismaClient,
  Role,
  ServicePriority,
  ServiceRequestPartOperation,
  ServiceRequestTechnicalActionType,
  ServiceRequestStatus,
  TechnicalServiceType,
} from "@prisma/client";

import type { StoredFileRecord } from "@/lib/security/storage";
import type {
  ServiceRequestRecord,
  ServiceRequestRepository,
} from "@/lib/services/service-requests";
import type { ServiceRequestInput } from "@/lib/validation/service-request";

export type AdminServiceRequestSort = "newest" | "oldest" | "updated";

export type AdminServiceRequestListInput = {
  status?: ServiceRequestStatus;
  assignedUserId?: string;
  hasAttachment?: boolean;
  archived?: "active" | "archived" | "all";
  query?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
  sort?: AdminServiceRequestSort;
};

export type TechnicalServiceRequestInput = {
  priority: ServicePriority;
  serviceType: TechnicalServiceType;
  reportedFault?: string | null;
  initialAssessment?: string | null;
  diagnosis?: string | null;
  workPerformed?: string | null;
  testResult?: string | null;
  finalResult?: string | null;
};

export const serviceRequestPageSizes = [20, 50, 100] as const;

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
        reportedFault: input.message,
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

  async listAdminRequests(input: AdminServiceRequestListInput = {}) {
    const pageSize = normalizePageSize(input.pageSize);
    const page = normalizePage(input.page);
    const where = buildServiceRequestWhere(input);

    const [items, total] = await this.client.$transaction([
      this.client.serviceRequest.findMany({
        where,
        orderBy: getOrderBy(input.sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
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
      }),
      this.client.serviceRequest.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  list(input: AdminServiceRequestListInput = {}) {
    return this.listAdminRequests({ ...input, pageSize: input.pageSize ?? 50 }).then(
      (result) => result.items
    );
  }

  getStatusCounts(archived: "active" | "archived" | "all" = "active") {
    return this.client.serviceRequest.groupBy({
      by: ["status"],
      where: getArchiveWhere(archived),
      _count: { status: true },
    });
  }

  async getDashboardSummary() {
    const [statusCounts, latest] = await Promise.all([
      this.getStatusCounts("active"),
      this.client.serviceRequest.findMany({
        where: { archivedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          fullName: true,
          company: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return { statusCounts, latest };
  }

  async getTechnicalDashboardSummary() {
    const [statusCounts, recentlyUpdated, latest] = await Promise.all([
      this.getStatusCounts("active"),
      this.client.serviceRequest.count({
        where: {
          archivedAt: null,
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.client.serviceRequest.findMany({
        where: { archivedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 5,
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
      }),
    ]);

    return { statusCounts, recentlyUpdated, latest };
  }

  async getLiveSnapshot() {
    const where: Prisma.ServiceRequestWhereInput = { archivedAt: null };
    const [totalActive, latestCreated, latestUpdated] = await Promise.all([
      this.client.serviceRequest.count({ where }),
      this.client.serviceRequest.findFirst({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fullName: true,
          company: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.client.serviceRequest.findFirst({
        where,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      totalActive,
      latestCreated,
      latestUpdated,
    };
  }

  async listTechnicalCustomers(limit = 100) {
    return this.client.serviceRequest.groupBy({
      by: ["email", "phone", "fullName", "company"],
      where: { archivedAt: null },
      _count: { id: true },
      _max: { updatedAt: true, createdAt: true },
      orderBy: [{ _max: { updatedAt: "desc" } }],
      take: limit,
    });
  }

  async listTechnicalDevices(limit = 100) {
    return this.client.serviceRequest.groupBy({
      by: ["deviceBrand", "deviceModel", "deviceSerialNumber", "company"],
      where: {
        archivedAt: null,
        OR: [
          { deviceBrand: { not: null } },
          { deviceModel: { not: null } },
          { deviceSerialNumber: { not: null } },
        ],
      },
      _count: { id: true },
      _max: { updatedAt: true, createdAt: true },
      orderBy: [{ _max: { updatedAt: "desc" } }],
      take: limit,
    });
  }

  listCompletedServiceHistory(limit = 100) {
    return this.client.deviceServiceHistory.findMany({
      orderBy: { completedAt: "desc" },
      take: limit,
      include: {
        completedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        serviceRequest: {
          select: {
            id: true,
            status: true,
            attachments: { select: { id: true } },
          },
        },
      },
    });
  }

  findDeviceServiceHistoryById(id: string) {
    return this.client.deviceServiceHistory.findUnique({
      where: { id },
      include: {
        serviceRequest: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });
  }

  findDeviceServiceHistoryByRequestId(serviceRequestId: string) {
    if (!("deviceServiceHistory" in this.client)) {
      return Promise.resolve(null);
    }

    return this.client.deviceServiceHistory.findUnique({
      where: { serviceRequestId },
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
        customerCompany: true,
        customerLocation: true,
        customerContact: true,
        customerDevice: {
          include: {
            customerCompany: {
              select: {
                id: true,
                displayName: true,
              },
            },
            customerLocation: {
              select: {
                id: true,
                name: true,
              },
            },
            manufacturer: {
              select: {
                id: true,
                name: true,
              },
            },
            deviceModel: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        completedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parts: {
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        technicalActions: {
          orderBy: { performedAt: "desc" },
          include: {
            performedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
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
        select: {
          id: true,
          status: true,
          diagnosis: true,
          workPerformed: true,
          finalResult: true,
        },
      });

      if (!current) {
        return null;
      }

      if (
        input.status === "COMPLETED" &&
        (!hasText(current.diagnosis) ||
          !hasText(current.workPerformed) ||
          !hasText(current.finalResult))
      ) {
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

      if (current.status !== input.status && input.status === "COMPLETED") {
        const completedRequest = await tx.serviceRequest.findUnique({
          where: { id: input.id },
          select: {
            id: true,
            fullName: true,
            company: true,
            phone: true,
            email: true,
            deviceBrand: true,
            deviceModel: true,
            deviceSerialNumber: true,
            message: true,
            updatedAt: true,
            customerDeviceId: true,
          },
        });

        if (completedRequest?.customerDeviceId) {
          await tx.customerDevice.update({
            where: { id: completedRequest.customerDeviceId },
            data: {
              lastServiceAt: completedRequest.updatedAt,
              status: "ACTIVE",
            },
          });

          await tx.deviceServiceHistory.upsert({
            where: { serviceRequestId: completedRequest.id },
            create: {
              serviceRequestId: completedRequest.id,
              completedById: input.changedById,
              fullName: completedRequest.fullName,
              company: completedRequest.company,
              phone: completedRequest.phone,
              email: completedRequest.email,
              deviceBrand: completedRequest.deviceBrand,
              deviceModel: completedRequest.deviceModel,
              deviceSerialNumber: completedRequest.deviceSerialNumber,
              serviceSummary: completedRequest.message,
              completedAt: completedRequest.updatedAt,
            },
            update: {
              completedById: input.changedById,
              fullName: completedRequest.fullName,
              company: completedRequest.company,
              phone: completedRequest.phone,
              email: completedRequest.email,
              deviceBrand: completedRequest.deviceBrand,
              deviceModel: completedRequest.deviceModel,
              deviceSerialNumber: completedRequest.deviceSerialNumber,
              serviceSummary: completedRequest.message,
              completedAt: completedRequest.updatedAt,
            },
          });
        }
      }

      return updated;
    });
  }

  updateTechnicalFields(id: string, input: TechnicalServiceRequestInput) {
    return this.client.serviceRequest.update({
      where: { id },
      data: {
        priority: input.priority,
        serviceType: input.serviceType,
        reportedFault: input.reportedFault || null,
        initialAssessment: input.initialAssessment || null,
        diagnosis: input.diagnosis || null,
        workPerformed: input.workPerformed || null,
        testResult: input.testResult || null,
        finalResult: input.finalResult || null,
      },
    });
  }

  async startTechnicalService(input: { id: string; changedById: string }) {
    return this.client.$transaction(async (tx) => {
      const current = await tx.serviceRequest.findUnique({
        where: { id: input.id },
        select: { id: true, status: true, serviceStartedAt: true },
      });

      if (!current) return null;

      const nextStatus: ServiceRequestStatus =
        current.status === "APPROVED"
          ? "IN_REPAIR"
          : current.status;

      const updated = await tx.serviceRequest.update({
        where: { id: input.id },
        data: {
          serviceStartedAt: current.serviceStartedAt ?? new Date(),
          status: nextStatus,
        },
      });

      if (current.status !== nextStatus) {
        await tx.serviceRequestStatusHistory.create({
          data: {
            serviceRequestId: input.id,
            fromStatus: current.status,
            toStatus: nextStatus,
            changedById: input.changedById,
          },
        });
      }

      return updated;
    });
  }

  addPart(input: {
    serviceRequestId: string;
    partName: string;
    partNumber?: string | null;
    serialNumber?: string | null;
    quantity: number;
    operation: ServiceRequestPartOperation;
    notes?: string | null;
    createdById: string;
  }) {
    return this.client.serviceRequestPart.create({
      data: {
        serviceRequestId: input.serviceRequestId,
        partName: input.partName,
        partNumber: input.partNumber || null,
        serialNumber: input.serialNumber || null,
        quantity: input.quantity,
        operation: input.operation,
        notes: input.notes || null,
        createdById: input.createdById,
      },
    });
  }

  addTechnicalAction(input: {
    serviceRequestId: string;
    actionType: ServiceRequestTechnicalActionType;
    description: string;
    performedById: string;
    performedAt?: Date | null;
  }) {
    return this.client.serviceRequestTechnicalAction.create({
      data: {
        serviceRequestId: input.serviceRequestId,
        actionType: input.actionType,
        description: input.description,
        performedById: input.performedById,
        performedAt: input.performedAt || new Date(),
      },
    });
  }

  async completeTechnicalServiceRequest(input: {
    id: string;
    completedById: string;
  }) {
    return this.client.$transaction(async (tx) => {
      const current = await tx.serviceRequest.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          status: true,
          fullName: true,
          company: true,
          phone: true,
          email: true,
          deviceBrand: true,
          deviceModel: true,
          deviceSerialNumber: true,
          message: true,
          diagnosis: true,
          workPerformed: true,
          finalResult: true,
          serviceCompletedAt: true,
          customerDeviceId: true,
        },
      });

      if (
        !current ||
        !hasText(current.diagnosis) ||
        !hasText(current.workPerformed) ||
        !hasText(current.finalResult)
      ) {
        return null;
      }

      const completedAt = current.serviceCompletedAt ?? new Date();
      const updated = await tx.serviceRequest.update({
        where: { id: input.id },
        data: {
          status: "COMPLETED",
          serviceCompletedAt: completedAt,
          completedById: input.completedById,
          archivedAt: null,
        },
      });

      if (current.status !== "COMPLETED") {
        await tx.serviceRequestStatusHistory.create({
          data: {
            serviceRequestId: input.id,
            fromStatus: current.status,
            toStatus: "COMPLETED",
            changedById: input.completedById,
          },
        });
      }

      if (current.customerDeviceId) {
        await tx.customerDevice.update({
          where: { id: current.customerDeviceId },
          data: {
            lastServiceAt: completedAt,
            status: "ACTIVE",
          },
        });

        await tx.deviceServiceHistory.upsert({
          where: { serviceRequestId: current.id },
          create: {
            serviceRequestId: current.id,
            completedById: input.completedById,
            fullName: current.fullName,
            company: current.company,
            phone: current.phone,
            email: current.email,
            deviceBrand: current.deviceBrand,
            deviceModel: current.deviceModel,
            deviceSerialNumber: current.deviceSerialNumber,
            serviceSummary: current.finalResult || current.message,
            completedAt,
          },
          update: {
            completedById: input.completedById,
            fullName: current.fullName,
            company: current.company,
            phone: current.phone,
            email: current.email,
            deviceBrand: current.deviceBrand,
            deviceModel: current.deviceModel,
            deviceSerialNumber: current.deviceSerialNumber,
            serviceSummary: current.finalResult || current.message,
            completedAt,
          },
        });
      }

      return updated;
    });
  }

  assignUser(input: {
    id: string;
    assignedUserId: string | null;
  }) {
    return this.client.serviceRequest.update({
      where: { id: input.id },
      data: { assignedUserId: input.assignedUserId },
    });
  }

  archive(input: { id: string; changedById: string }) {
    return this.updateStatus({
      id: input.id,
      status: "ARCHIVED",
      changedById: input.changedById,
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

  listAssignableUsers() {
    const assignableRoles: Role[] = ["SUPER_ADMIN", "ADMIN", "SERVICE_STAFF"];

    return this.client.user.findMany({
      where: {
        isActive: true,
        role: { in: assignableRoles },
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function buildServiceRequestWhere(
  input: AdminServiceRequestListInput
): Prisma.ServiceRequestWhereInput {
  const query = input.query?.trim().slice(0, 120);

  return {
    ...getArchiveWhere(input.archived ?? "active"),
    status: input.status,
    assignedUserId: input.assignedUserId || undefined,
    createdAt:
      input.dateFrom || input.dateTo
        ? {
            gte: input.dateFrom,
            lte: input.dateTo,
          }
        : undefined,
    attachments:
      typeof input.hasAttachment === "boolean"
        ? input.hasAttachment
          ? { some: {} }
          : { none: {} }
        : undefined,
    ...(query
      ? {
          OR: [
            { id: { contains: query, mode: "insensitive" } },
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
  };
}

function getArchiveWhere(
  archived: "active" | "archived" | "all"
): Prisma.ServiceRequestWhereInput {
  if (archived === "all") {
    return {};
  }

  if (archived === "archived") {
    return { archivedAt: { not: null } };
  }

  return { archivedAt: null };
}

function getOrderBy(
  sort: AdminServiceRequestSort | undefined
): Prisma.ServiceRequestOrderByWithRelationInput {
  if (sort === "oldest") {
    return { createdAt: "asc" };
  }

  if (sort === "updated") {
    return { updatedAt: "desc" };
  }

  return { createdAt: "desc" };
}

export function normalizePage(value: number | undefined) {
  if (!Number.isFinite(value) || !value || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

export function normalizePageSize(value: number | undefined) {
  return serviceRequestPageSizes.includes(
    value as (typeof serviceRequestPageSizes)[number]
  )
    ? (value as (typeof serviceRequestPageSizes)[number])
    : 20;
}

export type AdminServiceRequestListItem = Awaited<
  ReturnType<PrismaServiceRequestRepository["list"]>
>[number];

export type AdminServiceRequestDetail = NonNullable<
  Awaited<ReturnType<PrismaServiceRequestRepository["findById"]>>
>;

export type AdminServiceRequestAttachment = Attachment;
