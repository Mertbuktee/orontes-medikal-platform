import { randomUUID } from "node:crypto";

export {
  consentCookieName,
  consentIdCookieName,
  cookieConsentVersion,
  type CookieConsentPreferences,
  type CookieConsentRecord,
} from "./cookie-consent.shared";

import {
  cookieConsentVersion,
  type CookieConsentPreferences,
  type CookieConsentRecord,
} from "./cookie-consent.shared";

export type CookieConsentInput = {
  consentId?: string;
  preferences: CookieConsentPreferences;
};

export interface CookieConsentRepository {
  save(record: CookieConsentRecord): Promise<{ id: string }>;
}

export class DevelopmentCookieConsentRepository
  implements CookieConsentRepository
{
  async save(record: CookieConsentRecord) {
    return { id: record.consentId };
  }
}

export function createCookieConsentRecord(
  input: CookieConsentInput
): CookieConsentRecord {
  return {
    consentId: input.consentId ?? randomUUID(),
    version: cookieConsentVersion,
    preferences: input.preferences,
    createdAt: new Date().toISOString(),
  };
}

export function encodeConsentCookie(record: CookieConsentRecord) {
  return Buffer.from(JSON.stringify(record), "utf8").toString("base64url");
}
