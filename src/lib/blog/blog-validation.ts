import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const blockIdSchema = z.string().min(6).max(80);

export const paragraphBlockSchema = z
  .object({
    id: blockIdSchema,
    type: z.literal("paragraph"),
    text: z.string().trim().min(1).max(4000),
  })
  .strict();

export const headingBlockSchema = z
  .object({
    id: blockIdSchema,
    type: z.literal("heading"),
    level: z.union([z.literal(2), z.literal(3)]),
    text: z.string().trim().min(2).max(180),
  })
  .strict();

export const listBlockSchema = z
  .object({
    id: blockIdSchema,
    type: z.union([z.literal("bulletList"), z.literal("numberedList")]),
    items: z.array(z.string().trim().min(1).max(500)).min(1).max(30),
  })
  .strict();

export const quoteBlockSchema = z
  .object({
    id: blockIdSchema,
    type: z.literal("quote"),
    text: z.string().trim().min(2).max(1500),
    attribution: z.string().trim().max(160).optional(),
  })
  .strict();

export const imageBlockSchema = z
  .object({
    id: blockIdSchema,
    type: z.literal("image"),
    mediaId: z.string().min(1),
    altText: z.string().trim().min(5).max(300),
    caption: z.string().trim().max(300).optional(),
  })
  .strict();

export const calloutBlockSchema = z
  .object({
    id: blockIdSchema,
    type: z.literal("callout"),
    tone: z.enum(["info", "warning", "success"]),
    title: z.string().trim().max(120).optional(),
    text: z.string().trim().min(2).max(1200),
  })
  .strict();

export const dividerBlockSchema = z
  .object({
    id: blockIdSchema,
    type: z.literal("divider"),
  })
  .strict();

export const blogContentBlockSchema = z.discriminatedUnion("type", [
  paragraphBlockSchema,
  headingBlockSchema,
  listBlockSchema,
  quoteBlockSchema,
  imageBlockSchema,
  calloutBlockSchema,
  dividerBlockSchema,
]);

export const blogContentSchema = z
  .array(blogContentBlockSchema)
  .min(1)
  .max(200)
  .refine(
    (blocks) => blocks.some((block) => block.type !== "divider"),
    "Article content must contain at least one meaningful block."
  );

export const blogSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(180)
  .regex(slugPattern, "Slug must be lowercase and URL-safe.");

export const blogPostInputSchema = z
  .object({
    title: z.string().trim().min(5).max(200),
    slug: blogSlugSchema,
    excerpt: z.string().trim().min(40).max(500),
    content: blogContentSchema,
    categoryId: z.string().min(1).nullable(),
    coverImageId: z.string().min(1).nullable(),
    openGraphImageId: z.string().min(1).nullable(),
    authorId: z.string().min(1).nullable(),
    seoTitle: z.string().trim().min(5).max(180),
    seoDescription: z.string().trim().min(20).max(320),
    isFeatured: z.boolean(),
    scheduledFor: z.date().nullable(),
  })
  .strict();

export const publishPostInputSchema = z
  .object({
    id: z.string().min(1),
  })
  .strict();

export const schedulePostInputSchema = z
  .object({
    id: z.string().min(1),
    scheduledFor: z.date().min(new Date(Date.now() + 60_000)),
  })
  .strict();

export const blogCategoryInputSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    slug: blogSlugSchema.max(160),
    description: z.string().trim().max(1000),
    seoTitle: z.string().trim().max(180),
    seoDescription: z.string().trim().max(320),
    order: z.coerce.number().int().min(1).max(9999),
    isActive: z.boolean(),
  })
  .strict();

export const blogListSearchSchema = z.object({
  query: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "all"]).optional(),
  categoryId: z.string().optional(),
});

export function createBlogSlug(value: string) {
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
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 180);
}

export function createBlogBlockId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `block-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
