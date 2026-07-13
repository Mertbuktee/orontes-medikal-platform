import type { MediaVariantType } from "@prisma/client";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { fileTypeFromBuffer } from "file-type";

import { getRequiredDatabaseUrl } from "../src/lib/database/env.ts";
import {
  getBlogCategorySeedRecords,
  getBlogPostSeedRecords,
  getDeviceGroupSeedRecords,
  getHomepageSectionSeedRecords,
  getHomepageSeoSeedRecord,
  getHeroSeedRecords,
  getServiceSeedRecords,
} from "../src/lib/database/seed-data.ts";
import {
  processAdminMediaUpload,
  type ProcessedMediaUpload,
} from "../src/lib/media/media-processing.ts";
import { LocalMediaStorageAdapter } from "../src/lib/media/media-storage.ts";
import {
  defaultSiteSettings,
  siteSettingGroupToKey,
  type SiteSettingGroup,
} from "../src/lib/site-settings/site-settings-types.ts";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: getRequiredDatabaseUrl(),
  }),
});

const HOMEPAGE_SEO_SETTING_KEY = "homepage.seo";

async function main() {
  for (const category of getBlogCategorySeedRecords()) {
    await prisma.blogCategory.upsert({
      where: { id: category.id },
      create: category,
      update: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        seoTitle: category.seoTitle,
        seoDescription: category.seoDescription,
        order: category.order,
        isActive: category.isActive,
        archivedAt: category.archivedAt,
      },
    });
  }

  for (const post of getBlogPostSeedRecords()) {
    await prisma.blogPost.upsert({
      where: { id: post.id },
      create: {
        ...post,
        content: post.content,
      },
      update: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        categoryId: post.categoryId,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        isFeatured: post.isFeatured,
      },
    });
  }

  for (const device of getDeviceGroupSeedRecords()) {
    await prisma.deviceGroup.upsert({
      where: { id: device.id },
      create: device,
      update: device,
    });
  }

  for (const service of getServiceSeedRecords()) {
    await prisma.service.upsert({
      where: { id: service.id },
      create: service,
      update: service,
    });
  }

  for (const { media, slide } of getHeroSeedRecords()) {
    const processed = await processPublicHeroMedia(media);
    const storedVariants = await storeSeedMediaVariants(media.id, processed);
    const original = storedVariants.find(
      (variant) => variant.variant === "ORIGINAL"
    );

    if (!original) {
      throw new Error(`Missing original variant for ${media.id}`);
    }

    await prisma.media.upsert({
      where: { id: media.id },
      create: {
        ...media,
        originalName: processed.originalName,
        mimeType: processed.mimeType,
        storageKey: original.storageKey,
        size: original.size,
        width: processed.width,
        height: processed.height,
        contentHash: processed.contentHash,
      },
      update: {
        ...media,
        originalName: processed.originalName,
        mimeType: processed.mimeType,
        storageKey: original.storageKey,
        size: original.size,
        width: processed.width,
        height: processed.height,
        contentHash: processed.contentHash,
      },
    });

    await prisma.mediaVariant.deleteMany({
      where: { mediaId: media.id },
    });
    await prisma.mediaVariant.createMany({
      data: storedVariants.map((variant) => ({
        mediaId: media.id,
        variant: variant.variant,
        storageKey: variant.storageKey,
        mimeType: variant.mimeType,
        width: variant.width,
        height: variant.height,
        size: variant.size,
      })),
    });

    await prisma.heroSlide.upsert({
      where: { id: slide.id },
      create: slide,
      update: slide,
    });
  }

  for (const section of getHomepageSectionSeedRecords()) {
    await prisma.homepageSection.upsert({
      where: { key: section.key },
      create: {
        key: section.key,
        title: section.title,
        eyebrow: section.eyebrow,
        description: section.description,
        content: section.content,
        order: section.order,
        isVisible: section.isVisible,
      },
      update: {
        title: section.title,
        eyebrow: section.eyebrow,
        description: section.description,
        content: section.content,
        order: section.order,
        isVisible: section.isVisible,
      },
    });
  }

  await prisma.siteSetting.upsert({
    where: { key: HOMEPAGE_SEO_SETTING_KEY },
    create: {
      key: HOMEPAGE_SEO_SETTING_KEY,
      value: getHomepageSeoSeedRecord(),
      type: "homepage-seo",
    },
    update: {
      value: getHomepageSeoSeedRecord(),
      type: "homepage-seo",
    },
  });

  for (const group of Object.keys(siteSettingGroupToKey) as SiteSettingGroup[]) {
    await prisma.siteSetting.upsert({
      where: { key: siteSettingGroupToKey[group] },
      create: {
        key: siteSettingGroupToKey[group],
        value: defaultSiteSettings[group],
        type: `site-${group}`,
      },
      update: {
        value: defaultSiteSettings[group],
        type: `site-${group}`,
      },
    });
  }
}

type SeedMediaInput = ReturnType<typeof getHeroSeedRecords>[number]["media"];

type StoredSeedVariant = {
  variant: MediaVariantType;
  storageKey: string;
  mimeType: string;
  width: number;
  height: number;
  size: number;
};

async function processPublicHeroMedia(media: SeedMediaInput) {
  const filePath = getPublicAssetPath(media.storageKey);
  const buffer = await readFile(filePath);
  const detected = await fileTypeFromBuffer(buffer);
  const fileName =
    detected && detected.ext !== path.extname(media.originalName).slice(1)
      ? `${path.basename(media.originalName, path.extname(media.originalName))}.${detected.ext}`
      : media.originalName;
  const mimeType = detected?.mime ?? media.mimeType;
  const file = new File([buffer], fileName, { type: mimeType });

  return processAdminMediaUpload(file);
}

async function storeSeedMediaVariants(
  mediaId: string,
  upload: ProcessedMediaUpload
): Promise<StoredSeedVariant[]> {
  const storage = new LocalMediaStorageAdapter();
  const storedVariants: StoredSeedVariant[] = [];

  for (const variant of upload.variants) {
    const fileName = `${mediaId}-${variant.variant.toLowerCase()}.${variant.extension}`;
    const storageKey = `${getVariantDirectory(variant.variant)}/${fileName}`;

    await storage.remove(storageKey);
    const stored = await storage.save({
      variant: variant.variant,
      buffer: variant.buffer,
      fileName,
      mimeType: variant.mimeType,
    });

    storedVariants.push({
      variant: variant.variant,
      storageKey: stored.storageKey,
      mimeType: stored.mimeType,
      width: variant.width,
      height: variant.height,
      size: stored.size,
    });
  }

  return storedVariants;
}

function getVariantDirectory(variant: MediaVariantType) {
  if (variant === "ORIGINAL") return "originals";
  if (variant === "THUMBNAIL") return "thumbnails";
  if (variant === "MEDIUM") return "medium";
  return "large";
}

function getPublicAssetPath(storageKey: string) {
  const relativePath = storageKey.replace(/^public[\\/]/, "");
  return path.join(process.cwd(), "public", relativePath);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error("database_seed.failed");
    await prisma.$disconnect();
    throw error;
  });
