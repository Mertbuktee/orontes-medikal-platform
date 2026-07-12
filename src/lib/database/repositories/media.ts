import type {
  MediaCategory,
  MediaUsageType,
  MediaVariantType,
  Prisma,
  PrismaClient,
} from "@prisma/client";

import type { ProcessedMediaUpload } from "@/lib/media/media-processing";
import type { MediaStoredFile } from "@/lib/media/media-storage";
import { mediaPageSizes } from "@/lib/media/media-types";

export type MediaSort = "newest" | "oldest" | "filename" | "largest" | "smallest";

export type MediaListInput = {
  query?: string;
  category?: MediaCategory;
  usageType?: MediaUsageType;
  mimeType?: string;
  uploaderId?: string;
  archived?: "active" | "archived" | "all";
  used?: "used" | "unused" | "all";
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
  sort?: MediaSort;
};

export type MediaVariantInput = {
  variant: MediaVariantType;
  file: MediaStoredFile;
  width: number;
  height: number;
};

export class PrismaMediaRepository {
  constructor(private readonly client: PrismaClient) {}

  findDuplicateByHash(contentHash: string) {
    return this.client.media.findUnique({
      where: { contentHash },
      include: { variants: true },
    });
  }

  async createMediaWithVariants(input: {
    upload: ProcessedMediaUpload;
    storedVariants: MediaVariantInput[];
    uploadedById: string;
    title: string;
    altText: string;
    description?: string | null;
    category: MediaCategory;
    usageType: MediaUsageType;
  }) {
    const original = input.storedVariants.find(
      (variant) => variant.variant === "ORIGINAL"
    );

    if (!original) {
      throw new Error("Original media variant is required.");
    }

    return this.client.media.create({
      data: {
        storageKey: original.file.storageKey,
        originalName: input.upload.originalName,
        mimeType: input.upload.mimeType,
        size: original.file.size,
        width: original.width,
        height: original.height,
        altText: input.altText,
        title: input.title,
        description: input.description,
        category: input.category,
        usageType: input.usageType,
        contentHash: input.upload.contentHash,
        uploadedById: input.uploadedById,
        variants: {
          create: input.storedVariants.map((variant) => ({
            variant: variant.variant,
            storageKey: variant.file.storageKey,
            mimeType: variant.file.mimeType,
            size: variant.file.size,
            width: variant.width,
            height: variant.height,
          })),
        },
      },
      include: { variants: true },
    });
  }

  async listMedia(input: MediaListInput = {}) {
    const pageSize = normalizeMediaPageSize(input.pageSize);
    const page = normalizeMediaPage(input.page);
    const where = buildMediaWhere(input);

    const [items, total] = await this.client.$transaction([
      this.client.media.findMany({
        where,
        orderBy: getMediaOrderBy(input.sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
          variants: true,
          _count: { select: { heroSlides: true, blogPostCovers: true } },
        },
      }),
      this.client.media.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  getMediaById(id: string) {
    return this.client.media.findUnique({
      where: { id },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        variants: { orderBy: { variant: "asc" } },
        heroSlides: { select: { id: true, title: true } },
        blogPostCovers: { select: { id: true, title: true } },
      },
    });
  }

  getVariant(input: { mediaId: string; variant: MediaVariantType }) {
    return this.client.mediaVariant.findFirst({
      where: {
        mediaId: input.mediaId,
        variant: input.variant,
        media: { archivedAt: null },
      },
      include: {
        media: { select: { id: true, title: true, archivedAt: true } },
      },
    });
  }

  updateMetadata(input: {
    id: string;
    title: string;
    altText: string;
    description?: string | null;
    category: MediaCategory;
    usageType: MediaUsageType;
  }) {
    return this.client.media.update({
      where: { id: input.id },
      data: {
        title: input.title,
        altText: input.altText,
        description: input.description,
        category: input.category,
        usageType: input.usageType,
      },
    });
  }

  archive(id: string) {
    return this.client.media.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
  }

  restore(id: string) {
    return this.client.media.update({
      where: { id },
      data: { archivedAt: null },
    });
  }

  async deleteUnusedMedia(id: string) {
    const media = await this.getMediaById(id);

    if (!media) {
      return null;
    }

    if (media.heroSlides.length || media.blogPostCovers.length) {
      throw new Error("Media is still in use.");
    }

    await this.client.media.delete({ where: { id } });
    return media;
  }

  getUsage(media: NonNullable<Awaited<ReturnType<PrismaMediaRepository["getMediaById"]>>>) {
    return [
      ...media.heroSlides.map((slide) => ({
        entityType: "HeroSlide",
        entityId: slide.id,
        title: slide.title,
        adminUrl: `/admin/hero-slides/${slide.id}`,
      })),
      ...media.blogPostCovers.map((post) => ({
        entityType: "BlogPost",
        entityId: post.id,
        title: post.title,
        adminUrl: `/admin/blog/${post.id}`,
      })),
    ];
  }

  getDashboardSummary() {
    return Promise.all([
      this.client.media.count({ where: { archivedAt: null } }),
      this.client.media.findMany({
        where: { archivedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, mimeType: true, createdAt: true },
      }),
    ]).then(([totalActive, latest]) => ({ totalActive, latest }));
  }
}

export function normalizeMediaPage(value: number | undefined) {
  if (!Number.isFinite(value) || !value || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

export function normalizeMediaPageSize(value: number | undefined) {
  return mediaPageSizes.includes(value as (typeof mediaPageSizes)[number])
    ? (value as (typeof mediaPageSizes)[number])
    : 24;
}

function buildMediaWhere(input: MediaListInput): Prisma.MediaWhereInput {
  const query = input.query?.trim().slice(0, 120);

  return {
    ...getMediaArchiveWhere(input.archived ?? "active"),
    category: input.category,
    usageType: input.usageType,
    mimeType: input.mimeType || undefined,
    uploadedById: input.uploaderId || undefined,
    createdAt:
      input.dateFrom || input.dateTo
        ? { gte: input.dateFrom, lte: input.dateTo }
        : undefined,
    ...(input.used === "used"
      ? { OR: [{ heroSlides: { some: {} } }, { blogPostCovers: { some: {} } }] }
      : {}),
    ...(input.used === "unused"
      ? { heroSlides: { none: {} }, blogPostCovers: { none: {} } }
      : {}),
    ...(query
      ? {
          AND: [
            {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { originalName: { contains: query, mode: "insensitive" } },
                { altText: { contains: query, mode: "insensitive" } },
              ],
            },
          ],
        }
      : {}),
  };
}

function getMediaArchiveWhere(
  archived: "active" | "archived" | "all"
): Prisma.MediaWhereInput {
  if (archived === "all") return {};
  if (archived === "archived") return { archivedAt: { not: null } };
  return { archivedAt: null };
}

function getMediaOrderBy(sort: MediaSort | undefined): Prisma.MediaOrderByWithRelationInput {
  if (sort === "oldest") return { createdAt: "asc" };
  if (sort === "filename") return { originalName: "asc" };
  if (sort === "largest") return { size: "desc" };
  if (sort === "smallest") return { size: "asc" };
  return { createdAt: "desc" };
}
