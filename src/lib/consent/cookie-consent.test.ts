import { describe, expect, it } from "vitest";

import {
  canRunConsentCategory,
  cookieConsentReducer,
  createAcceptAllConsent,
  createCookieConsent,
  createRejectAllConsent,
  encodeCookieConsent,
  initialCookieConsentState,
  readConsentFromCookieHeader,
  serializeConsentCookie,
  shouldShowConsentBanner,
} from "./cookie-consent";
import {
  COOKIE_CONSENT_NAME,
  COOKIE_CONSENT_VERSION,
  type CookieConsent,
} from "./cookie-consent-types";

const now = "2026-07-11T08:00:00.000Z";

function cookieHeader(consent: CookieConsent) {
  return `${COOKIE_CONSENT_NAME}=${encodeCookieConsent(consent)}`;
}

describe("cookie consent model", () => {
  it("shows the banner when no consent cookie exists", () => {
    expect(shouldShowConsentBanner("")).toBe(true);
  });

  it("accept all enables analytics and marketing", () => {
    const consent = createAcceptAllConsent(now);

    expect(consent.necessary).toBe(true);
    expect(consent.analytics).toBe(true);
    expect(consent.marketing).toBe(true);
  });

  it("reject all disables analytics and marketing", () => {
    const consent = createRejectAllConsent(now);

    expect(consent.necessary).toBe(true);
    expect(consent.analytics).toBe(false);
    expect(consent.marketing).toBe(false);
  });

  it("keeps necessary consent always true", () => {
    const consent = createCookieConsent(
      { analytics: false, marketing: false },
      now
    );

    expect(consent.necessary).toBe(true);
  });

  it("stores custom preferences correctly", () => {
    const consent = createCookieConsent(
      { analytics: true, marketing: false },
      now
    );
    const parsed = readConsentFromCookieHeader(cookieHeader(consent));

    expect(parsed).toEqual(consent);
  });

  it("prevents banner display when an existing valid consent exists", () => {
    expect(shouldShowConsentBanner(cookieHeader(createRejectAllConsent(now)))).toBe(
      false
    );
  });

  it("ignores malformed cookies safely", () => {
    expect(
      readConsentFromCookieHeader(`${COOKIE_CONSENT_NAME}=not-json`)
    ).toBeNull();
    expect(
      shouldShowConsentBanner(`${COOKIE_CONSENT_NAME}=not-json`)
    ).toBe(true);
  });

  it("shows the banner again for an old consent version", () => {
    const oldConsent = {
      ...createAcceptAllConsent(now),
      version: COOKIE_CONSENT_VERSION - 1,
    };

    expect(shouldShowConsentBanner(cookieHeader(oldConsent))).toBe(true);
  });

  it("reset consent causes the banner to reappear", () => {
    const accepted = cookieConsentReducer(initialCookieConsentState, {
      type: "save",
      consent: createAcceptAllConsent(now),
    });
    const reset = cookieConsentReducer(accepted, { type: "reset" });

    expect(reset.consent).toBeNull();
    expect(reset.isBannerVisible).toBe(true);
  });

  it("preference center opens from the footer control action", () => {
    const state = cookieConsentReducer(initialCookieConsentState, {
      type: "openPreferences",
    });

    expect(state.isPreferencesOpen).toBe(true);
  });

  it("analytics gate renders only after analytics consent", () => {
    expect(
      canRunConsentCategory(
        createCookieConsent({ analytics: false, marketing: true }, now),
        "analytics"
      )
    ).toBe(false);
    expect(
      canRunConsentCategory(
        createCookieConsent({ analytics: true, marketing: false }, now),
        "analytics"
      )
    ).toBe(true);
  });

  it("marketing gate renders only after marketing consent", () => {
    expect(
      canRunConsentCategory(
        createCookieConsent({ analytics: true, marketing: false }, now),
        "marketing"
      )
    ).toBe(false);
    expect(
      canRunConsentCategory(
        createCookieConsent({ analytics: false, marketing: true }, now),
        "marketing"
      )
    ).toBe(true);
  });

  it("serializes production-ready first-party cookie attributes", () => {
    const serialized = serializeConsentCookie(createRejectAllConsent(now), true);

    expect(serialized).toContain(`${COOKIE_CONSENT_NAME}=`);
    expect(serialized).toContain("Path=/");
    expect(serialized).toContain("Max-Age=15552000");
    expect(serialized).toContain("SameSite=Lax");
    expect(serialized).toContain("Secure");
  });
});
