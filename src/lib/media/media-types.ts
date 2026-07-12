import type {
  MediaCategory,
  MediaUsageType,
  MediaVariantType,
} from "@prisma/client";

export const mediaCategories: readonly MediaCategory[] = [
  "GENERAL",
  "HERO",
  "DEVICE",
  "SERVICE",
  "BLOG",
  "SEO",
  "BRAND",
  "LEGAL",
];

export const mediaUsageTypes: readonly MediaUsageType[] = [
  "IMAGE",
  "DOCUMENT",
  "LOGO",
  "FAVICON",
  "OPEN_GRAPH",
];

export const mediaVariantTypes: readonly MediaVariantType[] = [
  "ORIGINAL",
  "THUMBNAIL",
  "MEDIUM",
  "LARGE",
];

export const mediaPageSizes = [24, 48, 96] as const;
