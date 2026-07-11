import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ServiceRequestInput } from "@/lib/validation/service-request";
import type { StoredFileRecord } from "@/lib/security/storage";

export type ServiceRequestRecord = {
  id: string;
  attachment?: StoredFileRecord;
};

export interface ServiceRequestRepository {
  save(input: ServiceRequestInput, attachment?: StoredFileRecord): Promise<ServiceRequestRecord>;
}

export class LocalServiceRequestRepository implements ServiceRequestRepository {
  constructor(
    private readonly root = path.join(
      process.cwd(),
      "storage",
      "private",
      "service-requests",
      "requests"
    )
  ) {}

  async save(input: ServiceRequestInput, attachment?: StoredFileRecord) {
    const id = randomUUID();
    const resolvedRoot = path.resolve(this.root);
    await mkdir(resolvedRoot, { recursive: true });

    const record = {
      id,
      createdAt: new Date().toISOString(),
      fullName: input.fullName,
      company: input.company,
      phone: input.phone,
      email: input.email,
      deviceBrand: input.deviceBrand ?? null,
      deviceModel: input.deviceModel ?? null,
      deviceSerialNumber: input.deviceSerialNumber ?? null,
      message: input.message,
      attachment: attachment
        ? {
            storageKey: attachment.storageKey,
            mimeType: attachment.mimeType,
            size: attachment.size,
          }
        : null,
    };

    await writeFile(path.join(resolvedRoot, `${id}.json`), JSON.stringify(record, null, 2), {
      flag: "wx",
    });

    return {
      id,
      attachment,
    };
  }
}
