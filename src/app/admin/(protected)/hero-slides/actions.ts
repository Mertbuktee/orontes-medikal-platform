'use server';

import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { AdminAuthRepository } from '@/lib/auth/admin-auth-repository';
import { requirePermission } from '@/lib/auth/admin-session';
import { getAdminRequestContext } from '@/lib/auth/request-context';
import { prisma } from '@/lib/database/prisma';
import { PrismaHeroSlideRepository } from '@/lib/database/repositories/hero-slides';
import { heroSliderSettingsSchema } from '@/lib/hero-slider/hero-slider-settings';
import { heroSlideInputSchema } from '@/lib/hero-slider/hero-slide-validation';
import { assertSameOriginAction } from '@/lib/security/action-origin';

const idSchema = z.object({ id: z.string().min(1) });
const moveSchema = z.object({
  id: z.string().min(1),
  direction: z.enum(['up', 'down', 'first', 'last']),
});

export async function createHeroSlide(formData: FormData) {
  const session = await requirePermission('heroSlides.create');
  await assertSameOriginAction();
  const parsed = parseHeroSlideForm(formData);

  if (!parsed.success) {
    throw new Error('Invalid Hero slide input.');
  }

  const repository = new PrismaHeroSlideRepository(prisma);
  const slide = await repository.createSlide(parsed.data, session.userId);

  await appendHeroAudit(session.userId, 'CREATE', slide.id, {
    heroSlideId: slide.id,
    mediaId: slide.imageId,
    active: slide.isActive,
    autoplay: slide.includeInAutoplay,
  });
  revalidateHero();
  redirect(`/admin/hero-slides/${slide.id}`);
}

export async function updateHeroSlide(formData: FormData) {
  const session = await requirePermission('heroSlides.update');
  await assertSameOriginAction();
  const parsed = parseHeroSlideForm(formData);
  const id = String(formData.get('id') ?? '');

  if (!id || !parsed.success) {
    throw new Error('Invalid Hero slide input.');
  }

  const repository = new PrismaHeroSlideRepository(prisma);
  const slide = await repository.updateSlide(id, parsed.data, session.userId);

  await appendHeroAudit(session.userId, 'UPDATE', slide.id, {
    heroSlideId: slide.id,
    mediaId: slide.imageId,
    active: slide.isActive,
    autoplay: slide.includeInAutoplay,
  });
  revalidateHero();
  redirect(`/admin/hero-slides/${slide.id}`);
}

export async function deleteHeroSlide(formData: FormData) {
  const session = await requirePermission('heroSlides.delete');
  await assertSameOriginAction();
  const parsed = idSchema.safeParse({ id: formData.get('id') });

  if (!parsed.success) return;

  const repository = new PrismaHeroSlideRepository(prisma);
  const slide = await repository.deleteSlide(parsed.data.id);

  await appendHeroAudit(session.userId, 'DELETE', slide.id, {
    heroSlideId: slide.id,
    mediaId: slide.imageId,
  });
  revalidateHero();
  redirect('/admin/hero-slides');
}

export async function duplicateHeroSlide(formData: FormData) {
  const session = await requirePermission('heroSlides.create');
  await assertSameOriginAction();
  const parsed = idSchema.safeParse({ id: formData.get('id') });

  if (!parsed.success) return;

  const repository = new PrismaHeroSlideRepository(prisma);
  const slide = await repository.duplicateSlide(parsed.data.id, session.userId);

  await appendHeroAudit(session.userId, 'CREATE', slide.id, {
    heroSlideId: slide.id,
    sourceHeroSlideId: parsed.data.id,
    mediaId: slide.imageId,
    duplicated: true,
  });
  revalidateHero();
  redirect(`/admin/hero-slides/${slide.id}/edit`);
}

export async function moveHeroSlide(formData: FormData) {
  const session = await requirePermission('heroSlides.reorder');
  await assertSameOriginAction();
  const parsed = moveSchema.safeParse({
    id: formData.get('id'),
    direction: formData.get('direction'),
  });

  if (!parsed.success) return;

  const repository = new PrismaHeroSlideRepository(prisma);
  const order = await repository.moveSlide(
    parsed.data.id,
    parsed.data.direction,
  );

  await appendHeroAudit(session.userId, 'UPDATE', parsed.data.id, {
    heroSlideId: parsed.data.id,
    action: 'reorder',
    direction: parsed.data.direction,
    order,
  });
  revalidateHero();
}

export async function toggleHeroSlideActive(formData: FormData) {
  const session = await requirePermission('heroSlides.publish');
  await assertSameOriginAction();
  const parsed = idSchema.safeParse({ id: formData.get('id') });

  if (!parsed.success) return;

  const isActive = formData.get('isActive') === 'true';
  const repository = new PrismaHeroSlideRepository(prisma);
  const slide = await repository.setActiveState(
    parsed.data.id,
    isActive,
    session.userId,
  );

  await appendHeroAudit(session.userId, 'PUBLISH', slide.id, {
    heroSlideId: slide.id,
    active: slide.isActive,
  });
  revalidateHero();
}

export async function toggleHeroSlideAutoplay(formData: FormData) {
  const session = await requirePermission('heroSlides.update');
  await assertSameOriginAction();
  const parsed = idSchema.safeParse({ id: formData.get('id') });

  if (!parsed.success) return;

  const includeInAutoplay = formData.get('includeInAutoplay') === 'true';
  const repository = new PrismaHeroSlideRepository(prisma);
  const slide = await repository.setAutoplayState(
    parsed.data.id,
    includeInAutoplay,
    session.userId,
  );

  await appendHeroAudit(session.userId, 'UPDATE', slide.id, {
    heroSlideId: slide.id,
    autoplay: slide.includeInAutoplay,
  });
  revalidateHero();
}

export async function updateHeroSliderSettings(formData: FormData) {
  const session = await requirePermission('heroSlides.update');
  await assertSameOriginAction();
  const parsed = heroSliderSettingsSchema.safeParse({
    autoplayEnabled: formData.get('autoplayEnabled') === 'true',
    autoplayIntervalMs: formData.get('autoplayIntervalMs'),
    transitionDurationMs: formData.get('transitionDurationMs'),
    pauseOnHover: formData.get('pauseOnHover') === 'true',
    showPagination: formData.get('showPagination') === 'true',
    showArrows: formData.get('showArrows') === 'true',
    showSlideCounter: formData.get('showSlideCounter') === 'true',
  });

  if (!parsed.success) return;

  const repository = new PrismaHeroSlideRepository(prisma);
  await repository.updateSliderSettings(parsed.data, session.userId);
  await appendHeroAudit(session.userId, 'UPDATE', 'hero-slider-settings', {
    settings: parsed.data,
  });
  revalidateHero();
}

function parseHeroSlideForm(formData: FormData) {
  return heroSlideInputSchema.safeParse({
    badge: formData.get('badge') ?? '',
    title: formData.get('title'),
    description: formData.get('description'),
    imageId: formData.get('imageId'),
    imageAlt: formData.get('imageAlt'),
    linkLabel: formData.get('linkLabel') ?? '',
    linkUrl: formData.get('linkUrl') ?? '',
    objectPosition: formData.get('objectPosition'),
    order: formData.get('order'),
    isActive: formData.get('isActive') === 'true',
    includeInAutoplay: formData.get('includeInAutoplay') === 'true',
  });
}

async function appendHeroAudit(
  actorId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH',
  entityId: string,
  metadata: Prisma.InputJsonValue,
) {
  const repository = new AdminAuthRepository(prisma);
  await repository.appendAuditLog({
    actorId,
    action,
    entityType: 'HeroSlide',
    entityId,
    metadata,
    context: getAdminRequestContext(await headers()),
  });
}

function revalidateHero() {
  revalidatePath('/');
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/hero-slides');
}
