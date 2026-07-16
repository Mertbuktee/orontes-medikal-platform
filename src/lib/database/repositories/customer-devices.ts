import type {
  CustomerDeviceCriticality,
  CustomerDeviceStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";

export type CustomerDeviceInput = {
  customerCompanyId: string;
  customerLocationId: string;
  deviceGroupId?: string | null;
  manufacturerId?: string | null;
  deviceModelId?: string | null;
  customManufacturer?: string | null;
  customModel?: string | null;
  serialNumber: string;
  assetTag?: string | null;
  hospitalInventoryNumber?: string | null;
  department?: string | null;
  room?: string | null;
  installationDate?: Date | null;
  purchaseDate?: Date | null;
  warrantyEndDate?: Date | null;
  status: CustomerDeviceStatus;
  criticality: CustomerDeviceCriticality;
  notes?: string | null;
  isActive?: boolean;
};

export type CustomerDeviceListInput = {
  query?: string;
  customerCompanyId?: string;
  status?: CustomerDeviceStatus;
  includeArchived?: boolean;
};

export class PrismaCustomerDeviceRepository {
  constructor(private readonly client: PrismaClient) {}

  listDevices(input: CustomerDeviceListInput = {}) {
    return this.client.customerDevice.findMany({
      where: buildDeviceWhere(input),
      orderBy: [{ archivedAt: "asc" }, { updatedAt: "desc" }],
      include: defaultDeviceInclude,
      take: 200,
    });
  }

  listDeviceOptions(customerCompanyId?: string) {
    return this.client.customerDevice.findMany({
      where: {
        archivedAt: null,
        isActive: true,
        ...(customerCompanyId ? { customerCompanyId } : {}),
      },
      orderBy: [{ publicCode: "asc" }],
      select: {
        id: true,
        publicCode: true,
        serialNumber: true,
        customManufacturer: true,
        customModel: true,
        manufacturer: { select: { name: true } },
        deviceModel: { select: { name: true } },
        customerCompanyId: true,
      },
    });
  }

  findDeviceById(id: string) {
    return this.client.customerDevice.findUnique({
      where: { id },
      include: {
        ...defaultDeviceInclude,
        serviceRequests: {
          orderBy: { updatedAt: "desc" },
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
        },
      },
    });
  }

  listManufacturers() {
    return this.client.manufacturer.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        deviceModels: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
      },
    });
  }

  listDeviceGroups() {
    return this.client.deviceGroup.findMany({
      where: { archivedAt: null, isActive: true },
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
      },
    });
  }

  async findDuplicateWarnings(input: {
    manufacturerId?: string | null;
    serialNumber?: string;
    assetTag?: string | null;
    hospitalInventoryNumber?: string | null;
    excludeId?: string;
  }) {
    const terms: Prisma.CustomerDeviceWhereInput[] = [];

    if (input.manufacturerId && input.serialNumber) {
      terms.push({
        manufacturerId: input.manufacturerId,
        serialNumber: { equals: input.serialNumber, mode: "insensitive" },
      });
    }

    if (input.assetTag) {
      terms.push({ assetTag: { equals: input.assetTag, mode: "insensitive" } });
    }

    if (input.hospitalInventoryNumber) {
      terms.push({
        hospitalInventoryNumber: {
          equals: input.hospitalInventoryNumber,
          mode: "insensitive",
        },
      });
    }

    if (!terms.length) return [];

    return this.client.customerDevice.findMany({
      where: {
        archivedAt: null,
        ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
        OR: terms,
      },
      include: defaultDeviceInclude,
      take: 6,
    });
  }

  async createDevice(input: CustomerDeviceInput) {
    await this.assertLocationBelongsToCompany(input);
    await this.assertModelBelongsToManufacturer(input);

    return this.client.customerDevice.create({
      data: {
        ...normalizeDeviceInput(input),
        publicCode: await this.nextPublicCode(),
      },
    });
  }

  async updateDevice(id: string, input: CustomerDeviceInput) {
    await this.assertLocationBelongsToCompany(input);
    await this.assertModelBelongsToManufacturer(input);

    return this.client.customerDevice.update({
      where: { id },
      data: normalizeDeviceInput(input),
    });
  }

  archiveDevice(id: string) {
    return this.client.customerDevice.update({
      where: { id },
      data: {
        isActive: false,
        status: "ARCHIVED",
        archivedAt: new Date(),
      },
    });
  }

  async linkServiceRequestToDevice(input: {
    serviceRequestId: string;
    customerDeviceId: string;
  }) {
    const device = await this.client.customerDevice.findUnique({
      where: { id: input.customerDeviceId },
      select: {
        id: true,
        customerCompanyId: true,
        customerLocationId: true,
      },
    });

    if (!device) throw new Error("Customer device not found.");

    return this.client.serviceRequest.update({
      where: { id: input.serviceRequestId },
      data: {
        customerDeviceId: device.id,
        customerCompanyId: device.customerCompanyId,
        customerLocationId: device.customerLocationId,
      },
    });
  }

  async createDeviceFromServiceRequest(serviceRequestId: string) {
    const request = await this.client.serviceRequest.findUnique({
      where: { id: serviceRequestId },
      select: {
        id: true,
        customerCompanyId: true,
        customerLocationId: true,
        deviceBrand: true,
        deviceModel: true,
        deviceSerialNumber: true,
      },
    });

    if (
      !request?.customerCompanyId ||
      !request.customerLocationId ||
      !request.deviceSerialNumber
    ) {
      return null;
    }

    const device = await this.client.customerDevice.create({
      data: {
        publicCode: await this.nextPublicCode(),
        customerCompanyId: request.customerCompanyId,
        customerLocationId: request.customerLocationId,
        customManufacturer: request.deviceBrand || null,
        customModel: request.deviceModel || null,
        serialNumber: request.deviceSerialNumber,
      },
    });

    await this.client.serviceRequest.update({
      where: { id: request.id },
      data: { customerDeviceId: device.id },
    });

    return device;
  }

  private async nextPublicCode() {
    const count = await this.client.customerDevice.count();
    return `ORT-DEV-${String(count + 1).padStart(6, "0")}`;
  }

  private async assertLocationBelongsToCompany(input: CustomerDeviceInput) {
    const location = await this.client.customerLocation.findFirst({
      where: {
        id: input.customerLocationId,
        customerCompanyId: input.customerCompanyId,
        archivedAt: null,
      },
      select: { id: true },
    });

    if (!location) {
      throw new Error("Selected customer location does not belong to company.");
    }
  }

  private async assertModelBelongsToManufacturer(input: CustomerDeviceInput) {
    if (!input.deviceModelId || !input.manufacturerId) return;

    const model = await this.client.deviceModel.findFirst({
      where: {
        id: input.deviceModelId,
        manufacturerId: input.manufacturerId,
      },
      select: { id: true },
    });

    if (!model) {
      throw new Error("Selected device model does not belong to manufacturer.");
    }
  }
}

const defaultDeviceInclude = {
  customerCompany: {
    select: {
      id: true,
      displayName: true,
      legalName: true,
      phone: true,
      email: true,
    },
  },
  customerLocation: {
    select: {
      id: true,
      name: true,
      city: true,
      district: true,
    },
  },
  deviceGroup: {
    select: {
      id: true,
      title: true,
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
} satisfies Prisma.CustomerDeviceInclude;

function buildDeviceWhere(
  input: CustomerDeviceListInput
): Prisma.CustomerDeviceWhereInput {
  return {
    ...(input.includeArchived ? {} : { archivedAt: null }),
    ...(input.customerCompanyId
      ? { customerCompanyId: input.customerCompanyId }
      : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.query
      ? {
          OR: [
            { publicCode: { contains: input.query, mode: "insensitive" } },
            { serialNumber: { contains: input.query, mode: "insensitive" } },
            { assetTag: { contains: input.query, mode: "insensitive" } },
            {
              hospitalInventoryNumber: {
                contains: input.query,
                mode: "insensitive",
              },
            },
            { customManufacturer: { contains: input.query, mode: "insensitive" } },
            { customModel: { contains: input.query, mode: "insensitive" } },
            {
              manufacturer: {
                name: { contains: input.query, mode: "insensitive" },
              },
            },
            {
              deviceModel: {
                name: { contains: input.query, mode: "insensitive" },
              },
            },
            {
              customerCompany: {
                displayName: { contains: input.query, mode: "insensitive" },
              },
            },
            {
              customerLocation: {
                name: { contains: input.query, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
  };
}

function normalizeDeviceInput(input: CustomerDeviceInput) {
  return {
    customerCompanyId: input.customerCompanyId,
    customerLocationId: input.customerLocationId,
    deviceGroupId: input.deviceGroupId || null,
    manufacturerId: input.manufacturerId || null,
    deviceModelId: input.deviceModelId || null,
    customManufacturer: input.customManufacturer || null,
    customModel: input.customModel || null,
    serialNumber: input.serialNumber,
    assetTag: input.assetTag || null,
    hospitalInventoryNumber: input.hospitalInventoryNumber || null,
    department: input.department || null,
    room: input.room || null,
    installationDate: input.installationDate || null,
    purchaseDate: input.purchaseDate || null,
    warrantyEndDate: input.warrantyEndDate || null,
    status: input.status,
    criticality: input.criticality,
    notes: input.notes || null,
    isActive: input.isActive ?? true,
  };
}
