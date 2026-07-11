"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  cookieConsentReducer,
  createAcceptAllConsent,
  createCookieConsent,
  createRejectAllConsent,
  initialCookieConsentState,
  readConsentFromCookieHeader,
  serializeConsentCookie,
  serializeExpiredConsentCookie,
} from "@/lib/consent/cookie-consent";
import type {
  CookieConsent,
  CookieConsentPreferences,
  CookieConsentState,
} from "@/lib/consent/cookie-consent-types";

type CookieConsentContextValue = CookieConsentState & {
  acceptAll: () => void;
  rejectAll: () => void;
  updatePreferences: (preferences: CookieConsentPreferences) => void;
  resetConsent: () => void;
  openPreferences: () => void;
  closePreferences: () => void;
};

const CookieConsentContext =
  createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    cookieConsentReducer,
    initialCookieConsentState
  );
  const [announcement, setAnnouncement] = useState("");
  const preferenceTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    dispatch({
      type: "initialize",
      consent: readConsentFromCookieHeader(document.cookie),
    });
  }, []);

  const returnFocusToTrigger = useCallback(() => {
    window.setTimeout(() => {
      if (preferenceTriggerRef.current?.isConnected) {
        preferenceTriggerRef.current.focus();
      }
    }, 0);
  }, []);

  const persistConsent = useCallback((consent: CookieConsent) => {
    document.cookie = serializeConsentCookie(consent);
    dispatch({ type: "save", consent });
    setAnnouncement("Çerez tercihleriniz kaydedildi.");
    returnFocusToTrigger();
  }, [returnFocusToTrigger]);

  const openPreferences = useCallback(() => {
    preferenceTriggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dispatch({ type: "openPreferences" });
  }, []);

  const closePreferences = useCallback(() => {
    dispatch({ type: "closePreferences" });
    returnFocusToTrigger();
  }, [returnFocusToTrigger]);

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      ...state,
      acceptAll: () => persistConsent(createAcceptAllConsent()),
      rejectAll: () => persistConsent(createRejectAllConsent()),
      updatePreferences: (preferences) =>
        persistConsent(createCookieConsent(preferences)),
      resetConsent: () => {
        document.cookie = serializeExpiredConsentCookie();
        dispatch({ type: "reset" });
        setAnnouncement("Çerez tercihleriniz sıfırlandı.");
      },
      openPreferences,
      closePreferences,
    }),
    [closePreferences, openPreferences, persistConsent, state]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);

  if (!context) {
    throw new Error(
      "useCookieConsent must be used within CookieConsentProvider"
    );
  }

  return context;
}
