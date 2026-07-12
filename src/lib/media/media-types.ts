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

export const mediaCategoryLabels: Record<MediaCategory, string> = {
  GENERAL: "Genel",
  HERO: "Ana Sayfa Slider",
  DEVICE: "Cihaz Grupları",
  SERVICE: "Hizmetler",
  BLOG: "Blog",
  SEO: "SEO / Paylaşım",
  BRAND: "Logo ve Marka",
  LEGAL: "Yasal Sayfalar",
};

export const mediaUsageTypeLabels: Record<MediaUsageType, string> = {
  IMAGE: "Görsel",
  DOCUMENT: "Doküman",
  LOGO: "Logo",
  FAVICON: "Favicon",
  OPEN_GRAPH: "Sosyal Paylaşım Görseli",
};

export const mediaVariantLabels: Record<MediaVariantType, string> = {
  ORIGINAL: "Orijinal",
  THUMBNAIL: "Küçük Önizleme",
  MEDIUM: "Orta Boy",
  LARGE: "Büyük Boy",
};
