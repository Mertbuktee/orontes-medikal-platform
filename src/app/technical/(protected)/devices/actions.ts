"use server";

import type {
  AuditAction,
  CustomerDeviceCriticality,
  CustomerDeviceStatus,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AdminAuthRepository } from "@/lib/auth/admin-auth-repository";
import { requirePermission } from "@/lib/auth/admin-session";
import { getAdminRequestContext } from "@/lib/auth/request-context";
import { prisma } from "@/lib/database/prisma";
import { PrismaCustomerDeviceRepository } from "@/lib/database/repositories/customer-devices";
import { assertSameOriginAction } from "@/lib/security/action-origin";

const deviceStatuses = [
  "ACTIVE",
  "UNDER_SERVICE",
  "OUT_OF_SERVICE",
  "RETIRED",
  "ARCHIVED",
] as const;

const deviceCriticalities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

const deviceSchema = z.object({
  customerCompanyId: z.string().min(1),
  customerLocationId: z.string().min(1),
  deviceGroupId: z.string().trim().optional(),
  manufacturerId: z.string().trim().optional(),
  deviceModelId: z.string().trim().optional(),
  customManufacturer: z.string().trim().max(160).optional(),
  customModel: z.string().trim().max(160).optional(),
  serialNumber: z.string().trim().min(1).max(160),
  assetTag: z.string().trim().max(120).optional(),
  hospitalInventoryNumber: z.string().trim().max(120).optional(),
  department: z.string().trim().max(120).optional(),
  room: z.string().trim().max(120).optional(),
  installationDate: z.date().optional(),
  purchaseDate: z.date().optional(),
  warrantyEndDate: z.date().optional(),
  status: z.enum(deviceStatuses),
  criticality: z.enum(deviceCriticalities),
  notes: z.string().trim().max(4000).optional(),
  isActive: z.boolean(),
});

export async function createCustomerDevice(formData: FormData) {
  const session = await requirePermission("technicalDevices.create");
  await assertSameOriginAction();
  const parsed = deviceSchema.safeParse(parseDeviceForm(formData));

  if (!parsed.success) {
    redirect("/technical/devices/new?status=invalid");
  }

  const repository = new PrismaCustomerDeviceRepository(prisma);
  const device = await repository.createDevice(parsed.data);

  await appendDeviceAudit(session.userId, "CREATE", device.id, {
    customerDeviceId: device.id,
    publicCode: device.publicCode,
    customerCompanyId: device.customerCompanyId,
  });
  revalidateDevices(device.id);
  redirect(`/technical/devices/${device.id}`);
}

export async function updateCustomerDevice(formData: FormData) {
  const session = await requirePermission("technicalDevices.update");
  await assertSameOriginAction();
  const id = String(formData.get("id") ?? "");
  const parsed = deviceSchema.safeParse(parseDeviceForm(formData));

  if (!id || !parsed.success) {
    redirect(id ? `/technical/devices/${id}/edit?status=invalid` : "/technical/devices");
  }

  const repository = new PrismaCustomerDeviceRepository(prisma);
  const device = await repository.updateDevice(id, parsed.data);

  await appendDeviceAudit(session.userId, "UPDATE", device.id, {
    customerDeviceId: device.id,
    publicCode: device.publicCode,
  });
  revalidateDevices(device.id);
  redirect(`/technical/devices/${device.id}`);
}

export async function archiveCustomerDevice(formData: FormData) {
  const session = await requirePermission("technicalDevices.archive");
  await assertSameOriginAction();
  const parsed = z.object({ id: z.string().min(1) }).safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) return;

  const repository = new PrismaCustomerDeviceRepository(prisma);
  const device = await repository.archiveDevice(parsed.data.id);

  await appendDeviceAudit(session.userId, "ARCHIVE", device.id, {
    customerDeviceId: device.id,
    publicCode: device.publicCode,
  });
  revalidateDevices(device.id);
  redirect("/technical/devices");
}

export async function linkServiceRequestToDevice(formData: FormData) {
  const session = await requirePermission("serviceRequests.update");
  await assertSameOriginAction();
  const parsed = z
    .object({
      serviceRequestId: z.string().min(1),
      customerDeviceId: z.string().min(1),
    })
    .safeParse({
      serviceRequestId: formData.get("serviceRequestId"),
      customerDeviceId: formData.get("customerDeviceId"),
    });

  if (!parsed.success) return;

  const repository = new PrismaCustomerDeviceRepository(prisma);
  await repository.linkServiceRequestToDevice(parsed.data);

  await appendDeviceAudit(session.userId, "UPDATE", parsed.data.customerDeviceId, {
    customerDeviceId: parsed.data.customerDeviceId,
    serviceRequestId: parsed.data.serviceRequestId,
    action: "link-service-request",
  });
  revalidateServiceRequest(parsed.data.serviceRequestId);
}

export async function createDeviceFromServiceRequest(formData: FormData) {
  const session = await requirePermission("technicalDevices.create");
  await assertSameOriginAction();
  const parsed = z
    .object({ serviceRequestId: z.string().min(1) })
    .safeParse({ serviceRequestId: formData.get("serviceRequestId") });

  if (!parsed.success) return;

  const repository = new PrismaCustomerDeviceRepository(prisma);
  const device = await repository.createDeviceFromServiceRequest(
    parsed.data.serviceRequestId
  );

  if (!device) return;

  await appendDeviceAudit(session.userId, "CREATE", device.id, {
    customerDeviceId: device.id,
    serviceRequestId: parsed.data.serviceRequestId,
    source: "service-request",
  });
  revalidateDevices(device.id);
  revalidateServiceRequest(parsed.data.serviceRequestId);
}

function parseDeviceForm(formData: FormData) {
  return {
    customerCompanyId: formData.get("customerCompanyId"),
    customerLocationId: formData.get("customerLocationId"),
    deviceGroupId: formData.get("deviceGroupId") || undefined,
    manufacturerId: formData.get("manufacturerId") || undefined,
    deviceModelId: formData.get("deviceModelId") || undefined,
    customManufacturer: formData.get("customManufacturer") || undefined,
    customModel: formData.get("customModel") || undefined,
    serialNumber: formData.get("serialNumber"),
    assetTag: formData.get("assetTag") || undefined,
    hospitalInventoryNumber:
      formData.get("hospitalInventoryNumber") || undefined,
    department: formData.get("department") || undefined,
    room: formData.get("room") || undefined,
    installationDate: parseDate(formData.get("installationDate")),
    purchaseDate: parseDate(formData.get("purchaseDate")),
    warrantyEndDate: parseDate(formData.get("warrantyEndDate")),
    status: (formData.get("status") || "ACTIVE") as CustomerDeviceStatus,
    criticality: (formData.get("criticality") ||
      "MEDIUM") as CustomerDeviceCriticality,
    notes: formData.get("notes") || undefined,
    isActive: formData.has("isActive"),
  };
}

function parseDate(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }

  return new Date(`${value}T00:00:00.000Z`);
}

async function appendDeviceAudit(
  actorId: string,
  action: AuditAction,
  entityId: string,
  metadata: Prisma.InputJsonValue
) {
  await new AdminAuthRepository(prisma).appendAuditLog({
    actorId,
    action,
    entityType: "CustomerDevice",
    entityId,
    metadata,
    context: getAdminRequestContext(await headers()),
  });
}

function revalidateDevices(id?: string) {
  revalidatePath("/technical/devices");
  if (id) {
    revalidatePath(`/technical/devices/${id}`);
    revalidatePath(`/technical/devices/${id}/edit`);
  }
}

function revalidateServiceRequest(id: string) {
  revalidatePath("/technical/service-requests");
  revalidatePath(`/technical/service-requests/${id}`);
  revalidatePath("/admin/service-requests");
  revalidatePath(`/admin/service-requests/${id}`);
}
