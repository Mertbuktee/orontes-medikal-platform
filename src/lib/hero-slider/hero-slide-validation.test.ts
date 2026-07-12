import { describe, expect, it } from "vitest";

import {
  heroSlideInputSchema,
  isSafeHeroLink,
} from "./hero-slide-validation";
import { heroSliderSettingsSchema } from "./hero-slider-settings";

const validSlideInput = {
  badge: "SERVİS",
  title: "Hassas servis görseli",
  description: "Hero slider için yeterli uzunlukta açıklama.",
  imageId: "media-1",
  imageAlt: "Teknik servis görseli açıklaması",
  linkLabel: "İncele",
  linkUrl: "/hizmetler",
  objectPosition: "center",
  order: 1,
  isActive: true,
  includeInAutoplay: true,
};

describe("Hero slide validation", () => {
  it("accepts valid slide input", () => {
    expect(heroSlideInputSchema.safeParse(validSlideInput).success).toBe(true);
  });

  it("rejects unsafe link protocols", () => {
    expect(isSafeHeroLink("javascript:alert(1)")).toBe(false);
    expect(isSafeHeroLink("data:text/html,test")).toBe(false);
    expect(isSafeHeroLink("/hizmetler")).toBe(true);
    expect(isSafeHeroLink("https://orontesteknoloji.com/hizmetler")).toBe(true);
  });

  it("requires link label and URL together", () => {
    const parsed = heroSlideInputSchema.safeParse({
      ...validSlideInput,
      linkLabel: "İncele",
      linkUrl: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects invalid object positions", () => {
    const parsed = heroSlideInputSchema.safeParse({
      ...validSlideInput,
      objectPosition: "20px 30px",
    });

    expect(parsed.success).toBe(false);
  });

  it("validates slider setting bounds", () => {
    expect(
      heroSliderSettingsSchema.safeParse({
        autoplayEnabled: true,
        autoplayIntervalMs: 6_000,
        transitionDurationMs: 700,
        pauseOnHover: true,
        showPagination: true,
        showArrows: true,
      }).success
    ).toBe(true);
    expect(
      heroSliderSettingsSchema.safeParse({
        autoplayEnabled: true,
        autoplayIntervalMs: 1_000,
        transitionDurationMs: 700,
        pauseOnHover: true,
        showPagination: true,
        showArrows: true,
      }).success
    ).toBe(false);
    expect(
      heroSliderSettingsSchema.safeParse({
        autoplayEnabled: true,
        autoplayIntervalMs: 6_000,
        transitionDurationMs: 5_000,
        pauseOnHover: true,
        showPagination: true,
        showArrows: true,
      }).success
    ).toBe(false);
  });
});
