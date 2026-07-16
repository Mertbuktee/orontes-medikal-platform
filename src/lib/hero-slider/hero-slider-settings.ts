import { z } from "zod";

export const heroSliderSettingsKey = "hero.slider.settings";

export const defaultHeroSliderSettings = {
  autoplayEnabled: true,
  autoplayIntervalMs: 6_000,
  transitionDurationMs: 700,
  pauseOnHover: true,
  showPagination: true,
  showArrows: true,
  showSlideCounter: false,
} as const;

export const heroSliderSettingsSchema = z.object({
  autoplayEnabled: z.boolean(),
  autoplayIntervalMs: z.coerce.number().int().min(3_000).max(15_000),
  transitionDurationMs: z.coerce.number().int().min(200).max(1_500),
  pauseOnHover: z.boolean(),
  showPagination: z.boolean(),
  showArrows: z.boolean(),
  showSlideCounter: z.boolean().default(false),
});

export type HeroSliderSettings = z.infer<typeof heroSliderSettingsSchema>;

export function parseHeroSliderSettings(value: unknown): HeroSliderSettings {
  const parsed = heroSliderSettingsSchema.safeParse(value);
  return parsed.success ? parsed.data : defaultHeroSliderSettings;
}
