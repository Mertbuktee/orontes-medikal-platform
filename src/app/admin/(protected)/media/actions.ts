'use server';

import { MediaCategory, MediaUsageType, type Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';

import { requirePermission } from '@/lib/auth/admin-session';
import { AdminAuthRepository } from '@/lib/auth/admin-auth-repository';
import { getAdminRequestContext } from '@/lib/auth/request-context';
import { prisma } from '@/lib/database/prisma';
import { PrismaMediaRepository } from '@/lib/database/repositories/media';
import {
  createMediaFileName,
  MediaValidationError,
  processAdminMediaUpload,
} from '@/lib/media/media-processing';
import { LocalMediaStorageAdapter } from '@/lib/media/media-storage';
import { assertSameOriginAction } from '@/lib/security/action-origin';

const metadataSchema = z.object({
  title: z.string().trim().min(1).max(150),
  altText: z.string().trim().min(1).max(300),
  description: z.string().trim().max(1000).optional(),
  category: z.enum(MediaCategory),
  usageType: z.enum(MediaUsageType),
});

const mediaIdSchema = z.object({
  id: z.string().min(1),
});

export async function uploadMedia(formData: FormData) {
  const session = await requirePermission('media.upload');
  await assertSameOriginAction();
  const parsed = metadataSchema.safeParse({
    title: formData.get('title'),
    altText: formData.get('altText'),
    description: formData.get('description') || undefined,
    category: formData.get('category'),
    usageType: formData.get('usageType'),
  });
  const file = formData.get('file');

  if (!parsed.success || !(file instanceof File) || file.size === 0) {
    return { success: false, message: 'Medya bilgileri geçersiz.' };
  }

  const repository = new PrismaMediaRepository(prisma);
  const storage = new LocalMediaStorageAdapter();
  const storedKeys: string[] = [];

  try {
    const upload = await processAdminMediaUpload(file);
    const duplicate = await repository.findDuplicateByHash(upload.contentHash);

    if (duplicate) {
      return {
        success: true,
        duplicate: true,
        mediaId: duplicate.id,
        message: 'Bu medya daha önce yüklenmiş.',
      };
    }

    const storedVariants = [];

    for (const variant of upload.variants) {
      const stored = await storage.save({
        variant: variant.variant,
        buffer: variant.buffer,
        fileName: createMediaFileName(variant.extension),
        mimeType: variant.mimeType,
      });
      storedKeys.push(stored.storageKey);
      storedVariants.push({
        variant: variant.variant,
        file: stored,
        width: variant.width,
        height: variant.height,
      });
    }

    const media = await repository.createMediaWithVariants({
      upload,
      storedVariants,
      uploadedById: session.userId,
      title: parsed.data.title,
      altText: parsed.data.altText,
      description: parsed.data.description || null,
      category: parsed.data.category,
      usageType: parsed.data.usageType,
    });
    const auditRepository = new AdminAuthRepository(prisma);

    await auditRepository.appendAuditLog({
      actorId: session.userId,
      action: 'CREATE',
      entityType: 'Media',
      entityId: media.id,
      metadata: {
        mediaId: media.id,
        category: media.category,
        mimeType: media.mimeType,
        size: media.size,
        variantCount: media.variants.length,
        duplicateReused: false,
      },
      context: getAdminRequestContext(await headers()),
    });

    revalidateMediaPaths(media.id);

    return {
      success: true,
      mediaId: media.id,
      message: 'Medya dosyası yüklendi.',
    };
  } catch (error) {
    await Promise.allSettled(storedKeys.map((key) => storage.remove(key)));

    if (error instanceof MediaValidationError) {
      return {
        success: false,
        message: 'Bu dosya desteklenmiyor. Lütfen geçerli bir görsel yükleyin.',
      };
    }

    throw error;
  }
}

export async function updateMediaMetadata(formData: FormData) {
  const session = await requirePermission('media.update');
  await assertSameOriginAction();
  const id = String(formData.get('id') ?? '');
  const parsed = metadataSchema.safeParse({
    title: formData.get('title'),
    altText: formData.get('altText'),
    description: formData.get('description') || undefined,
    category: formData.get('category'),
    usageType: formData.get('usageType'),
  });

  if (!id || !parsed.success) {
    return;
  }

  const repository = new PrismaMediaRepository(prisma);
  const media = await repository.updateMetadata({
    id,
    title: parsed.data.title,
    altText: parsed.data.altText,
    description: parsed.data.description || null,
    category: parsed.data.category,
    usageType: parsed.data.usageType,
  });

  await appendMediaAudit(session.userId, 'UPDATE', media.id, {
    mediaId: media.id,
    category: media.category,
    mimeType: media.mimeType,
  });
  revalidateMediaPaths(media.id);
}

export async function archiveMedia(formData: FormData) {
  const session = await requirePermission('media.update');
  await assertSameOriginAction();
  const parsed = mediaIdSchema.safeParse({ id: formData.get('id') });

  if (!parsed.success) return;

  const repository = new PrismaMediaRepository(prisma);
  const media = await repository.archive(parsed.data.id);

  await appendMediaAudit(session.userId, 'ARCHIVE', media.id, {
    mediaId: media.id,
    category: media.category,
  });
  revalidateMediaPaths(media.id);
}

export async function restoreMedia(formData: FormData) {
  const session = await requirePermission('media.update');
  await assertSameOriginAction();
  const parsed = mediaIdSchema.safeParse({ id: formData.get('id') });

  if (!parsed.success) return;

  const repository = new PrismaMediaRepository(prisma);
  const media = await repository.restore(parsed.data.id);

  await appendMediaAudit(session.userId, 'UPDATE', media.id, {
    mediaId: media.id,
    restored: true,
  });
  revalidateMediaPaths(media.id);
}

export async function deleteUnusedMedia(formData: FormData) {
  const session = await requirePermission('media.delete');
  await assertSameOriginAction();
  const parsed = mediaIdSchema.safeParse({ id: formData.get('id') });

  if (!parsed.success) return;

  const repository = new PrismaMediaRepository(prisma);
  const storage = new LocalMediaStorageAdapter();
  const media = await repository.deleteUnusedMedia(parsed.data.id);

  if (!media) return;

  await Promise.allSettled(
    media.variants.map((variant) => storage.remove(variant.storageKey)),
  );
  await appendMediaAudit(session.userId, 'DELETE', media.id, {
    mediaId: media.id,
    variantCount: media.variants.length,
  });
  revalidatePath('/admin/media');
}

async function appendMediaAudit(
  actorId: string,
  action: 'CREATE' | 'UPDATE' | 'ARCHIVE' | 'DELETE',
  mediaId: string,
  metadata: Prisma.InputJsonValue,
) {
  const auditRepository = new AdminAuthRepository(prisma);

  await auditRepository.appendAuditLog({
    actorId,
    action,
    entityType: 'Media',
    entityId: mediaId,
    metadata,
    context: getAdminRequestContext(await headers()),
  });
}

function revalidateMediaPaths(id: string) {
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/media');
  revalidatePath(`/admin/media/${id}`);
}
