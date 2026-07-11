export const cookieConsentVersion = "2026-07-10";
export const consentCookieName = "orontes_cookie_consent";
export const consentIdCookieName = "orontes_consent_id";

export type CookieConsentPreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
};

export type CookieConsentRecord = {
  consentId: string;
  version: string;
  preferences: CookieConsentPreferences;
  createdAt: string;
};
