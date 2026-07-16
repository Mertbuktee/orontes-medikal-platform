"use client";

import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import Image from "next/image";
import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
} from "react";

import {
  defaultHeroSliderSettings,
  type HeroSliderSettings,
} from "@/lib/hero-slider/hero-slider-settings";

import {
  createHeroSliderState,
  heroSliderReducer,
} from "./hero-slider-state";
import type { HeroSlide } from "./hero-slider-types";
import {
  getSlideIndicator,
  getVisibleHeroSlides,
  shouldAutoplay,
  shouldPrioritizeSlide,
} from "./hero-slider-utils";

const imageSizes =
  "(max-width: 768px) calc(100vw - 32px), (max-width: 1280px) 48vw, 600px";

export function HeroServiceSlider({
  slides,
  settings = defaultHeroSliderSettings,
}: {
  slides: HeroSlide[];
  settings?: HeroSliderSettings;
}) {
  const visibleSlides = useMemo(() => getVisibleHeroSlides(slides), [slides]);
  const [state, dispatch] = useReducer(
    heroSliderReducer,
    visibleSlides,
    createHeroSliderState
  );
  const [isPointerPaused, setIsPointerPaused] = useState(false);
  const [isFocusPaused, setIsFocusPaused] = useState(false);
  const [isDocumentHidden, setIsDocumentHidden] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const stateRef = useRef(state);
  const slidesRef = useRef(visibleSlides);
  const canAutoplay =
    settings.autoplayEnabled &&
    shouldAutoplay({
      slideCount: visibleSlides.filter((slide) => slide.includeInAutoplay)
        .length,
      isPaused: (settings.pauseOnHover && isPointerPaused) || isFocusPaused,
      prefersReducedMotion,
      isDocumentHidden,
    });

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    slidesRef.current = visibleSlides;
  }, [visibleSlides]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const updateVisibility = () =>
      setIsDocumentHidden(document.visibilityState === "hidden");

    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);

    return () =>
      document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (!canAutoplay) {
      return;
    }

    const intervalId = window.setInterval(() => {
      dispatch({ type: "autoplay", slides: slidesRef.current });
    }, settings.autoplayIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [canAutoplay, settings.autoplayIntervalMs]);

  const currentIndex = Math.max(
    0,
    visibleSlides.findIndex((slide) => slide.id === state.currentId)
  );
  const currentSlide = visibleSlides[currentIndex] ?? visibleSlides[0];

  if (!currentSlide) {
    return null;
  }

  function handleFocus(event: FocusEvent<HTMLElement>) {
    if (event.currentTarget.contains(event.target)) {
      setIsFocusPaused(true);
    }
  }

  function handleBlur(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsFocusPaused(false);
    }
  }

  return (
    <section
      aria-label="Medikal teknik servis görselleri"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsPointerPaused(true)}
      onMouseLeave={() => setIsPointerPaused(false)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className="relative"
    >
      <div className="absolute inset-4 -z-10 rounded-[2rem] bg-[linear-gradient(rgba(14,165,233,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.08)_1px,transparent_1px)] bg-size-[22px_22px]" />
      <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-slate-950 shadow-2xl shadow-slate-900/15 ring-1 ring-sky-200/40">
        <div className="relative h-[390px] sm:aspect-[5/4] sm:h-auto sm:min-h-[420px] lg:aspect-[4/5] xl:aspect-[5/4]">
          {visibleSlides.map((slide) => {
            const isCurrent = slide.id === currentSlide.id;
            const hasImageFailed = state.failedImageIds.includes(slide.id);

            return (
              <article
                key={slide.id}
                aria-hidden={!isCurrent}
                className={`absolute inset-0 transition ease-out ${
                  isCurrent
                    ? "z-10 translate-x-0 opacity-100"
                    : "z-0 translate-x-4 opacity-0"
                }`}
                style={{
                  transitionDuration: `${settings.transitionDurationMs}ms`,
                }}
              >
                {hasImageFailed ? (
                  <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,0.22),transparent_34%),linear-gradient(135deg,#082f49,#0f172a_62%,#431407)] text-slate-200">
                    <ImageOff
                      className="size-12 text-orange-300"
                      aria-hidden="true"
                    />
                  </div>
                ) : (
                  <Image
                    src={slide.imageSrc}
                    alt={slide.imageAlt}
                    fill
                    sizes={imageSizes}
                    priority={shouldPrioritizeSlide(slide, visibleSlides)}
                    loading={
                      shouldPrioritizeSlide(slide, visibleSlides)
                        ? undefined
                        : "lazy"
                    }
                    className="object-cover"
                    style={{ objectPosition: slide.objectPosition ?? "center" }}
                    onError={() =>
                      dispatch({ type: "imageError", slideId: slide.id })
                    }
                  />
                )}
              </article>
            );
          })}

          <div className="absolute inset-0 z-20 bg-[linear-gradient(180deg,rgba(2,6,23,0.04)_0%,rgba(2,6,23,0.24)_42%,rgba(2,6,23,0.88)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 z-30 p-4 text-white sm:p-6">
            {currentSlide.badge || settings.showSlideCounter ? (
              <div className="mb-4 flex items-center justify-between gap-3">
                {currentSlide.badge ? (
                  <span className="rounded-full border border-orange-300/40 bg-orange-500/15 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-orange-100 backdrop-blur">
                    {currentSlide.badge}
                  </span>
                ) : (
                  <span aria-hidden="true" />
                )}
                {settings.showSlideCounter ? (
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    {getSlideIndicator(currentIndex, visibleSlides.length)}
                  </span>
                ) : null}
              </div>
            ) : null}
            <h2 className="max-w-xl text-2xl font-semibold leading-tight sm:text-3xl">
              {currentSlide.title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200 sm:text-base">
              {currentSlide.description}
            </p>
          </div>

          {settings.showArrows && visibleSlides.length > 1 ? (
            <div className="absolute inset-x-4 top-4 z-30 flex justify-between">
              <SliderButton
                label="Önceki servis görseli"
                onClick={() =>
                  dispatch({ type: "previous", slides: visibleSlides })
                }
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </SliderButton>
              <SliderButton
                label="Sonraki servis görseli"
                onClick={() => dispatch({ type: "next", slides: visibleSlides })}
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </SliderButton>
            </div>
          ) : null}
        </div>

        {settings.showPagination && visibleSlides.length > 1 ? (
          <div className="flex items-center justify-center gap-2 border-t border-white/10 bg-slate-950/95 px-4 py-3">
            {visibleSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`${index + 1}. servis görseline git`}
                aria-current={slide.id === currentSlide.id ? "true" : undefined}
                onClick={() =>
                  dispatch({ type: "goTo", slides: visibleSlides, index })
                }
                className={`min-h-11 min-w-11 rounded-full px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
                  slide.id === currentSlide.id
                    ? "text-orange-300"
                    : "text-slate-500"
                }`}
              >
                <span
                  className={`block h-2 rounded-full transition-all ${
                    slide.id === currentSlide.id
                      ? "w-8 bg-orange-400"
                      : "w-2 bg-slate-500"
                  }`}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <p className="sr-only" aria-live="polite">
        {`Gösterilen servis görseli: ${currentSlide.title}`}
      </p>
    </section>
  );
}

function SliderButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-full border border-white/15 bg-slate-950/45 text-white shadow-lg backdrop-blur transition hover:border-orange-300/50 hover:bg-orange-500/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
    >
      {children}
    </button>
  );
}
