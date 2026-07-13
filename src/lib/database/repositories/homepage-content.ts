import type { MediaCategory, Prisma, PrismaClient } from "@prisma/client";

import {
  defaultHomepageSeo,
  defaultHomepageSections,
} from "@/lib/homepage/homepage-defaults";
import type {
  HomepageSectionKey,
  HomepageSectionSeed,
  HomepageSeo,
  PublicHomepageSection,
} from "@/lib/homepage/homepage-types";
import {
  homepageSeoSchema,
  parseHomepageSectionContent,
} from "@/lib/homepage/homepage-validation";

export const HOMEPAGE_SEO_SETTING_KEY = "homepage.seo";

export class HomepageContentRepository {
  constructor(private readonly client: PrismaClient) {}

  async listAdminSections() {
    return this.client.homepageSection.findMany({
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
      include: {
        updatedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getSectionByKey(key: HomepageSectionKey) {
    const section = await this.client.homepageSection.findUnique({
      where: { key },
      include: {
        updatedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return section ?? this.getDefaultSection(key);
  }

  async getPublicHomepageSections(): Promise<PublicHomepageSection[]> {
    const sections = await this.client.homepageSection.findMany({
      where: { isVisible: true },
      orderBy: { order: "asc" },
    });

    if (!sections.length) {
      return defaultHomepageSections.map((section, index) => ({
        ...section,
        id: section.key,
        order: index + 1,
        updatedAt: new Date(0),
      }));
    }

    return sections.map((section) => mapPublicSection(section));
  }

  async updateSection(input: HomepageSectionSeed, actorId: string) {
    const content = parseHomepageSectionContent(input.key, input.content);

    await this.assertMediaIsActiveImage(getSectionMediaId(content));

    return this.client.homepageSection.upsert({
      where: { key: input.key },
      create: {
        key: input.key,
        title: input.title,
        eyebrow: input.eyebrow,
        description: input.description,
        content: content as Prisma.InputJsonValue,
        order: input.order,
        isVisible: input.isVisible,
        updatedById: actorId,
      },
      update: {
        title: input.title,
        eyebrow: input.eyebrow,
        description: input.description,
        content: content as Prisma.InputJsonValue,
        order: input.order,
        isVisible: input.isVisible,
        updatedById: actorId,
      },
    });
  }

  async moveSection(key: HomepageSectionKey, direction: "up" | "down" | "first" | "last") {
    const sections = await this.client.homepageSection.findMany({
      orderBy: { order: "asc" },
      select: { key: true },
    });

    const index = sections.findIndex((section) => section.key === key);
    if (index < 0) return null;

    const reordered = [...sections];
    const [item] = reordered.splice(index, 1);
    if (direction === "first") reordered.unshift(item);
    if (direction === "last") reordered.push(item);
    if (direction === "up") reordered.splice(Math.max(0, index - 1), 0, item);
    if (direction === "down") {
      reordered.splice(Math.min(reordered.length, index + 1), 0, item);
    }

    await this.applyOrder(reordered.map((section) => section.key));
    return reordered.map((section, orderIndex) => ({
      key: section.key,
      order: orderIndex + 1,
    }));
  }

  async setVisibility(key: HomepageSectionKey, isVisible: boolean, actorId: string) {
    if (!isVisible) {
      const visibleCount = await this.client.homepageSection.count({
        where: { isVisible: true, key: { not: key } },
      });

      if (visibleCount < 3) {
        throw new Error("Homepage must keep at least three visible sections.");
      }
    }

    return this.client.homepageSection.update({
      where: { key },
      data: { isVisible, updatedById: actorId },
    });
  }

  async getHomepageSeo(): Promise<HomepageSeo> {
    const setting = await this.client.siteSetting.findUnique({
      where: { key: HOMEPAGE_SEO_SETTING_KEY },
      select: { value: true },
    });

    const parsed = homepageSeoSchema.safeParse(setting?.value);
    return parsed.success ? parsed.data : defaultHomepageSeo;
  }

  async listSelectableMedia() {
    const categories = ["GENERAL", "HERO", "SEO", "BRAND"] satisfies MediaCategory[];

    return this.client.media.findMany({
      where: {
        archivedAt: null,
        mimeType: { startsWith: "image/" },
        category: { in: categories },
      },
      orderBy: [{ category: "asc" }, { createdAt: "desc" }],
      take: 80,
      select: {
        id: true,
        title: true,
        originalName: true,
        category: true,
        width: true,
        height: true,
        altText: true,
      },
    });
  }

  async updateHomepageSeo(input: HomepageSeo, actorId: string) {
    const seo = homepageSeoSchema.parse(input);
    await this.assertMediaIsActiveImage(seo.openGraphImageId);

    return this.client.siteSetting.upsert({
      where: { key: HOMEPAGE_SEO_SETTING_KEY },
      create: {
        key: HOMEPAGE_SEO_SETTING_KEY,
        value: seo as Prisma.InputJsonValue,
        type: "homepage-seo",
        updatedById: actorId,
      },
      update: {
        value: seo as Prisma.InputJsonValue,
        updatedById: actorId,
      },
    });
  }

  async getDashboardSummary() {
    const [visibleCount, hiddenCount, latest, seo] = await Promise.all([
      this.client.homepageSection.count({ where: { isVisible: true } }),
      this.client.homepageSection.count({ where: { isVisible: false } }),
      this.client.homepageSection.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { key: true, title: true, updatedAt: true },
      }),
      this.getHomepageSeo(),
    ]);

    return {
      visibleCount,
      hiddenCount,
      latest,
      seoConfigured: Boolean(seo.title && seo.description),
    };
  }

  private async applyOrder(keys: string[]) {
    await this.client.$transaction(
      keys.map((key, index) =>
        this.client.homepageSection.update({
          where: { key },
          data: { order: index + 1 },
          select: { id: true },
        })
      )
    );
  }

  private async assertMediaIsActiveImage(mediaId: string | null | undefined) {
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
      throw new Error("Selected media is not an active image.");
    }
  }

  private getDefaultSection(key: HomepageSectionKey) {
    const section =
      defaultHomepageSections.find((item) => item.key === key) ??
      defaultHomepageSections[0];

    return {
      ...section,
      id: section.key,
      createdAt: new Date(0),
      updatedAt: new Date(0),
      updatedById: null,
      updatedBy: null,
    };
  }
}

function mapPublicSection(
  section: Prisma.HomepageSectionGetPayload<Record<string, never>>
): PublicHomepageSection {
  return {
    id: section.id,
    key: section.key as HomepageSectionKey,
    title: section.title,
    eyebrow: section.eyebrow,
    description: section.description,
    content: parseHomepageSectionContent(
      section.key as HomepageSectionKey,
      section.content
    ),
    order: section.order,
    isVisible: section.isVisible,
    updatedAt: section.updatedAt,
  };
}

function getSectionMediaId(content: unknown) {
  if (
    content &&
    typeof content === "object" &&
    "mediaId" in content &&
    typeof content.mediaId === "string"
  ) {
    return content.mediaId;
  }

  return null;
}
