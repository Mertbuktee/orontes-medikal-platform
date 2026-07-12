import type { PrismaClient } from "@prisma/client";

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
}
