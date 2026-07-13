import { z } from "zod";

import { serviceIconKeys } from "@/lib/services/service-registry";

const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

export const serviceSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const safeHrefSchema = z
  .string()
  .trim()
  .max(300)
  .refine((value) => {
    if (!value) return true;
    if (value.startsWith("/")) return !value.startsWith("//");

    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  });

export const serviceInputSchema = z
  .object({
    title: z.string().trim().min(2).max(150),
    slug: serviceSlugSchema,
    shortDescription: z.string().trim().min(20).max(400),
    fullDescription: z.string().trim().min(50).max(5000),
    iconKey: z.enum(serviceIconKeys),
    imageId: optionalId,
    openGraphImageId: optionalId,
    isFeatured: z.coerce.boolean(),
    isActive: z.coerce.boolean(),
    order: z.coerce.number().int().min(1).max(999),
    seoTitle: z.string().trim().min(2).max(180),
    seoDescription: z.string().trim().min(20).max(320),
    ctaLabel: optionalText(120),
    ctaHref: safeHrefSchema
      .optional()
      .transform((value) => (value ? value : null)),
  })
  .strict()
  .superRefine((value, context) => {
    if ((value.ctaLabel && !value.ctaHref) || (!value.ctaLabel && value.ctaHref)) {
      context.addIssue({
        code: "custom",
        path: ["ctaHref"],
        message: "CTA etiketi ve bağlantısı birlikte girilmelidir.",
      });
    }
  });

export type ServiceInput = z.infer<typeof serviceInputSchema>;

export function createServiceSlug(input: string) {
  return input
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export const serviceListQuerySchema = z.object({
  query: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .refine((value): value is 20 | 50 | 100 =>
      [20, 50, 100].includes(value as 20 | 50 | 100)
    )
    .default(20),
  active: z.enum(["all", "active", "inactive"]).default("all"),
  featured: z.enum(["all", "featured", "not-featured"]).default("all"),
  archived: z.enum(["active", "archived", "all"]).default("active"),
  sort: z.enum(["order", "newest", "oldest"]).default("order"),
});

export type ServiceListQuery = z.infer<typeof serviceListQuerySchema>;
