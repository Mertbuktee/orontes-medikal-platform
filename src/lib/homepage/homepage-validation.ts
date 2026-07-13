import { z } from "zod";

import {
  homepageSectionKeys,
  type HomepageSectionKey,
} from "@/lib/homepage/homepage-types";

export const homepageIconKeys = [
  "ShieldCheck",
  "ClipboardCheck",
  "Cpu",
  "FileCheck2",
  "Wrench",
  "Settings",
  "PackageCheck",
  "ScanSearch",
  "Truck",
  "Stethoscope",
] as const;

export const homepageSectionKeySchema = z.enum(homepageSectionKeys);

const safeUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine(isSafeHomepageUrl, "Güvenli bir bağlantı girin.");

const nullableMediaIdSchema = z
  .string()
  .trim()
  .max(120)
  .transform((value) => value || null)
  .nullable();

const homepageItemSchema = z.object({
  title: z.string().trim().min(2).max(140),
  description: z.string().trim().min(10).max(700),
  iconKey: z.enum(homepageIconKeys),
  order: z.coerce.number().int().positive(),
  isActive: z.coerce.boolean(),
});

export const previewContentSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(700),
  itemLimit: z.coerce.number().int().min(2).max(8),
  showViewAll: z.coerce.boolean(),
  viewAllLabel: z.string().trim().min(2).max(80),
});

export const boardRepairContentSchema = z.object({
  badge: z.string().trim().min(2).max(80),
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().min(20).max(1200),
  featureItems: z.array(z.string().trim().min(2).max(140)).min(1).max(12),
  primaryCtaLabel: z.string().trim().min(2).max(80),
  primaryCtaHref: safeUrlSchema,
  secondaryCtaLabel: z.string().trim().min(2).max(80),
  secondaryCtaHref: safeUrlSchema,
  mediaId: nullableMediaIdSchema,
});

export const whyUsContentSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(20).max(1000),
  items: z
    .array(homepageItemSchema)
    .min(1)
    .max(8)
    .refine((items) => items.some((item) => item.isActive), {
      message: "En az bir aktif madde gerekir.",
    }),
});

export const processContentSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(20).max(1000),
  steps: z
    .array(homepageItemSchema)
    .min(2)
    .max(10)
    .refine((steps) => steps.filter((step) => step.isActive).length >= 2, {
      message: "En az iki aktif süreç adımı gerekir.",
    }),
});

export const finalCtaContentSchema = z.object({
  badge: z.string().trim().min(2).max(80),
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().min(20).max(1000),
  primaryLabel: z.string().trim().min(2).max(80),
  primaryHref: safeUrlSchema,
  secondaryLabel: z.string().trim().min(2).max(80),
  secondaryHref: safeUrlSchema,
  trustItems: z.array(z.string().trim().min(2).max(120)).min(1).max(6),
});

export const homepageSeoSchema = z.object({
  title: z.string().trim().min(10).max(90),
  description: z.string().trim().min(50).max(220),
  openGraphImageId: nullableMediaIdSchema,
});

export const homepageSectionBaseInputSchema = z.object({
  key: homepageSectionKeySchema,
  title: z.string().trim().min(2).max(180),
  eyebrow: z
    .string()
    .trim()
    .max(80)
    .transform((value) => value || null)
    .nullable(),
  description: z.string().trim().min(10).max(1200),
  order: z.coerce.number().int().positive(),
  isVisible: z.coerce.boolean(),
});

export const homepageReorderSchema = z.object({
  key: homepageSectionKeySchema,
  direction: z.enum(["up", "down", "first", "last"]),
});

export const homepageVisibilitySchema = z.object({
  key: homepageSectionKeySchema,
  isVisible: z.coerce.boolean(),
});

export function parseHomepageSectionContent(
  key: HomepageSectionKey,
  content: unknown
) {
  return getHomepageSectionContentSchema(key).parse(content);
}

export function getHomepageSectionContentSchema(key: HomepageSectionKey) {
  if (
    key === "SERVICES_PREVIEW" ||
    key === "DEVICES_PREVIEW" ||
    key === "BLOG_PREVIEW" ||
    key === "HERO_SUPPORTING_CONTENT"
  ) {
    return previewContentSchema;
  }

  if (key === "BOARD_REPAIR") return boardRepairContentSchema;
  if (key === "WHY_US") return whyUsContentSchema;
  if (key === "PROCESS") return processContentSchema;
  return finalCtaContentSchema;
}

export function isSafeHomepageUrl(value: string) {
  if (value.startsWith("/")) return !value.startsWith("//");
  if (value.startsWith("tel:")) return value.length > 4;
  if (value.startsWith("mailto:")) return value.includes("@");

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
