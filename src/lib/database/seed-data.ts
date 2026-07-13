import path from "node:path";

import { blogPosts, type BlogPostPreview } from "../../content/blog-posts.ts";
import { deviceGroups, type DeviceGroup } from "../../content/devices.ts";
import { services, type ServiceItem } from "../../content/services.ts";
import { heroSlides } from "../../sections/Hero/hero-slider-data.ts";
import type { HeroSlide } from "../../sections/Hero/hero-slider-types.ts";
import {
  defaultHomepageSeo,
  defaultHomepageSections,
} from "../homepage/homepage-defaults.ts";
import type {
  HomepageSectionSeed,
  HomepageSeo,
} from "../homepage/homepage-types.ts";

export type DeviceGroupSeedRecord = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  iconKey: string;
  imageId: string | null;
  capabilities: string[];
  isFeatured: boolean;
  order: number;
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
  openGraphImageId: string | null;
  archivedAt: Date | null;
};

export type ServiceSeedRecord = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  iconKey: string;
  imageId: string | null;
  isFeatured: boolean;
  order: number;
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
  openGraphImageId: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  archivedAt: Date | null;
};

export type HeroMediaSeedRecord = {
  id: string;
  storageKey: string;
  originalName: string;
  mimeType: "image/jpeg";
  size: number;
  altText: string;
  title: string;
  description: string;
  category: "HERO";
  usageType: "IMAGE";
};

export type HeroSlideSeedRecord = {
  id: string;
  title: string;
  description: string;
  badge: string | null;
  imageId: string;
  imageAlt: string;
  linkUrl: string | null;
  linkLabel: string | null;
  objectPosition: string;
  order: number;
  isActive: boolean;
  includeInAutoplay: boolean;
};

export type HomepageSectionSeedRecord = HomepageSectionSeed;

export type HomepageSeoSeedRecord = HomepageSeo;

export type BlogCategorySeedRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  order: number;
  isActive: boolean;
  archivedAt: Date | null;
};

export type BlogPostSeedRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: Array<{
    id: string;
    type: "paragraph";
    text: string;
  }>;
  status: "DRAFT";
  categoryId: string;
  coverImageId: string | null;
  openGraphImageId: string | null;
  authorId: string | null;
  seoTitle: string;
  seoDescription: string;
  isFeatured: boolean;
  publishedAt: Date | null;
  scheduledFor: Date | null;
  archivedAt: Date | null;
};

export function getDeviceGroupSeedRecords(items: DeviceGroup[] = deviceGroups) {
  return [...items]
    .sort((first, second) => first.order - second.order)
    .map<DeviceGroupSeedRecord>((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      shortDescription: item.shortDescription,
      fullDescription: item.fullDescription,
      iconKey: item.iconKey,
      imageId: null,
      capabilities: item.capabilities,
      isFeatured: item.isFeatured,
      order: item.order,
      isActive: item.isActive,
      seoTitle: item.seoTitle,
      seoDescription: item.seoDescription,
      openGraphImageId: null,
      archivedAt: null,
    }));
}

export function getServiceSeedRecords(items: ServiceItem[] = services) {
  return [...items]
    .sort((first, second) => first.order - second.order)
    .map<ServiceSeedRecord>((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      shortDescription: item.shortDescription,
      fullDescription: item.fullDescription,
      iconKey: item.iconKey,
      imageId: null,
      isFeatured: item.isFeatured,
      order: item.order,
      isActive: item.isActive,
      seoTitle: item.seoTitle,
      seoDescription: item.seoDescription,
      openGraphImageId: null,
      ctaLabel: item.ctaLabel ?? null,
      ctaHref: item.ctaHref ?? null,
      archivedAt: null,
    }));
}

export function getHeroSeedRecords(items: HeroSlide[] = heroSlides) {
  const orderedSlides = [...items].sort(
    (first, second) => first.order - second.order
  );

  return orderedSlides.map((slide) => {
    const imageId = `hero-${slide.id}-image`;
    const storageKey = toPublicStorageKey(slide.imageSrc);

    return {
      media: {
        id: imageId,
        storageKey,
        originalName: path.basename(storageKey),
        mimeType: "image/jpeg",
        size: 0,
        altText: slide.imageAlt,
        title: slide.title,
        description: slide.description,
        category: "HERO",
        usageType: "IMAGE",
      } satisfies HeroMediaSeedRecord,
      slide: {
        id: slide.id,
        title: slide.title,
        description: slide.description,
        badge: slide.badge ?? null,
        imageId,
        imageAlt: slide.imageAlt,
        linkUrl: slide.linkUrl ?? null,
        linkLabel: slide.linkLabel ?? null,
        objectPosition: slide.objectPosition ?? "center",
        order: slide.order,
        isActive: slide.isActive,
        includeInAutoplay: slide.includeInAutoplay,
      } satisfies HeroSlideSeedRecord,
    };
  });
}

export function getHomepageSectionSeedRecords(
  items: HomepageSectionSeed[] = defaultHomepageSections
) {
  return [...items].sort((first, second) => first.order - second.order);
}

export function getHomepageSeoSeedRecord(
  item: HomepageSeo = defaultHomepageSeo
) {
  return item;
}

export function getBlogCategorySeedRecords(items: BlogPostPreview[] = blogPosts) {
  const categoryNames = Array.from(new Set(items.map((item) => item.category)));

  return categoryNames.map<BlogCategorySeedRecord>((name, index) => {
    const slug = slugifySeed(name);

    return {
      id: `blog-category-${slug}`,
      name,
      slug,
      description: `${name} konusunda teknik servis bilgi notları.`,
      seoTitle: `${name} Blog Yazıları | Orontes Teknoloji`,
      seoDescription: `${name} hakkında medikal teknik servis bilgi notları.`,
      order: index + 1,
      isActive: true,
      archivedAt: null,
    };
  });
}

export function getBlogPostSeedRecords(items: BlogPostPreview[] = blogPosts) {
  return items.map<BlogPostSeedRecord>((item, index) => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt,
    content: [
      {
        id: `seed-${item.id}-intro`,
        type: "paragraph",
        text: item.excerpt,
      },
    ],
    status: "DRAFT",
    categoryId: `blog-category-${slugifySeed(item.category)}`,
    coverImageId: null,
    openGraphImageId: null,
    authorId: null,
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    isFeatured: index < 3,
    publishedAt: null,
    scheduledFor: null,
    archivedAt: null,
  }));
}

function toPublicStorageKey(imageSrc: string) {
  return imageSrc.startsWith("/") ? `public${imageSrc}` : imageSrc;
}

function slugifySeed(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
