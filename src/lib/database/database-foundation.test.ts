import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { deviceGroups } from "@/content/devices";
import { services } from "@/content/services";
import { getRequiredDatabaseUrl } from "@/lib/database/env";
import { createServiceRequestJsonImportPlan } from "@/lib/database/importers/service-request-json-importer";
import {
  getDeviceGroupSeedRecords,
  getHeroSeedRecords,
  getServiceSeedRecords,
} from "@/lib/database/seed-data";
import { toSafeUserDto, type UserRecord } from "@/lib/database/repositories/users";
import { roles } from "@/lib/rbac/permissions";

const schemaPath = join(process.cwd(), "prisma", "schema.prisma");

describe("database foundation contracts", () => {
  it("keeps Prisma Role enum aligned with RBAC roles", async () => {
    await expect(readPrismaEnum("Role")).resolves.toEqual([...roles]);
  });

  it("defines the complete service request status flow", async () => {
    await expect(readPrismaEnum("ServiceRequestStatus")).resolves.toEqual([
      "NEW",
      "REVIEWING",
      "WAITING_FOR_CUSTOMER",
      "APPROVED",
      "IN_REPAIR",
      "COMPLETED",
      "CANCELLED",
      "ARCHIVED",
    ]);
  });

  it("defines technical customer registry models without rewriting submitted snapshots", async () => {
    const schema = await readFile(schemaPath, "utf8");

    expect(schema).toContain("model CustomerCompany");
    expect(schema).toContain("model CustomerLocation");
    expect(schema).toContain("model CustomerContact");
    expect(schema).toContain("customerCompanyId  String?");
    expect(schema).toContain("customerLocationId String?");
    expect(schema).toContain("customerContactId  String?");
    expect(schema).toContain("fullName           String");
    expect(schema).toContain("company            String");
    expect(schema).toContain("phone              String");
    expect(schema).toContain("email              String");
  });

  it("defines customer device registry separately from public device groups", async () => {
    const schema = await readFile(schemaPath, "utf8");

    expect(schema).toContain("enum CustomerDeviceStatus");
    expect(schema).toContain("enum CustomerDeviceCriticality");
    expect(schema).toContain("model Manufacturer");
    expect(schema).toContain("model DeviceModel");
    expect(schema).toContain("model CustomerDevice");
    expect(schema).toContain("publicCode              String");
    expect(schema).toContain("customerDeviceId   String?");
    expect(schema).toContain('deviceGroup     DeviceGroup?');
  });

  it("prepares ordered active and featured device seed records", () => {
    const records = getDeviceGroupSeedRecords();
    const orders = records.map((record) => record.order);

    expect(records).toHaveLength(deviceGroups.length);
    expect(orders).toEqual([...orders].sort((first, second) => first - second));
    expect(records.some((record) => record.isActive && record.isFeatured)).toBe(
      true
    );
  });

  it("expects device and service slugs to stay unique for future routes", () => {
    expectUnique(deviceGroups.map((device) => device.slug));
    expectUnique(services.map((service) => service.slug));
  });

  it("transforms typed public content into idempotent seed records", () => {
    const deviceSeeds = getDeviceGroupSeedRecords();
    const serviceSeeds = getServiceSeedRecords();
    const heroSeeds = getHeroSeedRecords();

    expect(deviceSeeds[0]).toMatchObject({
      id: deviceGroups[0].id,
      slug: deviceGroups[0].slug,
    });
    expect(serviceSeeds[0]).toMatchObject({
      id: services[0].id,
      slug: services[0].slug,
    });
    expect(heroSeeds[0].media.storageKey).toMatch(/^public\/images\/services\//);
    expect(heroSeeds[0].slide.imageId).toBe(heroSeeds[0].media.id);
  });

  it("excludes passwordHash from repository user DTOs", () => {
    const user = {
      id: "user_1",
      name: "Admin",
      email: "admin@example.com",
      passwordHash: "never-return-this",
      role: "ADMIN",
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    } satisfies UserRecord;

    expect(toSafeUserDto(user)).not.toHaveProperty("passwordHash");
  });

  it("creates a dry-run JSON import plan without destructive behavior", async () => {
    const root = await mkdtemp(join(tmpdir(), "service-request-import-"));
    await writeFile(
      join(root, "record.json"),
      JSON.stringify({
        id: "request-1",
        createdAt: "2026-01-01T00:00:00.000Z",
        fullName: "Test User",
        company: "Test Hospital",
        phone: "0553 606 57 03",
        email: "test@example.com",
        deviceBrand: null,
        deviceModel: null,
        deviceSerialNumber: null,
        message: "Test message",
        attachment: {
          storageKey: "service-requests/file.jpg",
          mimeType: "image/jpeg",
          size: 1234,
        },
      })
    );

    const plan = await createServiceRequestJsonImportPlan({
      root,
      dryRun: true,
      existingIds: new Set(["request-1"]),
      existingStorageKeys: new Set(["service-requests/file.jpg"]),
    });

    expect(plan.dryRun).toBe(true);
    expect(plan.validRecords).toBe(1);
    expect(plan.duplicateIds).toEqual(["request-1"]);
    expect(plan.duplicateStorageKeys).toEqual(["service-requests/file.jpg"]);
  });

  it("rejects missing DATABASE_URL for database operations", () => {
    expect(() => getRequiredDatabaseUrl({})).toThrow("DATABASE_URL");
  });

  it("keeps public app files free of direct database access", async () => {
    const publicFiles = [
      "src/app/(public)/page.tsx",
      "src/app/(public)/cihazlar/page.tsx",
      "src/app/(public)/hizmetler/page.tsx",
      "src/app/(public)/servis-talebi/page.tsx",
    ];

    for (const filePath of publicFiles) {
      const source = await readFile(join(process.cwd(), filePath), "utf8");
      expect(source).not.toContain("@/lib/database");
      expect(source).not.toContain("prisma");
    }
  });

  it("keeps the Prisma client module server guarded and singleton based", async () => {
    const source = await readFile(
      join(process.cwd(), "src/lib/database/prisma.ts"),
      "utf8"
    );

    expect(source).toContain("typeof window");
    expect(source).toContain("globalForPrisma.prisma");
  });
});

async function readPrismaEnum(name: string) {
  const source = await readFile(schemaPath, "utf8");
  const match = source.match(new RegExp(`enum ${name} \\{([\\s\\S]*?)\\}`));

  if (!match) {
    throw new Error(`Prisma enum not found: ${name}`);
  }

  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("//"));
}

function expectUnique(values: string[]) {
  expect(new Set(values).size).toBe(values.length);
}
