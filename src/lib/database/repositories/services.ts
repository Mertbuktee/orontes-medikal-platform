import type { MediaCategory, Prisma, PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

import type {
  ServiceInput,
  ServiceListQuery,
} from "@/lib/services/service-validation";
import { getMediaVariantUrl } from "@/lib/media/media-url";

export type PublicServiceDto = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  iconKey: string;
  imageUrl: string | null;
  isFeatured: boolean;
  order: number;
  ctaLabel: string | null;
  ctaHref: string | null;
  seoTitle: string;
  seoDescription: string;
};

export class PrismaServiceRepository {
  constructor(private readonly client: PrismaClient) {}

  async listAdminServices(input: ServiceListQuery) {
    const where = buildServiceWhere(input);
    const [items, total] = await Promise.all([
      this.client.service.findMany({
        where,
        orderBy: getServiceOrderBy(input.sort),
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: serviceAdminInclude,
      }),
      this.client.service.count({ where }),
    ]);

    return { items, total, page: input.page, pageSize: input.pageSize };
  }

  getAdminServiceById(id: string) {
    return this.client.service.findUnique({
      where: { id },
      include: serviceAdminInclude,
    });
  }

  getServiceBySlug(slug: string) {
    return this.client.service.findFirst({
      where: { slug, isActive: true, archivedAt: null },
      include: { image: { include: { variants: true } } },
    });
  }

  async listPublicActiveServices(): Promise<PublicServiceDto[]> {
    const items = await this.client.service.findMany({
      where: { isActive: true, archivedAt: null },
      orderBy: { order: "asc" },
      include: publicServiceInclude,
    });

    return items.map(mapPublicService);
  }

  async listPublicFeaturedServices(limit = 6): Promise<PublicServiceDto[]> {
    const items = await this.client.service.findMany({
      where: { isActive: true, isFeatured: true, archivedAt: null },
      orderBy: { order: "asc" },
      take: limit,
      include: publicServiceInclude,
    });

    return items.map(mapPublicService);
  }

  slugExists(slug: string, exceptId?: string) {
    return this.client.service
      .count({ where: { slug, id: exceptId ? { not: exceptId } : undefined } })
      .then((count) => count > 0);
  }

  async listSelectableMedia(query?: string, mode: "content" | "seo" = "content") {
    const trimmedQuery = query?.trim().slice(0, 120);
    const categories =
      mode === "seo" ? ["SEO", "SERVICE", "GENERAL"] : ["SERVICE", "GENERAL"];

    return this.client.media.findMany({
      where: {
        archivedAt: null,
        mimeType: { startsWith: "image/" },
        category: { in: categories as MediaCategory[] },
        ...(trimmedQuery
          ? {
              OR: [
                { title: { contains: trimmedQuery, mode: "insensitive" } },
                { originalName: { contains: trimmedQuery, mode: "insensitive" } },
                { altText: { contains: trimmedQuery, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ category: "asc" }, { createdAt: "desc" }],
      take: 60,
      include: {
        variants: true,
        _count: {
          select: {
            heroSlides: true,
            blogPostCovers: true,
            deviceGroups: true,
            deviceGroupOpenGraphs: true,
            services: true,
            serviceOpenGraphs: true,
          },
        },
      },
    });
  }

  async createService(input: ServiceInput, actorId: string) {
    await this.assertSelectableMedia(input.imageId);
    await this.assertSelectableMedia(input.openGraphImageId);

    if (await this.slugExists(input.slug)) {
      throw new Error("Service slug already exists.");
    }

    return this.client.service.create({
      data: {
        id: randomUUID(),
        ...mapServiceInput(input),
        createdById: actorId,
        updatedById: actorId,
      },
    });
  }

  async updateService(id: string, input: ServiceInput, actorId: string) {
    await this.assertSelectableMedia(input.imageId);
    await this.assertSelectableMedia(input.openGraphImageId);

    if (await this.slugExists(input.slug, id)) {
      throw new Error("Service slug already exists.");
    }

    return this.client.service.update({
      where: { id },
      data: {
        ...mapServiceInput(input),
        updatedById: actorId,
      },
    });
  }

  async moveService(id: string, direction: "up" | "down" | "first" | "last") {
    const items = await this.client.service.findMany({
      orderBy: { order: "asc" },
      select: { id: true },
    });
    const index = items.findIndex((item) => item.id === id);

    if (index < 0) return null;

    const reordered = [...items];
    const [item] = reordered.splice(index, 1);

    if (direction === "first") reordered.unshift(item);
    if (direction === "last") reordered.push(item);
    if (direction === "up") reordered.splice(Math.max(0, index - 1), 0, item);
    if (direction === "down") {
      reordered.splice(Math.min(reordered.length, index + 1), 0, item);
    }

    await this.applyOrder(reordered.map((entry) => entry.id));
    return reordered.map((entry, orderIndex) => ({
      id: entry.id,
      order: orderIndex + 1,
    }));
  }

  async setActiveState(id: string, isActive: boolean, actorId: string) {
    return this.client.service.update({
      where: { id },
      data: { isActive, updatedById: actorId },
    });
  }

  async setFeaturedState(id: string, isFeatured: boolean, actorId: string) {
    return this.client.service.update({
      where: { id },
      data: { isFeatured, updatedById: actorId },
    });
  }

  async archiveService(id: string, actorId: string) {
    const archived = await this.client.service.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        isActive: false,
        updatedById: actorId,
      },
    });
    await this.normalizeOrders();
    return archived;
  }

  async restoreService(id: string, actorId: string) {
    return this.client.service.update({
      where: { id },
      data: {
        archivedAt: null,
        isActive: false,
        updatedById: actorId,
      },
    });
  }

  async deleteArchivedUnusedService(id: string) {
    const item = await this.client.service.findUnique({
      where: { id },
      select: { archivedAt: true },
    });

    if (!item?.archivedAt) {
      throw new Error("Only archived services can be hard deleted.");
    }

    return this.client.service.delete({ where: { id } });
  }

  async getDashboardSummary() {
    const [activeCount, featuredCount, inactiveCount, latest] = await Promise.all([
      this.client.service.count({ where: { isActive: true, archivedAt: null } }),
      this.client.service.count({
        where: { isActive: true, isFeatured: true, archivedAt: null },
      }),
      this.client.service.count({ where: { isActive: false, archivedAt: null } }),
      this.client.service.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, updatedAt: true },
      }),
    ]);

    return { activeCount, featuredCount, inactiveCount, latest };
  }

  private async assertSelectableMedia(mediaId: string | null) {
    if (!mediaId) return;

    const media = await this.client.media.findFirst({
      where: {
        id: mediaId,
        archivedAt: null,
        mimeType: { startsWith: "image/" },
      },
      select: { id: true },
    });

    if (!media) {
      throw new Error("Selected media is not a usable image.");
    }
  }

  private async normalizeOrders() {
    const items = await this.client.service.findMany({
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
      select: { id: true },
    });
    await this.applyOrder(items.map((item) => item.id));
  }

  private async applyOrder(ids: string[]) {
    await this.client.$transaction(
      ids.map((id, index) =>
        this.client.service.update({
          where: { id },
          data: { order: index + 1 },
          select: { id: true },
        })
      )
    );
  }
}

const serviceAdminInclude = {
  image: { include: { variants: true } },
  openGraphImage: { include: { variants: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  updatedBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.ServiceInclude;

const publicServiceInclude = {
  image: { include: { variants: true } },
} satisfies Prisma.ServiceInclude;

function buildServiceWhere(input: ServiceListQuery): Prisma.ServiceWhereInput {
  const query = input.query?.trim().slice(0, 120);

  return {
    ...getArchiveWhere(input.archived),
    isActive:
      input.active === "active"
        ? true
        : input.active === "inactive"
          ? false
          : undefined,
    isFeatured:
      input.featured === "featured"
        ? true
        : input.featured === "not-featured"
          ? false
          : undefined,
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
            { shortDescription: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

function getArchiveWhere(
  archived: "active" | "archived" | "all"
): Prisma.ServiceWhereInput {
  if (archived === "all") return {};
  if (archived === "archived") return { archivedAt: { not: null } };
  return { archivedAt: null };
}

function getServiceOrderBy(
  sort: "order" | "newest" | "oldest"
): Prisma.ServiceOrderByWithRelationInput[] {
  if (sort === "newest") return [{ updatedAt: "desc" }];
  if (sort === "oldest") return [{ updatedAt: "asc" }];
  return [{ order: "asc" }, { updatedAt: "desc" }];
}

function mapPublicService(
  item: Prisma.ServiceGetPayload<{ include: typeof publicServiceInclude }>
): PublicServiceDto {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    shortDescription: item.shortDescription,
    fullDescription: item.fullDescription,
    iconKey: item.iconKey,
    imageUrl: item.image ? getBestServiceMediaUrl(item.image) : null,
    isFeatured: item.isFeatured,
    order: item.order,
    ctaLabel: item.ctaLabel,
    ctaHref: item.ctaHref,
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
  };
}

function getBestServiceMediaUrl(
  media: NonNullable<
    Prisma.ServiceGetPayload<{ include: typeof publicServiceInclude }>["image"]
  >
) {
  const variant = media.variants.some((item) => item.variant === "MEDIUM")
    ? "MEDIUM"
    : media.variants.some((item) => item.variant === "LARGE")
      ? "LARGE"
      : "ORIGINAL";

  return getMediaVariantUrl(media.id, variant);
}

function mapServiceInput(input: ServiceInput) {
  return {
    title: input.title,
    slug: input.slug,
    shortDescription: input.shortDescription,
    fullDescription: input.fullDescription,
    iconKey: input.iconKey,
    imageId: input.imageId,
    isFeatured: input.isFeatured,
    order: input.order,
    isActive: input.isActive,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    openGraphImageId: input.openGraphImageId,
    ctaLabel: input.ctaLabel,
    ctaHref: input.ctaHref,
  };
}
