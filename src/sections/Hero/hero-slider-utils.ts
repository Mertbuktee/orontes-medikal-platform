import type { HeroSlide } from "./hero-slider-types";

export const heroSliderAutoplayMs = 6_000;
export const heroSliderTransitionMs = 700;

export function getVisibleHeroSlides(slides: HeroSlide[]) {
  return [...slides]
    .filter((slide) => slide.isActive)
    .sort((a, b) => a.order - b.order);
}

export function getAutoplayHeroSlides(slides: HeroSlide[]) {
  return getVisibleHeroSlides(slides).filter((slide) => slide.includeInAutoplay);
}

export function findSlideIndex(slides: HeroSlide[], slideId: string) {
  return Math.max(
    0,
    slides.findIndex((slide) => slide.id === slideId)
  );
}

export function getNextSlideId(slides: HeroSlide[], currentId: string) {
  if (slides.length === 0) {
    return null;
  }

  const currentIndex = findSlideIndex(slides, currentId);
  return slides[(currentIndex + 1) % slides.length].id;
}

export function getPreviousSlideId(slides: HeroSlide[], currentId: string) {
  if (slides.length === 0) {
    return null;
  }

  const currentIndex = findSlideIndex(slides, currentId);
  return slides[(currentIndex - 1 + slides.length) % slides.length].id;
}

export function getPaginationSlideId(slides: HeroSlide[], index: number) {
  return slides[index]?.id ?? null;
}

export function getNextAutoplaySlideId(slides: HeroSlide[], currentId: string) {
  const visibleSlides = getVisibleHeroSlides(slides);
  const autoplaySlides = visibleSlides.filter((slide) => slide.includeInAutoplay);

  if (autoplaySlides.length === 0) {
    return null;
  }

  const currentVisibleIndex = findSlideIndex(visibleSlides, currentId);

  for (let offset = 1; offset <= visibleSlides.length; offset += 1) {
    const candidate =
      visibleSlides[(currentVisibleIndex + offset) % visibleSlides.length];

    if (candidate.includeInAutoplay) {
      return candidate.id;
    }
  }

  return autoplaySlides[0].id;
}

export function shouldAutoplay({
  slideCount,
  isPaused,
  prefersReducedMotion,
  isDocumentHidden,
}: {
  slideCount: number;
  isPaused: boolean;
  prefersReducedMotion: boolean;
  isDocumentHidden: boolean;
}) {
  return slideCount > 1 && !isPaused && !prefersReducedMotion && !isDocumentHidden;
}

export function shouldPrioritizeSlide(slide: HeroSlide, visibleSlides: HeroSlide[]) {
  return visibleSlides[0]?.id === slide.id;
}

export function getSlideIndicator(index: number, total: number) {
  const current = String(index + 1).padStart(2, "0");
  const count = String(total).padStart(2, "0");

  return `${current} / ${count}`;
}
