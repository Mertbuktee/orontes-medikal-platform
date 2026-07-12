import { z } from "zod";

export const heroObjectPositions = [
  "center",
  "top",
  "bottom",
  "left",
  "right",
  "center top",
  "center bottom",
] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

export const heroSlideInputSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    badge: optionalText(80),
    title: z.string().trim().min(2).max(150),
    description: z.string().trim().min(10).max(500),
    imageId: z.string().trim().min(1),
    imageAlt: z.string().trim().min(5).max(300),
    linkLabel: optionalText(120),
    linkUrl: optionalText(500),
    objectPosition: z.enum(heroObjectPositions),
    order: z.coerce.number().int().min(1).max(999),
    isActive: z.coerce.boolean(),
    includeInAutoplay: z.coerce.boolean(),
  })
  .superRefine((value, context) => {
    if (
      (value.linkLabel && !value.linkUrl) ||
      (!value.linkLabel && value.linkUrl)
    ) {
      context.addIssue({
        code: "custom",
        path: ["linkUrl"],
        message: "Bağlantı etiketi ve URL birlikte girilmelidir.",
      });
    }

    if (value.linkUrl && !isSafeHeroLink(value.linkUrl)) {
      context.addIssue({
        code: "custom",
        path: ["linkUrl"],
        message: "Güvenli bir iç bağlantı veya HTTPS URL girin.",
      });
    }
  });

export type HeroSlideInput = z.infer<typeof heroSlideInputSchema>;

export function isSafeHeroLink(url: string) {
  if (url.startsWith("/")) {
    return !url.startsWith("//");
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}
