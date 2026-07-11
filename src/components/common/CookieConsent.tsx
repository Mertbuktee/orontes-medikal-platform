"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Cookie, Settings2, ShieldCheck, X } from "lucide-react";

import {
  consentCookieName,
  cookieConsentVersion,
  type CookieConsentPreferences,
} from "@/lib/privacy/cookie-consent.shared";

const storageKey = "orontes.cookieConsent";

const defaultPreferences: CookieConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  functional: false,
};

const allPreferences: CookieConsentPreferences = {
  necessary: true,
  analytics: true,
  marketing: true,
  functional: true,
};

const preferenceOptions = [
  {
    key: "necessary",
    title: "Zorunlu çerezler",
    description: "Site güvenliği, form koruması ve temel tercih kaydı için gereklidir.",
    locked: true,
  },
  {
    key: "functional",
    title: "Fonksiyonel çerezler",
    description: "Tercihlerinizin ve kullanım deneyiminizin hatırlanmasına yardımcı olur.",
  },
  {
    key: "analytics",
    title: "Analitik çerezler",
    description: "Site performansını ve hangi bölümlerin iyileştirileceğini anlamamızı sağlar.",
  },
  {
    key: "marketing",
    title: "Pazarlama çerezleri",
    description: "İleride reklam ve kampanya ölçümleme süreçleri için kullanılabilir.",
  },
] satisfies Array<{
  key: keyof CookieConsentPreferences;
  title: string;
  description: string;
  locked?: boolean;
}>;

type StoredConsent = {
  consentId: string;
  version: string;
  preferences: CookieConsentPreferences;
};

export default function CookieConsent() {
  const dialogTitleId = useId();
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] =
    useState<CookieConsentPreferences>(defaultPreferences);

  useEffect(() => {
    const stored = readStoredConsent();
    const hasCookie = document.cookie
      .split("; ")
      .some((cookie) => cookie.startsWith(`${consentCookieName}=`));

    if (stored?.version === cookieConsentVersion || hasCookie) {
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) {
    return null;
  }

  async function saveConsent(nextPreferences: CookieConsentPreferences) {
    setIsSaving(true);

    const stored = readStoredConsent();
    const consentId = stored?.consentId ?? crypto.randomUUID();

    try {
      const response = await fetch("/api/cookie-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentId, preferences: nextPreferences }),
      });

      if (!response.ok) {
        throw new Error("Consent request failed");
      }

      const data = (await response.json()) as {
        consentId?: string;
        preferences?: CookieConsentPreferences;
      };

      persistConsent({
        consentId: data.consentId ?? consentId,
        version: cookieConsentVersion,
        preferences: data.preferences ?? nextPreferences,
      });
      setVisible(false);
      setSettingsOpen(false);
    } catch {
      persistConsent({
        consentId,
        version: cookieConsentVersion,
        preferences: nextPreferences,
      });
      setVisible(false);
      setSettingsOpen(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6"
      role="region"
      aria-label="Çerez tercihleri"
    >
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/20 sm:p-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/25">
              <Cookie className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-600">
                Çerez Tercihleri
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Zorunlu çerezler siteyi güvenli şekilde çalıştırmak için kullanılır.
                Analitik, fonksiyonel ve pazarlama çerezleri için tercihinizi
                alıyoruz. Seçiminiz ileride kullanıcı kaydınızla eşleştirilebilecek
                şekilde hazırlanmıştır.
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
                <Link href="/cerez-politikasi" className="hover:text-orange-600">
                  Çerez Politikası
                </Link>
                <Link href="/kvkk" className="hover:text-orange-600">
                  KVKK
                </Link>
                <Link href="/gizlilik-politikasi" className="hover:text-orange-600">
                  Gizlilik Politikası
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
            <button
              type="button"
              onClick={() => saveConsent(defaultPreferences)}
              disabled={isSaving}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reddet
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Settings2 className="size-4" aria-hidden="true" />
              Ayarları Yönet
            </button>
            <button
              type="button"
              onClick={() => saveConsent(allPreferences)}
              disabled={isSaving}
              className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Tümünü Kabul Et
            </button>
          </div>
        </div>
      </div>

      {settingsOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">
                  Tercih Merkezi
                </p>
                <h2 id={dialogTitleId} className="mt-2 text-2xl font-bold text-slate-950">
                  Çerez ayarlarınızı seçin
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Çerez ayarlarını kapat"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {preferenceOptions.map((option) => (
                <label
                  key={option.key}
                  className="flex gap-4 rounded-2xl border border-slate-200 p-4"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                    <ShieldCheck className="size-5" aria-hidden="true" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-slate-950">
                      {option.title}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">
                      {option.description}
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences[option.key]}
                    disabled={option.locked}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        [option.key]: event.target.checked,
                        necessary: true,
                      }))
                    }
                    className="mt-1 size-5 accent-orange-500"
                  />
                </label>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => saveConsent(preferences)}
                disabled={isSaving}
                className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Tercihlerimi Kaydet
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function readStoredConsent(): StoredConsent | null {
  try {
    const value = window.localStorage.getItem(storageKey);
    return value ? (JSON.parse(value) as StoredConsent) : null;
  } catch {
    return null;
  }
}

function persistConsent(consent: StoredConsent) {
  window.localStorage.setItem(storageKey, JSON.stringify(consent));
}
