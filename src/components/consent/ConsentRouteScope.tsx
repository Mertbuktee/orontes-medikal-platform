"use client";

import { usePathname } from "next/navigation";

import { shouldRenderCookieConsentUi } from "@/lib/consent/consent-route-scope";

import { CookieConsentBanner } from "./CookieConsentBanner";
import { CookiePreferencesDialog } from "./CookiePreferencesDialog";

export function ConsentRouteScope() {
  const pathname = usePathname();

  if (!shouldRenderCookieConsentUi(pathname)) {
    return null;
  }

  return (
    <>
      <CookieConsentBanner />
      <CookiePreferencesDialog />
    </>
  );
}
