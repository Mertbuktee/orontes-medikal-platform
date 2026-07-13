import type { MediaCategory, Prisma, PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

import type {
  DeviceGroupInput,
  DeviceListQuery,
} from "@/lib/devices/device-validation";
import { getDeviceIcon } from "@/lib/devices/device-registry";
import { getMediaVariantUrl } from "@/lib/media/media-url";

export type PublicDeviceGroupDto = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  iconKey: string;
  imageUrl: string | null;
  capabilities: string[];
  isFeatured: boolean;
  order: number;
};

export class PrismaDeviceGroupRepository {
  constructor(private readonly client: PrismaClient) {}

  async listAdminDeviceGroups(input: DeviceListQuery) {
    const where = buildDeviceWhere(input);
    const [items, total] = await Promise.all([
      this.client.deviceGroup.findMany({
        where,
        orderBy: getDeviceOrderBy(input.sort),
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: deviceGroupAdminInclude,
      }),
      this.client.deviceGroup.count({ where }),
    ]);

    return { items, total, page: input.page, pageSize: input.pageSize };
  }

  getAdminDeviceGroupById(id: string) {
    return this.client.deviceGroup.findUnique({
      where: { id },
      include: deviceGroupAdminInclude,
    });
  }

  getDeviceGroupBySlug(slug: string) {
    return this.client.deviceGroup.findFirst({
      where: { slug, isActive: true, archivedAt: null },
      include: { image: { include: { variants: true } } },
    });
  }

  async listPublicActiveDeviceGroups(): Promise<PublicDeviceGroupDto[]> {
    const items = await this.client.deviceGroup.findMany({
      where: { isActive: true, archivedAt: null },
      orderBy: { order: "asc" },
      include: publicDeviceInclude,
    });

    return items.map(mapPublicDevice);
  }

  async listPublicFeaturedDeviceGroups(limit = 6): Promise<PublicDeviceGroupDto[]> {
    const items = await this.client.deviceGroup.findMany({
      where: { isActive: true, isFeatured: true, archivedAt: null },
      orderBy: { order: "asc" },
      take: limit,
      include: publicDeviceInclude,
    });

    return items.map(mapPublicDevice);
  }

  slugExists(slug: string, exceptId?: string) {
    return this.client.deviceGroup
      .count({ where: { slug, id: exceptId ? { not: exceptId } : undefined } })
      .then((count) => count > 0);
  }

  async listSelectableMedia(query?: string, mode: "content" | "seo" = "content") {
    const trimmedQuery = query?.trim().slice(0, 120);
    const categories =
      mode === "seo" ? ["SEO", "DEVICE", "GENERAL"] : ["DEVICE", "GENERAL"];

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
          },
        },
      },
    });
  }

  async createDeviceGroup(input: DeviceGroupInput, actorId: string) {
    await this.assertSelectableMedia(input.imageId);
    await this.assertSelectableMedia(input.openGraphImageId);

    if (await this.slugExists(input.slug)) {
      throw new Error("Device slug already exists.");
    }

    return this.client.deviceGroup.create({
      data: {
        id: randomUUID(),
        ...mapDeviceInput(input),
        createdById: actorId,
        updatedById: actorId,
      },
    });
  }

  async updateDeviceGroup(id: string, input: DeviceGroupInput, actorId: string) {
    await this.assertSelectableMedia(input.imageId);
    await this.assertSelectableMedia(input.openGraphImageId);

    if (await this.slugExists(input.slug, id)) {
      throw new Error("Device slug already exists.");
    }

    return this.client.deviceGroup.update({
      where: { id },
      data: {
        ...mapDeviceInput(input),
        updatedById: actorId,
      },
    });
  }

  async moveDeviceGroup(id: string, direction: "up" | "down" | "first" | "last") {
    const items = await this.client.deviceGroup.findMany({
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
    return this.client.deviceGroup.update({
      where: { id },
      data: { isActive, updatedById: actorId },
    });
  }

  async setFeaturedState(id: string, isFeatured: boolean, actorId: string) {
    return this.client.deviceGroup.update({
      where: { id },
      data: { isFeatured, updatedById: actorId },
    });
  }

  async archiveDeviceGroup(id: string, actorId: string) {
    const archived = await this.client.deviceGroup.update({
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

  async restoreDeviceGroup(id: string, actorId: string) {
    return this.client.deviceGroup.update({
      where: { id },
      data: {
        archivedAt: null,
        isActive: false,
        updatedById: actorId,
      },
    });
  }

  async deleteArchivedUnusedDeviceGroup(id: string) {
    const item = await this.client.deviceGroup.findUnique({
      where: { id },
      select: { archivedAt: true },
    });

    if (!item?.archivedAt) {
      throw new Error("Only archived device groups can be hard deleted.");
    }

    return this.client.deviceGroup.delete({ where: { id } });
  }

  async getDashboardSummary() {
    const [activeCount, featuredCount, inactiveCount, latest] = await Promise.all([
      this.client.deviceGroup.count({ where: { isActive: true, archivedAt: null } }),
      this.client.deviceGroup.count({
        where: { isActive: true, isFeatured: true, archivedAt: null },
      }),
      this.client.deviceGroup.count({ where: { isActive: false, archivedAt: null } }),
      this.client.deviceGroup.findFirst({
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
    const items = await this.client.deviceGroup.findMany({
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
      select: { id: true },
    });
    await this.applyOrder(items.map((item) => item.id));
  }

  private async applyOrder(ids: string[]) {
    await this.client.$transaction(
      ids.map((id, index) =>
        this.client.deviceGroup.update({
          where: { id },
          data: { order: index + 1 },
          select: { id: true },
        })
      )
    );
  }
}

const deviceGroupAdminInclude = {
  image: { include: { variants: true } },
  openGraphImage: { include: { variants: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  updatedBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.DeviceGroupInclude;

const publicDeviceInclude = {
  image: { include: { variants: true } },
} satisfies Prisma.DeviceGroupInclude;

function buildDeviceWhere(input: DeviceListQuery): Prisma.DeviceGroupWhereInput {
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
    capabilities: input.capability ? { has: input.capability } : undefined,
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
): Prisma.DeviceGroupWhereInput {
  if (archived === "all") return {};
  if (archived === "archived") return { archivedAt: { not: null } };
  return { archivedAt: null };
}

function getDeviceOrderBy(
  sort: "order" | "newest" | "oldest"
): Prisma.DeviceGroupOrderByWithRelationInput[] {
  if (sort === "newest") return [{ updatedAt: "desc" }];
  if (sort === "oldest") return [{ updatedAt: "asc" }];
  return [{ order: "asc" }, { updatedAt: "desc" }];
}

function mapPublicDevice(
  item: Prisma.DeviceGroupGetPayload<{ include: typeof publicDeviceInclude }>
): PublicDeviceGroupDto {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    shortDescription: item.shortDescription,
    fullDescription: item.fullDescription,
    iconKey: item.iconKey,
    imageUrl: item.image ? getBestDeviceMediaUrl(item.image) : null,
    capabilities: item.capabilities,
    isFeatured: item.isFeatured,
    order: item.order,
  };
}

function getBestDeviceMediaUrl(
  media: NonNullable<
    Prisma.DeviceGroupGetPayload<{ include: typeof publicDeviceInclude }>["image"]
  >
) {
  const variant = media.variants.some((item) => item.variant === "MEDIUM")
    ? "MEDIUM"
    : media.variants.some((item) => item.variant === "LARGE")
      ? "LARGE"
      : "ORIGINAL";

  return getMediaVariantUrl(media.id, variant);
}

function mapDeviceInput(input: DeviceGroupInput) {
  return {
    title: input.title,
    slug: input.slug,
    shortDescription: input.shortDescription,
    fullDescription: input.fullDescription,
    iconKey: input.iconKey,
    imageId: input.imageId,
    capabilities: input.capabilities,
    isFeatured: input.isFeatured,
    order: input.order,
    isActive: input.isActive,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    openGraphImageId: input.openGraphImageId,
  };
}

export { getDeviceIcon };
