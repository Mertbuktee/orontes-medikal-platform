'use server';

import type { Prisma } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminAuthRepository } from '@/lib/auth/admin-auth-repository';
import { requirePermission } from '@/lib/auth/admin-session';
import { getAdminRequestContext } from '@/lib/auth/request-context';
import { prisma } from '@/lib/database/prisma';
import { HomepageContentRepository } from '@/lib/database/repositories/homepage-content';
import {
  homepageReorderSchema,
  homepageSectionBaseInputSchema,
  homepageSeoSchema,
  homepageVisibilitySchema,
  parseHomepageSectionContent,
} from '@/lib/homepage/homepage-validation';
import {
  HOMEPAGE_CONTENT_CACHE_TAG,
  HOMEPAGE_SEO_CACHE_TAG,
} from '@/lib/homepage/public-homepage';
import { assertSameOriginAction } from '@/lib/security/action-origin';

export async function updateHomepageSection(formData: FormData) {
  const session = await requirePermission('homepage.update');
  await assertSameOriginAction();
  const base = homepageSectionBaseInputSchema.safeParse({
    key: formData.get('key'),
    title: formData.get('title'),
    eyebrow: formData.get('eyebrow'),
    description: formData.get('description'),
    order: formData.get('order'),
    isVisible: formData.get('isVisible') === 'true',
  });
  if (!base.success) return;

  const contentText = String(formData.get('content') ?? '{}');
  const contentJson = parseJsonFormValue(contentText);
  if (!contentJson.success) return;

  const content = parseHomepageSectionContentValue(
    base.data.key,
    contentJson.data,
  );
  if (!content.success) return;

  const repository = new HomepageContentRepository(prisma);
  const section = await repository.updateSection(
    {
      ...base.data,
      content: content.data,
      eyebrow: base.data.eyebrow,
    },
    session.userId,
  );

  await appendHomepageAudit(session.userId, 'UPDATE', section.id, {
    sectionKey: section.key,
    changedFields: ['title', 'description', 'content', 'visibility', 'order'],
  });
  revalidateHomepage();
  redirect('/admin/homepage/sections');
}

export async function moveHomepageSection(formData: FormData) {
  const session = await requirePermission('homepage.reorder');
  await assertSameOriginAction();
  const parsed = homepageReorderSchema.safeParse({
    key: formData.get('key'),
    direction: formData.get('direction'),
  });
  if (!parsed.success) return;

  const repository = new HomepageContentRepository(prisma);
  const order = await repository.moveSection(
    parsed.data.key,
    parsed.data.direction,
  );

  await appendHomepageAudit(session.userId, 'UPDATE', parsed.data.key, {
    sectionKey: parsed.data.key,
    action: 'reorder',
    direction: parsed.data.direction,
    order,
  });
  revalidateHomepage();
}

export async function toggleHomepageSectionVisibility(formData: FormData) {
  const session = await requirePermission('homepage.publish');
  await assertSameOriginAction();
  const parsed = homepageVisibilitySchema.safeParse({
    key: formData.get('key'),
    isVisible: formData.get('isVisible') === 'true',
  });
  if (!parsed.success) return;

  const repository = new HomepageContentRepository(prisma);
  const section = await repository.setVisibility(
    parsed.data.key,
    parsed.data.isVisible,
    session.userId,
  );

  await appendHomepageAudit(session.userId, 'STATUS_CHANGE', section.id, {
    sectionKey: section.key,
    visible: section.isVisible,
  });
  revalidateHomepage();
}

export async function updateHomepageSeo(formData: FormData) {
  const session = await requirePermission('homepage.seo.manage');
  await assertSameOriginAction();
  const parsed = homepageSeoSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    openGraphImageId: formData.get('openGraphImageId'),
  });
  if (!parsed.success) return;

  await new HomepageContentRepository(prisma).updateHomepageSeo(
    parsed.data,
    session.userId,
  );

  await appendHomepageAudit(session.userId, 'UPDATE', 'homepage-seo', {
    sectionKey: 'homepage-seo',
    changedFields: ['title', 'description', 'openGraphImageId'],
  });
  revalidateTag(HOMEPAGE_SEO_CACHE_TAG, 'max');
  revalidatePath('/');
  revalidatePath('/admin/homepage/seo');
}

async function appendHomepageAudit(
  actorId: string,
  action: 'UPDATE' | 'STATUS_CHANGE',
  entityId: string,
  metadata: Prisma.InputJsonValue,
) {
  const repository = new AdminAuthRepository(prisma);
  await repository.appendAuditLog({
    actorId,
    action,
    entityType: 'HomepageSection',
    entityId,
    metadata,
    context: getAdminRequestContext(await headers()),
  });
}

function revalidateHomepage() {
  revalidateTag(HOMEPAGE_CONTENT_CACHE_TAG, 'max');
  revalidatePath('/');
  revalidatePath('/admin/homepage');
  revalidatePath('/admin/homepage/sections');
  revalidatePath('/admin/dashboard');
}

function parseJsonFormValue(value: string) {
  try {
    return { success: true, data: JSON.parse(value) as unknown } as const;
  } catch {
    return { success: false } as const;
  }
}

function parseHomepageSectionContentValue(
  key: Parameters<typeof parseHomepageSectionContent>[0],
  value: unknown,
) {
  try {
    return {
      success: true,
      data: parseHomepageSectionContent(key, value),
    } as const;
  } catch {
    return { success: false } as const;
  }
}
