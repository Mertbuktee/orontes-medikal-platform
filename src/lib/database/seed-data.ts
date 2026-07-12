import path from "node:path";

import { deviceGroups, type DeviceGroup } from "../../content/devices.ts";
import { services, type ServiceItem } from "../../content/services.ts";
import { heroSlides } from "../../sections/Hero/hero-slider-data.ts";
import type { HeroSlide } from "../../sections/Hero/hero-slider-types.ts";

export type DeviceGroupSeedRecord = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  iconKey: string;
  capabilities: string[];
  isFeatured: boolean;
  order: number;
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
};

export type ServiceSeedRecord = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  iconKey: string;
  isFeatured: boolean;
  order: number;
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
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
      capabilities: item.capabilities,
      isFeatured: item.isFeatured,
      order: item.order,
      isActive: item.isActive,
      seoTitle: item.seoTitle,
      seoDescription: item.seoDescription,
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
      isFeatured: item.isFeatured,
      order: item.order,
      isActive: item.isActive,
      seoTitle: item.seoTitle,
      seoDescription: item.seoDescription,
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

function toPublicStorageKey(imageSrc: string) {
  return imageSrc.startsWith("/") ? `public${imageSrc}` : imageSrc;
}
