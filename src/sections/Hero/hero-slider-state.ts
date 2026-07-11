import type { HeroSlide } from "./hero-slider-types";
import {
  getNextAutoplaySlideId,
  getNextSlideId,
  getPaginationSlideId,
  getPreviousSlideId,
} from "./hero-slider-utils";

export type HeroSliderState = {
  currentId: string;
  failedImageIds: string[];
};

export type HeroSliderAction =
  | { type: "next"; slides: HeroSlide[] }
  | { type: "previous"; slides: HeroSlide[] }
  | { type: "goTo"; slides: HeroSlide[]; index: number }
  | { type: "autoplay"; slides: HeroSlide[] }
  | { type: "imageError"; slideId: string };

export function createHeroSliderState(slides: HeroSlide[]): HeroSliderState {
  return {
    currentId: slides[0]?.id ?? "",
    failedImageIds: [],
  };
}

export function heroSliderReducer(
  state: HeroSliderState,
  action: HeroSliderAction
): HeroSliderState {
  switch (action.type) {
    case "next":
      return {
        ...state,
        currentId: getNextSlideId(action.slides, state.currentId) ?? state.currentId,
      };
    case "previous":
      return {
        ...state,
        currentId:
          getPreviousSlideId(action.slides, state.currentId) ?? state.currentId,
      };
    case "goTo":
      return {
        ...state,
        currentId:
          getPaginationSlideId(action.slides, action.index) ?? state.currentId,
      };
    case "autoplay":
      return {
        ...state,
        currentId:
          getNextAutoplaySlideId(action.slides, state.currentId) ??
          state.currentId,
      };
    case "imageError":
      if (state.failedImageIds.includes(action.slideId)) {
        return state;
      }

      return {
        ...state,
        failedImageIds: [...state.failedImageIds, action.slideId],
      };
    default:
      return state;
  }
}
