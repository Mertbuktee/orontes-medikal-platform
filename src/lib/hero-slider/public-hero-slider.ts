import { prisma } from "@/lib/database/prisma";
import { PrismaHeroSlideRepository } from "@/lib/database/repositories/hero-slides";
import { defaultHeroSliderSettings } from "@/lib/hero-slider/hero-slider-settings";

export async function getPublicHeroSliderData() {
  try {
    const repository = new PrismaHeroSlideRepository(prisma);
    const [slides, settings] = await Promise.all([
      repository.listPublicActiveSlides(),
      repository.getSliderSettings(),
    ]);

    return { slides, settings };
  } catch {
    console.error("hero_slider.public_load_failed");
    return { slides: [], settings: defaultHeroSliderSettings };
  }
}
