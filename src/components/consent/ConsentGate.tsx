"use client";

import type { ReactNode } from "react";

import { canRunConsentCategory } from "@/lib/consent/cookie-consent";
import type { CookieConsentCategory } from "@/lib/consent/cookie-consent-types";

import { useCookieConsent } from "./CookieConsentProvider";

function ConsentGate({
  category,
  children,
}: {
  category: CookieConsentCategory;
  children: ReactNode;
}) {
  const { consent } = useCookieConsent();

  if (!canRunConsentCategory(consent, category)) {
    return null;
  }

  return <>{children}</>;
}

export function AnalyticsConsentGate({ children }: { children: ReactNode }) {
  return <ConsentGate category="analytics">{children}</ConsentGate>;
}

export function MarketingConsentGate({ children }: { children: ReactNode }) {
  return <ConsentGate category="marketing">{children}</ConsentGate>;
}
