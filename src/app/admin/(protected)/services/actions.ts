"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AdminAuthRepository } from "@/lib/auth/admin-auth-repository";
import { requirePermission } from "@/lib/auth/admin-session";
import { getAdminRequestContext } from "@/lib/auth/request-context";
import { prisma } from "@/lib/database/prisma";
import { PrismaServiceRepository } from "@/lib/database/repositories/services";
import { SERVICES_CACHE_TAG } from "@/lib/services/public-services";
import { serviceInputSchema } from "@/lib/services/service-validation";

const idSchema = z.object({ id: z.string().min(1) });
const moveSchema = z.object({
  id: z.string().min(1),
  direction: z.enum(["up", "down", "first", "last"]),
});

export async function createService(formData: FormData) {
  const session = await requirePermission("services.create");
  const parsed = parseServiceForm(formData);

  if (!parsed.success) {
    throw new Error("Invalid service input.");
  }

  const repository = new PrismaServiceRepository(prisma);
  const service = await repository.createService(parsed.data, session.userId);

  await appendServiceAudit(session.userId, "CREATE", service.id, {
    serviceId: service.id,
    slug: service.slug,
    active: service.isActive,
    featured: service.isFeatured,
    mediaId: service.imageId,
  });
  revalidateServices();
  redirect(`/admin/services/${service.id}`);
}

export async function updateService(formData: FormData) {
  const session = await requirePermission("services.update");
  const id = String(formData.get("id") ?? "");
  const parsed = parseServiceForm(formData);

  if (!id || !parsed.success) {
    throw new Error("Invalid service input.");
  }

  const repository = new PrismaServiceRepository(prisma);
  const service = await repository.updateService(id, parsed.data, session.userId);

  await appendServiceAudit(session.userId, "UPDATE", service.id, {
    serviceId: service.id,
    slug: service.slug,
    active: service.isActive,
    featured: service.isFeatured,
    mediaId: service.imageId,
  });
  revalidateServices();
  redirect(`/admin/services/${service.id}`);
}

export async function moveService(formData: FormData) {
  const session = await requirePermission("services.reorder");
  const parsed = moveSchema.safeParse({
    id: formData.get("id"),
    direction: formData.get("direction"),
  });

  if (!parsed.success) return;

  const repository = new PrismaServiceRepository(prisma);
  const order = await repository.moveService(
    parsed.data.id,
    parsed.data.direction
  );

  await appendServiceAudit(session.userId, "UPDATE", parsed.data.id, {
    serviceId: parsed.data.id,
    action: "reorder",
    direction: parsed.data.direction,
    order,
  });
  revalidateServices();
}

export async function toggleServiceActive(formData: FormData) {
  const session = await requirePermission("services.publish");
  const parsed = idSchema.safeParse({ id: formData.get("id") });

  if (!parsed.success) return;

  const isActive = formData.get("isActive") === "true";
  const repository = new PrismaServiceRepository(prisma);
  const service = await repository.setActiveState(
    parsed.data.id,
    isActive,
    session.userId
  );

  await appendServiceAudit(session.userId, "PUBLISH", service.id, {
    serviceId: service.id,
    active: service.isActive,
  });
  revalidateServices();
}

export async function toggleServiceFeatured(formData: FormData) {
  const session = await requirePermission("services.publish");
  const parsed = idSchema.safeParse({ id: formData.get("id") });

  if (!parsed.success) return;

  const isFeatured = formData.get("isFeatured") === "true";
  const repository = new PrismaServiceRepository(prisma);
  const service = await repository.setFeaturedState(
    parsed.data.id,
    isFeatured,
    session.userId
  );

  await appendServiceAudit(session.userId, "STATUS_CHANGE", service.id, {
    serviceId: service.id,
    featured: service.isFeatured,
  });
  revalidateServices();
}

export async function archiveService(formData: FormData) {
  const session = await requirePermission("services.delete");
  const parsed = idSchema.safeParse({ id: formData.get("id") });

  if (!parsed.success) return;

  const repository = new PrismaServiceRepository(prisma);
  const service = await repository.archiveService(parsed.data.id, session.userId);

  await appendServiceAudit(session.userId, "ARCHIVE", service.id, {
    serviceId: service.id,
    slug: service.slug,
  });
  revalidateServices();
  redirect("/admin/services");
}

export async function restoreService(formData: FormData) {
  const session = await requirePermission("services.publish");
  const parsed = idSchema.safeParse({ id: formData.get("id") });

  if (!parsed.success) return;

  const repository = new PrismaServiceRepository(prisma);
  const service = await repository.restoreService(parsed.data.id, session.userId);

  await appendServiceAudit(session.userId, "STATUS_CHANGE", service.id, {
    serviceId: service.id,
    restored: true,
  });
  revalidateServices();
}

export async function deleteArchivedService(formData: FormData) {
  const session = await requirePermission("services.delete");
  const parsed = idSchema.safeParse({ id: formData.get("id") });

  if (!parsed.success) return;

  const repository = new PrismaServiceRepository(prisma);
  const service = await repository.deleteArchivedUnusedService(parsed.data.id);

  await appendServiceAudit(session.userId, "DELETE", service.id, {
    serviceId: service.id,
    slug: service.slug,
  });
  revalidateServices();
  redirect("/admin/services");
}

function parseServiceForm(formData: FormData) {
  return serviceInputSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    shortDescription: formData.get("shortDescription"),
    fullDescription: formData.get("fullDescription"),
    iconKey: formData.get("iconKey"),
    imageId: formData.get("imageId") ?? "",
    openGraphImageId: formData.get("openGraphImageId") ?? "",
    isFeatured: formData.get("isFeatured") === "true",
    isActive: formData.get("isActive") === "true",
    order: formData.get("order"),
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),
    ctaLabel: formData.get("ctaLabel") ?? "",
    ctaHref: formData.get("ctaHref") ?? "",
  });
}

async function appendServiceAudit(
  actorId: string,
  action: "CREATE" | "UPDATE" | "DELETE" | "PUBLISH" | "ARCHIVE" | "STATUS_CHANGE",
  entityId: string,
  metadata: Prisma.InputJsonValue
) {
  const repository = new AdminAuthRepository(prisma);
  await repository.appendAuditLog({
    actorId,
    action,
    entityType: "Service",
    entityId,
    metadata,
    context: getAdminRequestContext(await headers()),
  });
}

function revalidateServices() {
  revalidateTag(SERVICES_CACHE_TAG, "max");
  revalidatePath("/");
  revalidatePath("/hizmetler");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/services");
}
