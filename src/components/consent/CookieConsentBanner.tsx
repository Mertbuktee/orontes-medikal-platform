"use client";

import Link from "next/link";
import { Cookie, Settings2 } from "lucide-react";

import { useCookieConsent } from "./CookieConsentProvider";

export function CookieConsentBanner() {
  const {
    isInitialized,
    isBannerVisible,
    acceptAll,
    rejectAll,
    openPreferences,
  } = useCookieConsent();

  if (!isInitialized || !isBannerVisible) {
    return null;
  }

  return (
    <section
      aria-label="Çerez tercihleri"
      className="fixed inset-x-4 bottom-4 z-[70] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-white/10 bg-[#071526] p-4 text-white shadow-2xl shadow-slate-950/30 sm:right-6 sm:left-auto sm:bottom-6 sm:w-[min(440px,calc(100vw-48px))] sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/25">
          <Cookie className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
            Çerez Tercihleri
          </p>
          <h2 className="mt-2 text-xl font-bold leading-tight text-white">
            Gizliliğinize Önem Veriyoruz
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Zorunlu çerezler sitenin güvenli ve doğru çalışması için
            kullanılır. Analiz ve pazarlama çerezleri ise yalnızca açık
            onayınızla etkinleştirilir.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
            <Link
              href="/cerez-politikasi"
              className="inline-flex min-h-10 items-center text-sky-200 underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              Çerez Politikası
            </Link>
            <Link
              href="/gizlilik-politikasi"
              className="inline-flex min-h-10 items-center text-sky-200 underline-offset-4 hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              Gizlilik Politikası
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={acceptAll}
          className="min-h-11 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071526]"
        >
          Tümünü Kabul Et
        </button>
        <button
          type="button"
          onClick={rejectAll}
          className="min-h-11 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-orange-300/50 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071526]"
        >
          Tümünü Reddet
        </button>
        <button
          type="button"
          onClick={openPreferences}
          className="min-h-11 rounded-xl border border-sky-300/20 px-4 py-2.5 text-sm font-semibold text-sky-100 transition hover:border-sky-200/50 hover:bg-sky-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071526] sm:col-span-2"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <Settings2 className="size-4" aria-hidden="true" />
            Tercihleri Yönet
          </span>
        </button>
      </div>
    </section>
  );
}
