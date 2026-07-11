export const COOKIE_CONSENT_VERSION = 1;
export const COOKIE_CONSENT_NAME = "orontes_cookie_consent";
export const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export type CookieConsentCategory = "analytics" | "marketing";

export type CookieConsent = {
  version: number;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

export type CookieConsentPreferences = Pick<
  CookieConsent,
  "analytics" | "marketing"
>;

export type CookieConsentState = {
  consent: CookieConsent | null;
  isInitialized: boolean;
  isBannerVisible: boolean;
  isPreferencesOpen: boolean;
};

export type CookieConsentAction =
  | { type: "initialize"; consent: CookieConsent | null }
  | { type: "openPreferences" }
  | { type: "closePreferences" }
  | { type: "save"; consent: CookieConsent }
  | { type: "reset" };
