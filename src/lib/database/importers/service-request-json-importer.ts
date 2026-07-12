import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export type LocalServiceRequestAttachment = {
  storageKey: string;
  mimeType: string;
  size: number;
};

export type LocalServiceRequestJsonRecord = {
  id: string;
  createdAt: string;
  fullName: string;
  company: string;
  phone: string;
  email: string;
  deviceBrand: string | null;
  deviceModel: string | null;
  deviceSerialNumber: string | null;
  message: string;
  attachment: LocalServiceRequestAttachment | null;
};

export type ServiceRequestJsonImportOptions = {
  root: string;
  dryRun: boolean;
  existingIds?: ReadonlySet<string>;
  existingStorageKeys?: ReadonlySet<string>;
};

export type ServiceRequestJsonImportReport = {
  dryRun: boolean;
  totalFiles: number;
  validRecords: number;
  duplicateIds: string[];
  duplicateStorageKeys: string[];
  invalidFiles: Array<{ fileName: string; reason: string }>;
  records: LocalServiceRequestJsonRecord[];
};

export async function createServiceRequestJsonImportPlan({
  root,
  dryRun,
  existingIds = new Set<string>(),
  existingStorageKeys = new Set<string>(),
}: ServiceRequestJsonImportOptions): Promise<ServiceRequestJsonImportReport> {
  const fileNames = (await readdir(root)).filter((fileName) =>
    fileName.endsWith(".json")
  );
  const records: LocalServiceRequestJsonRecord[] = [];
  const invalidFiles: ServiceRequestJsonImportReport["invalidFiles"] = [];
  const duplicateIds = new Set<string>();
  const duplicateStorageKeys = new Set<string>();
  const seenIds = new Set<string>();
  const seenStorageKeys = new Set<string>();

  for (const fileName of fileNames) {
    try {
      const raw = JSON.parse(
        await readFile(path.join(root, fileName), "utf8")
      ) as unknown;
      const record = parseLocalServiceRequestRecord(raw);

      if (!record) {
        invalidFiles.push({ fileName, reason: "Invalid service request JSON" });
        continue;
      }

      if (seenIds.has(record.id) || existingIds.has(record.id)) {
        duplicateIds.add(record.id);
      }

      seenIds.add(record.id);

      if (record.attachment) {
        const storageKey = record.attachment.storageKey;

        if (
          seenStorageKeys.has(storageKey) ||
          existingStorageKeys.has(storageKey)
        ) {
          duplicateStorageKeys.add(storageKey);
        }

        seenStorageKeys.add(storageKey);
      }

      records.push(record);
    } catch {
      invalidFiles.push({ fileName, reason: "Unreadable or malformed JSON" });
    }
  }

  return {
    dryRun,
    totalFiles: fileNames.length,
    validRecords: records.length,
    duplicateIds: [...duplicateIds],
    duplicateStorageKeys: [...duplicateStorageKeys],
    invalidFiles,
    records,
  };
}

function parseLocalServiceRequestRecord(
  value: unknown
): LocalServiceRequestJsonRecord | null {
  if (!isRecord(value)) return null;

  const attachment = value.attachment;
  const parsedAttachment =
    attachment === null ? null : parseAttachment(attachment);

  if (attachment !== null && !parsedAttachment) return null;

  if (
    !isString(value.id) ||
    !isString(value.createdAt) ||
    !isString(value.fullName) ||
    !isString(value.company) ||
    !isString(value.phone) ||
    !isString(value.email) ||
    !isNullableString(value.deviceBrand) ||
    !isNullableString(value.deviceModel) ||
    !isNullableString(value.deviceSerialNumber) ||
    !isString(value.message)
  ) {
    return null;
  }

  return {
    id: value.id,
    createdAt: value.createdAt,
    fullName: value.fullName,
    company: value.company,
    phone: value.phone,
    email: value.email,
    deviceBrand: value.deviceBrand,
    deviceModel: value.deviceModel,
    deviceSerialNumber: value.deviceSerialNumber,
    message: value.message,
    attachment: parsedAttachment,
  };
}

function parseAttachment(value: unknown): LocalServiceRequestAttachment | null {
  if (!isRecord(value)) return null;

  if (
    !isString(value.storageKey) ||
    !isString(value.mimeType) ||
    typeof value.size !== "number"
  ) {
    return null;
  }

  return {
    storageKey: value.storageKey,
    mimeType: value.mimeType,
    size: value.size,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}
