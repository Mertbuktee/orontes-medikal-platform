"use client";

import { useCookieConsent } from "./CookieConsentProvider";

export function CookieSettingsButton({
  className,
}: {
  className?: string;
}) {
  const { openPreferences } = useCookieConsent();

  return (
    <button type="button" onClick={openPreferences} className={className}>
      Çerez Tercihleri
    </button>
  );
}
