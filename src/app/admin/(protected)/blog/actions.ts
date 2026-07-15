'use server';

import type { Prisma } from '@prisma/client';
import { revalidatePath, revalidateTag } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { AdminAuthRepository } from '@/lib/auth/admin-auth-repository';
import { requirePermission } from '@/lib/auth/admin-session';
import { getAdminRequestContext } from '@/lib/auth/request-context';
import {
  blogContentSchema,
  blogCategoryInputSchema,
  blogPostInputSchema,
} from '@/lib/blog/blog-validation';
import { prisma } from '@/lib/database/prisma';
import { PrismaBlogRepository } from '@/lib/database/repositories/blog';
import {
  BLOG_CATEGORIES_CACHE_TAG,
  BLOG_POSTS_CACHE_TAG,
} from '@/lib/blog/public-blog';
import { assertSameOriginAction } from '@/lib/security/action-origin';

const idSchema = z.object({ id: z.string().min(1) });
const moveSchema = z.object({
  id: z.string().min(1),
  direction: z.enum(['up', 'down', 'first', 'last']),
});

export async function createBlogPost(formData: FormData) {
  const session = await requirePermission('blog.create');
  await assertSameOriginAction();
  const parsed = parseBlogPostForm(formData);
  if (!parsed.success) throw new Error('Invalid blog post input.');

  const repository = new PrismaBlogRepository(prisma);
  const post = await repository.createPost(parsed.data.input, session.userId);
  await applyRequestedPostState(
    post.id,
    parsed.data.requestedStatus,
    parsed.data.input.scheduledFor,
  );
  await appendBlogAudit(session.userId, 'CREATE', post.id, {
    blogPostId: post.id,
    slug: post.slug,
    status: parsed.data.requestedStatus,
  });
  revalidateBlog(post.slug);
  redirect(`/admin/blog/${post.id}`);
}

export async function updateBlogPost(formData: FormData) {
  const session = await requirePermission('blog.update');
  await assertSameOriginAction();
  const id = String(formData.get('id') ?? '');
  const parsed = parseBlogPostForm(formData);
  if (!id || !parsed.success) throw new Error('Invalid blog post input.');

  const repository = new PrismaBlogRepository(prisma);
  const post = await repository.updatePost(
    id,
    parsed.data.input,
    session.userId,
  );
  await applyRequestedPostState(
    post.id,
    parsed.data.requestedStatus,
    parsed.data.input.scheduledFor,
  );
  await appendBlogAudit(session.userId, 'UPDATE', post.id, {
    blogPostId: post.id,
    slug: post.slug,
    status: parsed.data.requestedStatus,
  });
  revalidateBlog(post.slug);
  redirect(`/admin/blog/${post.id}`);
}

export async function publishBlogPost(formData: FormData) {
  const session = await requirePermission('blog.publish');
  await assertSameOriginAction();
  const parsed = idSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return;

  const post = await new PrismaBlogRepository(prisma).publishPost(
    parsed.data.id,
    session.userId,
  );
  await appendBlogAudit(session.userId, 'PUBLISH', post.id, {
    blogPostId: post.id,
    slug: post.slug,
  });
  revalidateBlog(post.slug);
}

export async function unpublishBlogPost(formData: FormData) {
  const session = await requirePermission('blog.publish');
  await assertSameOriginAction();
  const parsed = idSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return;

  const post = await new PrismaBlogRepository(prisma).unpublishPost(
    parsed.data.id,
    session.userId,
  );
  await appendBlogAudit(session.userId, 'STATUS_CHANGE', post.id, {
    blogPostId: post.id,
    slug: post.slug,
    toStatus: 'DRAFT',
  });
  revalidateBlog(post.slug);
}

export async function archiveBlogPost(formData: FormData) {
  const session = await requirePermission('blog.delete');
  await assertSameOriginAction();
  const parsed = idSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return;

  const post = await new PrismaBlogRepository(prisma).archivePost(
    parsed.data.id,
    session.userId,
  );
  await appendBlogAudit(session.userId, 'ARCHIVE', post.id, {
    blogPostId: post.id,
    slug: post.slug,
  });
  revalidateBlog(post.slug);
  redirect('/admin/blog');
}

export async function createBlogCategory(formData: FormData) {
  const session = await requirePermission('blog.categories.manage');
  await assertSameOriginAction();
  const parsed = parseBlogCategoryForm(formData);
  if (!parsed.success) throw new Error('Invalid category input.');

  const category = await new PrismaBlogRepository(prisma).createCategory(
    parsed.data,
  );
  await appendBlogAudit(session.userId, 'CREATE', category.id, {
    blogCategoryId: category.id,
    slug: category.slug,
  });
  revalidateBlogCategories();
  redirect('/admin/blog/categories');
}

export async function updateBlogCategory(formData: FormData) {
  const session = await requirePermission('blog.categories.manage');
  await assertSameOriginAction();
  const id = String(formData.get('id') ?? '');
  const parsed = parseBlogCategoryForm(formData);
  if (!id || !parsed.success) throw new Error('Invalid category input.');

  const category = await new PrismaBlogRepository(prisma).updateCategory(
    id,
    parsed.data,
  );
  await appendBlogAudit(session.userId, 'UPDATE', category.id, {
    blogCategoryId: category.id,
    slug: category.slug,
  });
  revalidateBlogCategories();
  redirect('/admin/blog/categories');
}

export async function moveBlogCategory(formData: FormData) {
  const session = await requirePermission('blog.categories.manage');
  await assertSameOriginAction();
  const parsed = moveSchema.safeParse({
    id: formData.get('id'),
    direction: formData.get('direction'),
  });
  if (!parsed.success) return;

  const order = await new PrismaBlogRepository(prisma).moveCategory(
    parsed.data.id,
    parsed.data.direction,
  );
  await appendBlogAudit(session.userId, 'UPDATE', parsed.data.id, {
    blogCategoryId: parsed.data.id,
    action: 'reorder',
    order,
  });
  revalidateBlogCategories();
}

export async function archiveBlogCategory(formData: FormData) {
  const session = await requirePermission('blog.categories.manage');
  await assertSameOriginAction();
  const parsed = idSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return;

  const category = await new PrismaBlogRepository(prisma).archiveCategory(
    parsed.data.id,
  );
  await appendBlogAudit(session.userId, 'ARCHIVE', category.id, {
    blogCategoryId: category.id,
    slug: category.slug,
  });
  revalidateBlogCategories();
}

function parseBlogPostForm(formData: FormData) {
  const contentValue = String(formData.get('content') ?? '[]');
  const contentResult = parseBlogContentValue(contentValue);
  const content = contentResult.success ? contentResult.data : [];
  const scheduledFor = parseOptionalDate(formData.get('scheduledFor'));
  const input = {
    title: formData.get('title'),
    slug: formData.get('slug'),
    excerpt: formData.get('excerpt'),
    content,
    categoryId: emptyToNull(formData.get('categoryId')),
    coverImageId: emptyToNull(formData.get('coverImageId')),
    openGraphImageId: emptyToNull(formData.get('openGraphImageId')),
    authorId: emptyToNull(formData.get('authorId')),
    seoTitle: formData.get('seoTitle'),
    seoDescription: formData.get('seoDescription'),
    isFeatured: formData.get('isFeatured') === 'true',
    scheduledFor,
  };

  return z
    .object({
      input: blogPostInputSchema,
      requestedStatus: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
    })
    .safeParse({
      input,
      requestedStatus: formData.get('status') ?? 'DRAFT',
    });
}

function parseBlogContentValue(value: string) {
  try {
    return blogContentSchema.safeParse(JSON.parse(value));
  } catch {
    return { success: false } as const;
  }
}

function parseBlogCategoryForm(formData: FormData) {
  return blogCategoryInputSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') ?? '',
    seoTitle: formData.get('seoTitle') ?? '',
    seoDescription: formData.get('seoDescription') ?? '',
    order: formData.get('order'),
    isActive: formData.get('isActive') === 'true',
  });
}

async function applyRequestedPostState(
  id: string,
  requestedStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
  scheduledFor: Date | null,
) {
  const repository = new PrismaBlogRepository(prisma);

  if (requestedStatus === 'PUBLISHED') {
    const session = await requirePermission('blog.publish');
    await repository.publishPost(id, session.userId);
    return;
  }

  if (requestedStatus === 'ARCHIVED') {
    const session = await requirePermission('blog.delete');
    await repository.archivePost(id, session.userId);
    return;
  }

  if (scheduledFor) {
    const session = await requirePermission('blog.schedule');
    await repository.schedulePost(id, scheduledFor, session.userId);
  }
}

async function appendBlogAudit(
  actorId: string,
  action:
    'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'ARCHIVE' | 'STATUS_CHANGE',
  entityId: string,
  metadata: Prisma.InputJsonValue,
) {
  await new AdminAuthRepository(prisma).appendAuditLog({
    actorId,
    action,
    entityType: 'Blog',
    entityId,
    metadata,
    context: getAdminRequestContext(await headers()),
  });
}

function revalidateBlog(slug?: string) {
  revalidateTag(BLOG_POSTS_CACHE_TAG, 'max');
  revalidatePath('/');
  revalidatePath('/blog');
  revalidatePath('/sitemap.xml');
  if (slug) revalidatePath(`/blog/${slug}`);
  revalidatePath('/admin/blog');
  revalidatePath('/admin/dashboard');
}

function revalidateBlogCategories() {
  revalidateTag(BLOG_CATEGORIES_CACHE_TAG, 'max');
  revalidatePath('/blog');
  revalidatePath('/admin/blog/categories');
}

function emptyToNull(value: FormDataEntryValue | null) {
  const stringValue = String(value ?? '').trim();
  return stringValue ? stringValue : null;
}

function parseOptionalDate(value: FormDataEntryValue | null) {
  const stringValue = String(value ?? '').trim();
  if (!stringValue) return null;
  const date = new Date(stringValue);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}
