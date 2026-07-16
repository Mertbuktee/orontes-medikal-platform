import type { Prisma, PrismaClient } from "@prisma/client";

export type CustomerCompanyInput = {
  legalName: string;
  displayName: string;
  phone: string;
  email: string;
  taxNumber?: string | null;
  taxOffice?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

export type CustomerLocationInput = {
  customerCompanyId: string;
  name: string;
  city: string;
  district: string;
  addressLine: string;
  department?: string | null;
  building?: string | null;
  floor?: string | null;
  phone?: string | null;
  isPrimary?: boolean;
  isActive?: boolean;
};

export type CustomerContactInput = {
  customerCompanyId: string;
  customerLocationId?: string | null;
  fullName: string;
  title?: string | null;
  department?: string | null;
  phone: string;
  email?: string | null;
  isPrimary?: boolean;
  isActive?: boolean;
};

export type LinkServiceRequestCustomerInput = {
  serviceRequestId: string;
  customerCompanyId: string;
  customerLocationId?: string | null;
  customerContactId?: string | null;
};

export class PrismaCustomerRegistryRepository {
  constructor(private readonly client: PrismaClient) {}

  listCompanies(input: { query?: string; includeArchived?: boolean } = {}) {
    return this.client.customerCompany.findMany({
      where: {
        ...(input.includeArchived ? {} : { archivedAt: null }),
        ...(input.query
          ? {
              OR: [
                { legalName: { contains: input.query, mode: "insensitive" } },
                { displayName: { contains: input.query, mode: "insensitive" } },
                { phone: { contains: input.query, mode: "insensitive" } },
                { email: { contains: input.query, mode: "insensitive" } },
                { taxNumber: { contains: input.query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ archivedAt: "asc" }, { updatedAt: "desc" }],
      include: {
        _count: {
          select: {
            contacts: true,
            locations: true,
            serviceRequests: true,
          },
        },
      },
    });
  }

  listCompanyOptions() {
    return this.client.customerCompany.findMany({
      where: { archivedAt: null, isActive: true },
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        displayName: true,
        legalName: true,
        phone: true,
        email: true,
      },
    });
  }

  findCompanyById(id: string) {
    return this.client.customerCompany.findUnique({
      where: { id },
      include: {
        locations: {
          where: { archivedAt: null },
          orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
        },
        contacts: {
          where: { archivedAt: null },
          orderBy: [{ isPrimary: "desc" }, { fullName: "asc" }],
          include: {
            customerLocation: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        serviceRequests: {
          orderBy: { updatedAt: "desc" },
          take: 12,
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
        _count: {
          select: {
            contacts: true,
            locations: true,
            serviceRequests: true,
          },
        },
      },
    });
  }

  findDuplicateSuggestions(input: {
    legalName?: string;
    displayName?: string;
    taxNumber?: string | null;
    phone?: string;
    email?: string;
    excludeId?: string;
  }) {
    const terms: Prisma.CustomerCompanyWhereInput[] = [];

    if (input.legalName) {
      terms.push({ legalName: { equals: input.legalName, mode: "insensitive" } });
    }

    if (input.displayName) {
      terms.push({
        displayName: { equals: input.displayName, mode: "insensitive" },
      });
    }

    if (input.taxNumber) {
      terms.push({ taxNumber: { equals: input.taxNumber, mode: "insensitive" } });
    }

    if (input.phone) {
      terms.push({ phone: { equals: input.phone, mode: "insensitive" } });
    }

    if (input.email) {
      terms.push({ email: { equals: input.email, mode: "insensitive" } });
    }

    if (!terms.length) return Promise.resolve([]);

    return this.client.customerCompany.findMany({
      where: {
        archivedAt: null,
        ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
        OR: terms,
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        legalName: true,
        displayName: true,
        phone: true,
        email: true,
        taxNumber: true,
      },
    });
  }

  createCompany(input: CustomerCompanyInput) {
    return this.client.customerCompany.create({
      data: normalizeCompanyInput(input),
    });
  }

  updateCompany(id: string, input: CustomerCompanyInput) {
    return this.client.customerCompany.update({
      where: { id },
      data: normalizeCompanyInput(input),
    });
  }

  archiveCompany(id: string) {
    return this.client.customerCompany.update({
      where: { id },
      data: {
        isActive: false,
        archivedAt: new Date(),
      },
    });
  }

  createLocation(input: CustomerLocationInput) {
    return this.client.customerLocation.create({
      data: normalizeLocationInput(input),
    });
  }

  archiveLocation(id: string) {
    return this.client.customerLocation.update({
      where: { id },
      data: {
        isActive: false,
        archivedAt: new Date(),
      },
    });
  }

  createContact(input: CustomerContactInput) {
    return this.client.customerContact.create({
      data: normalizeContactInput(input),
    });
  }

  archiveContact(id: string) {
    return this.client.customerContact.update({
      where: { id },
      data: {
        isActive: false,
        archivedAt: new Date(),
      },
    });
  }

  async linkServiceRequestToCustomer(input: LinkServiceRequestCustomerInput) {
    await this.assertLinkBelongsToCompany(input);

    return this.client.serviceRequest.update({
      where: { id: input.serviceRequestId },
      data: {
        customerCompanyId: input.customerCompanyId,
        customerLocationId: input.customerLocationId || null,
        customerContactId: input.customerContactId || null,
      },
    });
  }

  async createCompanyFromServiceRequest(serviceRequestId: string) {
    const request = await this.client.serviceRequest.findUnique({
      where: { id: serviceRequestId },
      select: {
        id: true,
        fullName: true,
        company: true,
        phone: true,
        email: true,
      },
    });

    if (!request) return null;

    return this.client.customerCompany.create({
      data: {
        legalName: request.company,
        displayName: request.company,
        phone: request.phone,
        email: request.email,
        contacts: {
          create: {
            fullName: request.fullName,
            phone: request.phone,
            email: request.email,
            isPrimary: true,
          },
        },
        serviceRequests: {
          connect: {
            id: request.id,
          },
        },
      },
    });
  }

  private async assertLinkBelongsToCompany(
    input: LinkServiceRequestCustomerInput
  ) {
    if (input.customerLocationId) {
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

    if (input.customerContactId) {
      const contact = await this.client.customerContact.findFirst({
        where: {
          id: input.customerContactId,
          customerCompanyId: input.customerCompanyId,
          archivedAt: null,
        },
        select: { id: true },
      });

      if (!contact) {
        throw new Error("Selected customer contact does not belong to company.");
      }
    }
  }
}

function normalizeCompanyInput(input: CustomerCompanyInput) {
  return {
    legalName: input.legalName,
    displayName: input.displayName,
    phone: input.phone,
    email: input.email,
    taxNumber: input.taxNumber || null,
    taxOffice: input.taxOffice || null,
    notes: input.notes || null,
    isActive: input.isActive ?? true,
  };
}

function normalizeLocationInput(input: CustomerLocationInput) {
  return {
    customerCompanyId: input.customerCompanyId,
    name: input.name,
    city: input.city,
    district: input.district,
    addressLine: input.addressLine,
    department: input.department || null,
    building: input.building || null,
    floor: input.floor || null,
    phone: input.phone || null,
    isPrimary: input.isPrimary ?? false,
    isActive: input.isActive ?? true,
  };
}

function normalizeContactInput(input: CustomerContactInput) {
  return {
    customerCompanyId: input.customerCompanyId,
    customerLocationId: input.customerLocationId || null,
    fullName: input.fullName,
    title: input.title || null,
    department: input.department || null,
    phone: input.phone,
    email: input.email || null,
    isPrimary: input.isPrimary ?? false,
    isActive: input.isActive ?? true,
  };
}
