import { describe, expect, it } from "vitest";

import type { HeroSlide } from "./hero-slider-types";
import {
  createHeroSliderState,
  heroSliderReducer,
} from "./hero-slider-state";
import {
  getSlideIndicator,
  getVisibleHeroSlides,
  heroSliderAutoplayMs,
  shouldAutoplay,
  shouldPrioritizeSlide,
} from "./hero-slider-utils";

const slides: HeroSlide[] = [
  {
    id: "third",
    title: "Third",
    description: "Third description",
    imageSrc: "/third.jpg",
    imageAlt: "Third alt",
    order: 3,
    isActive: true,
    includeInAutoplay: true,
  },
  {
    id: "inactive",
    title: "Inactive",
    description: "Inactive description",
    imageSrc: "/inactive.jpg",
    imageAlt: "Inactive alt",
    order: 2,
    isActive: false,
    includeInAutoplay: true,
  },
  {
    id: "first",
    title: "First",
    description: "First description",
    imageSrc: "/first.jpg",
    imageAlt: "First alt",
    order: 1,
    isActive: true,
    includeInAutoplay: true,
  },
  {
    id: "manual-only",
    title: "Manual",
    description: "Manual description",
    imageSrc: "/manual.jpg",
    imageAlt: "Manual alt",
    order: 4,
    isActive: true,
    includeInAutoplay: false,
  },
];

describe("Hero service slider", () => {
  it("renders the first active slide from sorted data", () => {
    const visibleSlides = getVisibleHeroSlides(slides);
    const state = createHeroSliderState(visibleSlides);

    expect(state.currentId).toBe("first");
  });

  it("filters inactive slides", () => {
    expect(getVisibleHeroSlides(slides).map((slide) => slide.id)).not.toContain(
      "inactive"
    );
  });

  it("sorts slides by order", () => {
    expect(getVisibleHeroSlides(slides).map((slide) => slide.id)).toEqual([
      "first",
      "third",
      "manual-only",
    ]);
  });

  it("next control changes slide", () => {
    const visibleSlides = getVisibleHeroSlides(slides);
    const next = heroSliderReducer(createHeroSliderState(visibleSlides), {
      type: "next",
      slides: visibleSlides,
    });

    expect(next.currentId).toBe("third");
  });

  it("previous control changes slide", () => {
    const visibleSlides = getVisibleHeroSlides(slides);
    const previous = heroSliderReducer(createHeroSliderState(visibleSlides), {
      type: "previous",
      slides: visibleSlides,
    });

    expect(previous.currentId).toBe("manual-only");
  });

  it("pagination dot changes slide", () => {
    const visibleSlides = getVisibleHeroSlides(slides);
    const next = heroSliderReducer(createHeroSliderState(visibleSlides), {
      type: "goTo",
      slides: visibleSlides,
      index: 2,
    });

    expect(next.currentId).toBe("manual-only");
  });

  it("autoplay advances after approximately 6 seconds", () => {
    expect(heroSliderAutoplayMs).toBe(6_000);
  });

  it("hover pauses autoplay", () => {
    expect(
      shouldAutoplay({
        slideCount: 2,
        isPaused: true,
        prefersReducedMotion: false,
        isDocumentHidden: false,
      })
    ).toBe(false);
  });

  it("focus pauses autoplay", () => {
    expect(
      shouldAutoplay({
        slideCount: 2,
        isPaused: true,
        prefersReducedMotion: false,
        isDocumentHidden: false,
      })
    ).toBe(false);
  });

  it("visibility change pauses autoplay", () => {
    expect(
      shouldAutoplay({
        slideCount: 2,
        isPaused: false,
        prefersReducedMotion: false,
        isDocumentHidden: true,
      })
    ).toBe(false);
  });

  it("reduced-motion disables autoplay", () => {
    expect(
      shouldAutoplay({
        slideCount: 2,
        isPaused: false,
        prefersReducedMotion: true,
        isDocumentHidden: false,
      })
    ).toBe(false);
  });

  it("slides excluded from autoplay are skipped during automatic rotation", () => {
    const visibleSlides = getVisibleHeroSlides(slides);
    const manualState = heroSliderReducer(createHeroSliderState(visibleSlides), {
      type: "goTo",
      slides: visibleSlides,
      index: 1,
    });
    const autoplayState = heroSliderReducer(manualState, {
      type: "autoplay",
      slides: visibleSlides,
    });

    expect(autoplayState.currentId).toBe("first");
  });

  it("manual navigation can still reach active slides excluded from autoplay", () => {
    const visibleSlides = getVisibleHeroSlides(slides);
    const state = heroSliderReducer(createHeroSliderState(visibleSlides), {
      type: "goTo",
      slides: visibleSlides,
      index: 2,
    });

    expect(state.currentId).toBe("manual-only");
  });

  it("missing image failure does not crash the slider state", () => {
    const visibleSlides = getVisibleHeroSlides(slides);
    const state = heroSliderReducer(createHeroSliderState(visibleSlides), {
      type: "imageError",
      slideId: "first",
    });

    expect(state.failedImageIds).toEqual(["first"]);
    expect(state.currentId).toBe("first");
  });

  it("current slide indicator updates correctly", () => {
    expect(getSlideIndicator(0, 5)).toBe("01 / 05");
    expect(getSlideIndicator(4, 5)).toBe("05 / 05");
  });

  it("only the first initial image receives priority behavior", () => {
    const visibleSlides = getVisibleHeroSlides(slides);

    expect(shouldPrioritizeSlide(visibleSlides[0], visibleSlides)).toBe(true);
    expect(shouldPrioritizeSlide(visibleSlides[1], visibleSlides)).toBe(false);
  });
});
