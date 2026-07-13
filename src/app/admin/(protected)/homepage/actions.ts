"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminAuthRepository } from "@/lib/auth/admin-auth-repository";
import { requirePermission } from "@/lib/auth/admin-session";
import { getAdminRequestContext } from "@/lib/auth/request-context";
import { prisma } from "@/lib/database/prisma";
import { HomepageContentRepository } from "@/lib/database/repositories/homepage-content";
import {
  homepageReorderSchema,
  homepageSectionBaseInputSchema,
  homepageSeoSchema,
  homepageVisibilitySchema,
  parseHomepageSectionContent,
} from "@/lib/homepage/homepage-validation";
import {
  HOMEPAGE_CONTENT_CACHE_TAG,
  HOMEPAGE_SEO_CACHE_TAG,
} from "@/lib/homepage/public-homepage";

export async function updateHomepageSection(formData: FormData) {
  const session = await requirePermission("homepage.update");
  const base = homepageSectionBaseInputSchema.parse({
    key: formData.get("key"),
    title: formData.get("title"),
    eyebrow: formData.get("eyebrow"),
    description: formData.get("description"),
    order: formData.get("order"),
    isVisible: formData.get("isVisible") === "true",
  });
  const contentText = String(formData.get("content") ?? "{}");
  const content = parseHomepageSectionContent(
    base.key,
    JSON.parse(contentText) as unknown
  );

  const repository = new HomepageContentRepository(prisma);
  const section = await repository.updateSection(
    {
      ...base,
      content,
      eyebrow: base.eyebrow,
    },
    session.userId
  );

  await appendHomepageAudit(session.userId, "UPDATE", section.id, {
    sectionKey: section.key,
    changedFields: ["title", "description", "content", "visibility", "order"],
  });
  revalidateHomepage();
  redirect("/admin/homepage/sections");
}

export async function moveHomepageSection(formData: FormData) {
  const session = await requirePermission("homepage.reorder");
  const parsed = homepageReorderSchema.parse({
    key: formData.get("key"),
    direction: formData.get("direction"),
  });

  const repository = new HomepageContentRepository(prisma);
  const order = await repository.moveSection(parsed.key, parsed.direction);

  await appendHomepageAudit(session.userId, "UPDATE", parsed.key, {
    sectionKey: parsed.key,
    action: "reorder",
    direction: parsed.direction,
    order,
  });
  revalidateHomepage();
}

export async function toggleHomepageSectionVisibility(formData: FormData) {
  const session = await requirePermission("homepage.publish");
  const parsed = homepageVisibilitySchema.parse({
    key: formData.get("key"),
    isVisible: formData.get("isVisible") === "true",
  });

  const repository = new HomepageContentRepository(prisma);
  const section = await repository.setVisibility(
    parsed.key,
    parsed.isVisible,
    session.userId
  );

  await appendHomepageAudit(session.userId, "STATUS_CHANGE", section.id, {
    sectionKey: section.key,
    visible: section.isVisible,
  });
  revalidateHomepage();
}

export async function updateHomepageSeo(formData: FormData) {
  const session = await requirePermission("homepage.seo.manage");
  const parsed = homepageSeoSchema.parse({
    title: formData.get("title"),
    description: formData.get("description"),
    openGraphImageId: formData.get("openGraphImageId"),
  });

  await new HomepageContentRepository(prisma).updateHomepageSeo(
    parsed,
    session.userId
  );

  await appendHomepageAudit(session.userId, "UPDATE", "homepage-seo", {
    sectionKey: "homepage-seo",
    changedFields: ["title", "description", "openGraphImageId"],
  });
  revalidateTag(HOMEPAGE_SEO_CACHE_TAG, "max");
  revalidatePath("/");
  revalidatePath("/admin/homepage/seo");
}

async function appendHomepageAudit(
  actorId: string,
  action: "UPDATE" | "STATUS_CHANGE",
  entityId: string,
  metadata: Prisma.InputJsonValue
) {
  const repository = new AdminAuthRepository(prisma);
  await repository.appendAuditLog({
    actorId,
    action,
    entityType: "HomepageSection",
    entityId,
    metadata,
    context: getAdminRequestContext(await headers()),
  });
}

function revalidateHomepage() {
  revalidateTag(HOMEPAGE_CONTENT_CACHE_TAG, "max");
  revalidatePath("/");
  revalidatePath("/admin/homepage");
  revalidatePath("/admin/homepage/sections");
  revalidatePath("/admin/dashboard");
}
