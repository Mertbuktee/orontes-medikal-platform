import {
  COOKIE_CONSENT_MAX_AGE_SECONDS,
  COOKIE_CONSENT_NAME,
  COOKIE_CONSENT_VERSION,
  type CookieConsent,
  type CookieConsentAction,
  type CookieConsentCategory,
  type CookieConsentPreferences,
  type CookieConsentState,
} from "./cookie-consent-types";

const expiredCookieDate = "Thu, 01 Jan 1970 00:00:00 GMT";

export const defaultCookiePreferences: CookieConsentPreferences = {
  analytics: false,
  marketing: false,
};

export const initialCookieConsentState: CookieConsentState = {
  consent: null,
  isInitialized: false,
  isBannerVisible: false,
  isPreferencesOpen: false,
};

export function createCookieConsent(
  preferences: CookieConsentPreferences,
  updatedAt = new Date().toISOString()
): CookieConsent {
  return {
    version: COOKIE_CONSENT_VERSION,
    necessary: true,
    analytics: preferences.analytics,
    marketing: preferences.marketing,
    updatedAt,
  };
}

export function createAcceptAllConsent(updatedAt?: string): CookieConsent {
  return createCookieConsent({ analytics: true, marketing: true }, updatedAt);
}

export function createRejectAllConsent(updatedAt?: string): CookieConsent {
  return createCookieConsent(defaultCookiePreferences, updatedAt);
}

export function isValidCookieConsent(value: unknown): value is CookieConsent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<CookieConsent>;

  return (
    record.version === COOKIE_CONSENT_VERSION &&
    record.necessary === true &&
    typeof record.analytics === "boolean" &&
    typeof record.marketing === "boolean" &&
    typeof record.updatedAt === "string" &&
    !Number.isNaN(Date.parse(record.updatedAt))
  );
}

export function encodeCookieConsent(consent: CookieConsent): string {
  return encodeURIComponent(JSON.stringify(consent));
}

export function parseCookieConsentValue(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded) as unknown;
    return isValidCookieConsent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function getCookieValue(cookieHeader: string, name: string) {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function readConsentFromCookieHeader(cookieHeader: string) {
  return parseCookieConsentValue(getCookieValue(cookieHeader, COOKIE_CONSENT_NAME));
}

export function shouldShowConsentBanner(cookieHeader: string) {
  return readConsentFromCookieHeader(cookieHeader) === null;
}

export function serializeConsentCookie(
  consent: CookieConsent,
  secure = process.env.NODE_ENV === "production"
) {
  const attributes = [
    `${COOKIE_CONSENT_NAME}=${encodeCookieConsent(consent)}`,
    "Path=/",
    `Max-Age=${COOKIE_CONSENT_MAX_AGE_SECONDS}`,
    "SameSite=Lax",
  ];

  if (secure) {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}

export function serializeExpiredConsentCookie() {
  return `${COOKIE_CONSENT_NAME}=; Path=/; Expires=${expiredCookieDate}; SameSite=Lax`;
}

export function cookieConsentReducer(
  state: CookieConsentState,
  action: CookieConsentAction
): CookieConsentState {
  switch (action.type) {
    case "initialize":
      return {
        ...state,
        consent: action.consent,
        isInitialized: true,
        isBannerVisible: action.consent === null,
      };
    case "openPreferences":
      return { ...state, isPreferencesOpen: true };
    case "closePreferences":
      return { ...state, isPreferencesOpen: false };
    case "save":
      return {
        consent: action.consent,
        isInitialized: true,
        isBannerVisible: false,
        isPreferencesOpen: false,
      };
    case "reset":
      return {
        consent: null,
        isInitialized: true,
        isBannerVisible: true,
        isPreferencesOpen: false,
      };
    default:
      return state;
  }
}

export function canRunConsentCategory(
  consent: CookieConsent | null,
  category: CookieConsentCategory
) {
  return consent?.[category] === true;
}
