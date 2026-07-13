"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AdminAuthRepository } from "@/lib/auth/admin-auth-repository";
import { requirePermission } from "@/lib/auth/admin-session";
import { getAdminRequestContext } from "@/lib/auth/request-context";
import { prisma } from "@/lib/database/prisma";
import { PrismaDeviceGroupRepository } from "@/lib/database/repositories/device-groups";
import { deviceCapabilityLabels } from "@/lib/devices/device-registry";
import { deviceGroupInputSchema } from "@/lib/devices/device-validation";

const idSchema = z.object({ id: z.string().min(1) });
const moveSchema = z.object({
  id: z.string().min(1),
  direction: z.enum(["up", "down", "first", "last"]),
});

export async function createDeviceGroup(formData: FormData) {
  const session = await requirePermission("devices.create");
  const parsed = parseDeviceForm(formData);

  if (!parsed.success) {
    throw new Error("Invalid device group input.");
  }

  const repository = new PrismaDeviceGroupRepository(prisma);
  const device = await repository.createDeviceGroup(parsed.data, session.userId);

  await appendDeviceAudit(session.userId, "CREATE", device.id, {
    deviceGroupId: device.id,
    slug: device.slug,
    active: device.isActive,
    featured: device.isFeatured,
    mediaId: device.imageId,
  });
  revalidateDevices();
  redirect(`/admin/devices/${device.id}`);
}

export async function updateDeviceGroup(formData: FormData) {
  const session = await requirePermission("devices.update");
  const id = String(formData.get("id") ?? "");
  const parsed = parseDeviceForm(formData);

  if (!id || !parsed.success) {
    throw new Error("Invalid device group input.");
  }

  const repository = new PrismaDeviceGroupRepository(prisma);
  const device = await repository.updateDeviceGroup(
    id,
    parsed.data,
    session.userId
  );

  await appendDeviceAudit(session.userId, "UPDATE", device.id, {
    deviceGroupId: device.id,
    slug: device.slug,
    active: device.isActive,
    featured: device.isFeatured,
    mediaId: device.imageId,
  });
  revalidateDevices();
  redirect(`/admin/devices/${device.id}`);
}

export async function moveDeviceGroup(formData: FormData) {
  const session = await requirePermission("devices.reorder");
  const parsed = moveSchema.safeParse({
    id: formData.get("id"),
    direction: formData.get("direction"),
  });

  if (!parsed.success) return;

  const repository = new PrismaDeviceGroupRepository(prisma);
  const order = await repository.moveDeviceGroup(
    parsed.data.id,
    parsed.data.direction
  );

  await appendDeviceAudit(session.userId, "UPDATE", parsed.data.id, {
    deviceGroupId: parsed.data.id,
    action: "reorder",
    direction: parsed.data.direction,
    order,
  });
  revalidateDevices();
}

export async function toggleDeviceActive(formData: FormData) {
  const session = await requirePermission("devices.publish");
  const parsed = idSchema.safeParse({ id: formData.get("id") });

  if (!parsed.success) return;

  const isActive = formData.get("isActive") === "true";
  const repository = new PrismaDeviceGroupRepository(prisma);
  const device = await repository.setActiveState(
    parsed.data.id,
    isActive,
    session.userId
  );

  await appendDeviceAudit(session.userId, "PUBLISH", device.id, {
    deviceGroupId: device.id,
    active: device.isActive,
  });
  revalidateDevices();
}

export async function toggleDeviceFeatured(formData: FormData) {
  const session = await requirePermission("devices.publish");
  const parsed = idSchema.safeParse({ id: formData.get("id") });

  if (!parsed.success) return;

  const isFeatured = formData.get("isFeatured") === "true";
  const repository = new PrismaDeviceGroupRepository(prisma);
  const device = await repository.setFeaturedState(
    parsed.data.id,
    isFeatured,
    session.userId
  );

  await appendDeviceAudit(session.userId, "STATUS_CHANGE", device.id, {
    deviceGroupId: device.id,
    featured: device.isFeatured,
  });
  revalidateDevices();
}

export async function archiveDeviceGroup(formData: FormData) {
  const session = await requirePermission("devices.delete");
  const parsed = idSchema.safeParse({ id: formData.get("id") });

  if (!parsed.success) return;

  const repository = new PrismaDeviceGroupRepository(prisma);
  const device = await repository.archiveDeviceGroup(parsed.data.id, session.userId);

  await appendDeviceAudit(session.userId, "ARCHIVE", device.id, {
    deviceGroupId: device.id,
    slug: device.slug,
  });
  revalidateDevices();
  redirect("/admin/devices");
}

export async function restoreDeviceGroup(formData: FormData) {
  const session = await requirePermission("devices.publish");
  const parsed = idSchema.safeParse({ id: formData.get("id") });

  if (!parsed.success) return;

  const repository = new PrismaDeviceGroupRepository(prisma);
  const device = await repository.restoreDeviceGroup(parsed.data.id, session.userId);

  await appendDeviceAudit(session.userId, "STATUS_CHANGE", device.id, {
    deviceGroupId: device.id,
    restored: true,
  });
  revalidateDevices();
}

export async function deleteArchivedDeviceGroup(formData: FormData) {
  const session = await requirePermission("devices.delete");
  const parsed = idSchema.safeParse({ id: formData.get("id") });

  if (!parsed.success) return;

  const repository = new PrismaDeviceGroupRepository(prisma);
  const device = await repository.deleteArchivedUnusedDeviceGroup(parsed.data.id);

  await appendDeviceAudit(session.userId, "DELETE", device.id, {
    deviceGroupId: device.id,
    slug: device.slug,
  });
  revalidateDevices();
  redirect("/admin/devices");
}

function parseDeviceForm(formData: FormData) {
  const capabilities = deviceCapabilityLabels.filter(
    (capability) => formData.get(`capability:${capability}`) === "true"
  );

  return deviceGroupInputSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    shortDescription: formData.get("shortDescription"),
    fullDescription: formData.get("fullDescription"),
    iconKey: formData.get("iconKey"),
    imageId: formData.get("imageId") ?? "",
    openGraphImageId: formData.get("openGraphImageId") ?? "",
    capabilities,
    isFeatured: formData.get("isFeatured") === "true",
    isActive: formData.get("isActive") === "true",
    order: formData.get("order"),
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),
  });
}

async function appendDeviceAudit(
  actorId: string,
  action: "CREATE" | "UPDATE" | "DELETE" | "PUBLISH" | "ARCHIVE" | "STATUS_CHANGE",
  entityId: string,
  metadata: Prisma.InputJsonValue
) {
  const repository = new AdminAuthRepository(prisma);
  await repository.appendAuditLog({
    actorId,
    action,
    entityType: "DeviceGroup",
    entityId,
    metadata,
    context: getAdminRequestContext(await headers()),
  });
}

function revalidateDevices() {
  revalidatePath("/");
  revalidatePath("/cihazlar");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/devices");
}
