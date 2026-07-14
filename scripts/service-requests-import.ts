import "./load-local-env.ts";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import path from "node:path";

import { getRequiredDatabaseUrl } from "../src/lib/database/env.ts";
import {
  createServiceRequestJsonImportPlan,
  type LocalServiceRequestJsonRecord,
} from "../src/lib/database/importers/service-request-json-importer.ts";
import { LocalPrivateStorageAdapter } from "../src/lib/security/storage.ts";

type ImportReport = {
  dryRun: boolean;
  scanned: number;
  valid: number;
  duplicates: number;
  imported: number;
  skipped: number;
  errors: number;
  missingAttachments: number;
};

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: getRequiredDatabaseUrl(),
  }),
});

async function main() {
  const apply = process.argv.includes("--apply");
  const root =
    getArgumentValue("--root") ??
    path.join(process.cwd(), "storage", "private", "service-requests", "requests");
  const storage = new LocalPrivateStorageAdapter();

  const [existingRequests, existingAttachments] = await Promise.all([
    prisma.serviceRequest.findMany({ select: { id: true } }),
    prisma.attachment.findMany({ select: { storageKey: true } }),
  ]);

  const plan = await createServiceRequestJsonImportPlan({
    root,
    dryRun: !apply,
    existingIds: new Set(existingRequests.map((request) => request.id)),
    existingStorageKeys: new Set(
      existingAttachments.map((attachment) => attachment.storageKey)
    ),
  });

  let imported = 0;
  let skipped = plan.invalidFiles.length;
  let missingAttachments = 0;
  let errors = 0;

  const duplicateIds = new Set(plan.duplicateIds);
  const duplicateStorageKeys = new Set(plan.duplicateStorageKeys);

  for (const record of plan.records) {
    if (
      duplicateIds.has(record.id) ||
      (record.attachment &&
        duplicateStorageKeys.has(record.attachment.storageKey))
    ) {
      skipped += 1;
      continue;
    }

    if (record.attachment) {
      const exists = await attachmentExists(storage, record.attachment.storageKey);

      if (!exists) {
        missingAttachments += 1;
        skipped += 1;
        continue;
      }
    }

    if (!apply) {
      continue;
    }

    try {
      await importRecord(record);
      imported += 1;
    } catch {
      errors += 1;
      skipped += 1;
    }
  }

  const report: ImportReport = {
    dryRun: !apply,
    scanned: plan.totalFiles,
    valid: plan.validRecords,
    duplicates: plan.duplicateIds.length + plan.duplicateStorageKeys.length,
    imported,
    skipped,
    errors,
    missingAttachments,
  };

  console.log(JSON.stringify(report, null, 2));
}

async function attachmentExists(
  storage: LocalPrivateStorageAdapter,
  storageKey: string
) {
  try {
    await storage.read(storageKey);
    return true;
  } catch {
    return false;
  }
}

async function importRecord(record: LocalServiceRequestJsonRecord) {
  const createdAt = new Date(record.createdAt);

  if (Number.isNaN(createdAt.getTime())) {
    throw new Error("Invalid createdAt");
  }

  await prisma.serviceRequest.create({
    data: {
      id: record.id,
      fullName: record.fullName,
      company: record.company,
      phone: record.phone,
      email: record.email,
      deviceBrand: record.deviceBrand,
      deviceModel: record.deviceModel,
      deviceSerialNumber: record.deviceSerialNumber,
      message: record.message,
      status: "NEW",
      createdAt,
      attachments: record.attachment
        ? {
            create: {
              storageKey: record.attachment.storageKey,
              mimeType: record.attachment.mimeType,
              size: record.attachment.size,
              originalName: null,
              createdAt,
            },
          }
        : undefined,
    },
  });
}

function getArgumentValue(name: string) {
  const prefix = `${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error("service_requests_import.failed");
    await prisma.$disconnect();
    throw error;
  });
