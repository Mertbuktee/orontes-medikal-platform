import type { Prisma, PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

import {
  defaultHeroSliderSettings,
  heroSliderSettingsKey,
  parseHeroSliderSettings,
  type HeroSliderSettings,
} from "@/lib/hero-slider/hero-slider-settings";
import type { HeroSlideInput } from "@/lib/hero-slider/hero-slide-validation";
import { getMediaVariantUrl } from "@/lib/media/media-url";

export type PublicHeroSlideDto = {
  id: string;
  title: string;
  description: string;
  badge?: string;
  imageSrc: string;
  imageAlt: string;
  linkUrl?: string;
  linkLabel?: string;
  order: number;
  isActive: boolean;
  includeInAutoplay: boolean;
  objectPosition: string;
};

export class PrismaHeroSlideRepository {
  constructor(private readonly client: PrismaClient) {}

  listAdminSlides() {
    return this.client.heroSlide.findMany({
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
      include: heroSlideAdminInclude,
    });
  }

  getAdminSlideById(id: string) {
    return this.client.heroSlide.findUnique({
      where: { id },
      include: heroSlideAdminInclude,
    });
  }

  async listPublicActiveSlides(): Promise<PublicHeroSlideDto[]> {
    const slides = await this.client.heroSlide.findMany({
      where: {
        isActive: true,
        image: {
          archivedAt: null,
          mimeType: { startsWith: "image/" },
        },
      },
      orderBy: { order: "asc" },
      include: {
        image: {
          select: {
            id: true,
            altText: true,
            variants: { select: { variant: true } },
          },
        },
      },
    });

    return slides.map((slide) => ({
      id: slide.id,
      title: slide.title,
      description: slide.description,
      badge: slide.badge ?? undefined,
      imageSrc: getMediaVariantUrl(
        slide.image.id,
        slide.image.variants.some((variant) => variant.variant === "LARGE")
          ? "LARGE"
          : "ORIGINAL"
      ),
      imageAlt: slide.imageAlt || slide.image.altText || slide.title,
      linkUrl: slide.linkUrl ?? undefined,
      linkLabel: slide.linkLabel ?? undefined,
      order: slide.order,
      isActive: slide.isActive,
      includeInAutoplay: slide.includeInAutoplay,
      objectPosition: slide.objectPosition,
    }));
  }

  async listSelectableMedia(query?: string) {
    const trimmedQuery = query?.trim().slice(0, 120);

    return this.client.media.findMany({
      where: {
        archivedAt: null,
        mimeType: { startsWith: "image/" },
        category: { in: ["HERO", "GENERAL"] },
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
      take: 40,
      include: {
        variants: true,
        _count: { select: { heroSlides: true, blogPostCovers: true } },
      },
    });
  }

  async createSlide(input: HeroSlideInput, actorId: string) {
    await this.assertSelectableMedia(input.imageId);

    return this.client.heroSlide.create({
      data: {
        id: randomUUID(),
        ...mapHeroSlideInput(input),
        createdById: actorId,
        updatedById: actorId,
      },
    });
  }

  async updateSlide(id: string, input: HeroSlideInput, actorId: string) {
    await this.assertSelectableMedia(input.imageId);

    return this.client.heroSlide.update({
      where: { id },
      data: {
        ...mapHeroSlideInput(input),
        updatedById: actorId,
      },
    });
  }

  async deleteSlide(id: string) {
    const existing = await this.client.heroSlide.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!existing) {
      throw new Error("Hero slide not found.");
    }

    if (existing.isActive) {
      const activeCount = await this.client.heroSlide.count({
        where: { isActive: true, id: { not: id } },
      });

      if (activeCount < 1) {
        throw new Error("At least one active Hero slide is required.");
      }
    }

    const deleted = await this.client.heroSlide.delete({ where: { id } });
    await this.normalizeOrders();
    return deleted;
  }

  async duplicateSlide(id: string, actorId: string) {
    const slide = await this.client.heroSlide.findUnique({
      where: { id },
      select: {
        badge: true,
        title: true,
        description: true,
        imageId: true,
        imageAlt: true,
        linkLabel: true,
        linkUrl: true,
        objectPosition: true,
      },
    });

    if (!slide) {
      throw new Error("Hero slide not found.");
    }

    await this.assertSelectableMedia(slide.imageId);

    const nextOrder =
      (await this.client.heroSlide.aggregate({
        _max: { order: true },
      }))._max.order ?? 0;

    return this.client.heroSlide.create({
      data: {
        id: randomUUID(),
        badge: slide.badge,
        title: `${slide.title} Kopya`,
        description: slide.description,
        imageId: slide.imageId,
        imageAlt: slide.imageAlt,
        linkLabel: slide.linkLabel,
        linkUrl: slide.linkUrl,
        objectPosition: slide.objectPosition,
        order: nextOrder + 1,
        isActive: false,
        includeInAutoplay: false,
        createdById: actorId,
        updatedById: actorId,
      },
    });
  }

  async moveSlide(id: string, direction: "up" | "down" | "first" | "last") {
    const slides = await this.client.heroSlide.findMany({
      orderBy: { order: "asc" },
      select: { id: true },
    });
    const index = slides.findIndex((slide) => slide.id === id);

    if (index < 0) return null;

    const reordered = [...slides];
    const [item] = reordered.splice(index, 1);

    if (direction === "first") reordered.unshift(item);
    if (direction === "last") reordered.push(item);
    if (direction === "up") reordered.splice(Math.max(0, index - 1), 0, item);
    if (direction === "down") {
      reordered.splice(Math.min(reordered.length, index + 1), 0, item);
    }

    await this.applyOrder(reordered.map((slide) => slide.id));
    return reordered.map((slide, orderIndex) => ({
      id: slide.id,
      order: orderIndex + 1,
    }));
  }

  async setActiveState(id: string, isActive: boolean, actorId: string) {
    if (!isActive) {
      const activeCount = await this.client.heroSlide.count({
        where: { isActive: true, id: { not: id } },
      });

      if (activeCount < 1) {
        throw new Error("At least one active Hero slide is required.");
      }
    }

    return this.client.heroSlide.update({
      where: { id },
      data: { isActive, updatedById: actorId },
    });
  }

  async setAutoplayState(id: string, includeInAutoplay: boolean, actorId: string) {
    return this.client.heroSlide.update({
      where: { id },
      data: { includeInAutoplay, updatedById: actorId },
    });
  }

  async getSliderSettings() {
    const setting = await this.client.siteSetting.findUnique({
      where: { key: heroSliderSettingsKey },
    });

    return parseHeroSliderSettings(setting?.value);
  }

  async updateSliderSettings(settings: HeroSliderSettings, actorId: string) {
    return this.client.siteSetting.upsert({
      where: { key: heroSliderSettingsKey },
      create: {
        key: heroSliderSettingsKey,
        value: settings,
        type: "hero-slider",
        updatedById: actorId,
      },
      update: {
        value: settings,
        type: "hero-slider",
        updatedById: actorId,
      },
    });
  }

  async getDashboardSummary() {
    const [activeCount, inactiveCount, settings, latest] = await Promise.all([
      this.client.heroSlide.count({ where: { isActive: true } }),
      this.client.heroSlide.count({ where: { isActive: false } }),
      this.getSliderSettings().catch(() => defaultHeroSliderSettings),
      this.client.heroSlide.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, updatedAt: true },
      }),
    ]);

    return { activeCount, inactiveCount, settings, latest };
  }

  private async assertSelectableMedia(imageId: string) {
    const media = await this.client.media.findFirst({
      where: {
        id: imageId,
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
    const slides = await this.client.heroSlide.findMany({
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
      select: { id: true },
    });
    await this.applyOrder(slides.map((slide) => slide.id));
  }

  private async applyOrder(ids: string[]) {
    await this.client.$transaction(
      ids.map((id, index) =>
        this.client.heroSlide.update({
          where: { id },
          data: { order: index + 1 },
          select: { id: true },
        })
      )
    );
  }
}

const heroSlideAdminInclude = {
  image: { include: { variants: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  updatedBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.HeroSlideInclude;

function mapHeroSlideInput(input: HeroSlideInput) {
  return {
    badge: input.badge,
    title: input.title,
    description: input.description,
    imageId: input.imageId,
    imageAlt: input.imageAlt,
    linkLabel: input.linkLabel,
    linkUrl: input.linkUrl,
    objectPosition: input.objectPosition,
    order: input.order,
    isActive: input.isActive,
    includeInAutoplay: input.includeInAutoplay,
  };
}
