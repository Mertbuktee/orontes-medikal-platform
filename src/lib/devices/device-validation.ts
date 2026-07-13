import { z } from "zod";

import {
  deviceCapabilityLabels,
  deviceIconKeys,
} from "@/lib/devices/device-registry";

const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

export const deviceSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const deviceGroupInputSchema = z
  .object({
    title: z.string().trim().min(2).max(150),
    slug: deviceSlugSchema,
    shortDescription: z.string().trim().min(20).max(400),
    fullDescription: z.string().trim().min(50).max(5000),
    iconKey: z.enum(deviceIconKeys),
    imageId: optionalId,
    openGraphImageId: optionalId,
    capabilities: z
      .array(z.enum(deviceCapabilityLabels))
      .min(1)
      .max(deviceCapabilityLabels.length),
    isFeatured: z.coerce.boolean(),
    isActive: z.coerce.boolean(),
    order: z.coerce.number().int().min(1).max(999),
    seoTitle: z.string().trim().min(2).max(180),
    seoDescription: z.string().trim().min(20).max(320),
  })
  .strict();

export type DeviceGroupInput = z.infer<typeof deviceGroupInputSchema>;

export function createDeviceSlug(input: string) {
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

export const deviceListQuerySchema = z.object({
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
  capability: z.enum(deviceCapabilityLabels).optional(),
  sort: z.enum(["order", "newest", "oldest"]).default("order"),
});

export type DeviceListQuery = z.infer<typeof deviceListQuerySchema>;
