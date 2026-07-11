"use client";

import { Dialog } from "@base-ui/react/dialog";
import { BarChart3, Megaphone, ShieldCheck, X } from "lucide-react";
import { useId, useState } from "react";

import { useCookieConsent } from "./CookieConsentProvider";

type PreferenceKey = "analytics" | "marketing";

const optionalCategories: Array<{
  key: PreferenceKey;
  title: string;
  description: string;
  icon: typeof BarChart3;
}> = [
  {
    key: "analytics",
    title: "Analiz Çerezleri",
    description:
      "Ziyaretlerin ve sayfa kullanımının anonim olarak analiz edilmesine yardımcı olur.",
    icon: BarChart3,
  },
  {
    key: "marketing",
    title: "Pazarlama Çerezleri",
    description:
      "İlgi alanına yönelik içerik ve kampanyaların ölçülmesi için kullanılabilir.",
    icon: Megaphone,
  },
];

export function CookiePreferencesDialog() {
  const {
    consent,
    isPreferencesOpen,
    closePreferences,
    updatePreferences,
    acceptAll,
    rejectAll,
  } = useCookieConsent();

  return (
    <Dialog.Root
      open={isPreferencesOpen}
      onOpenChange={(open) => {
        if (!open) {
          closePreferences();
        }
      }}
    >
      {isPreferencesOpen ? (
        <CookiePreferencesContent
          initialAnalytics={consent?.analytics ?? false}
          initialMarketing={consent?.marketing ?? false}
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
          onSave={(preferences) => updatePreferences(preferences)}
        />
      ) : null}
    </Dialog.Root>
  );
}

function CookiePreferencesContent({
  initialAnalytics,
  initialMarketing,
  onAcceptAll,
  onRejectAll,
  onSave,
}: {
  initialAnalytics: boolean;
  initialMarketing: boolean;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSave: (preferences: { analytics: boolean; marketing: boolean }) => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [marketing, setMarketing] = useState(initialMarketing);

  return (
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-[80] bg-slate-950/55 backdrop-blur-sm" />
      <Dialog.Popup
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="fixed top-1/2 left-1/2 z-[90] max-h-[min(92dvh,720px)] w-[min(calc(100vw-2rem),600px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 text-slate-950 shadow-2xl outline-none sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
              Tercih Merkezi
            </p>
            <Dialog.Title
              id={titleId}
              className="mt-2 text-2xl font-bold text-slate-950"
            >
              Çerez Tercihlerini Yönet
            </Dialog.Title>
            <Dialog.Description
              id={descriptionId}
              className="mt-2 text-sm leading-6 text-slate-600"
            >
              Zorunlu çerezler kapatılamaz. Analiz ve pazarlama tercihlerini
              istediğiniz zaman değiştirebilirsiniz.
            </Dialog.Description>
          </div>
          <Dialog.Close
            aria-label="Çerez tercihlerini kapat"
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <X className="size-5" aria-hidden="true" />
          </Dialog.Close>
        </div>

        <div className="mt-6 space-y-3">
          <PreferenceRow
            title="Zorunlu Çerezler"
            description="Sitenin temel işlevleri, güvenliği ve form işlemleri için gereklidir."
            label="Her zaman aktif"
            checked
            disabled
            icon={ShieldCheck}
          />
          {optionalCategories.map((category) => (
            <PreferenceRow
              key={category.key}
              title={category.title}
              description={category.description}
              label={category.title}
              checked={category.key === "analytics" ? analytics : marketing}
              onChange={
                category.key === "analytics" ? setAnalytics : setMarketing
              }
              icon={category.icon}
            />
          ))}
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => onSave({ analytics, marketing })}
            className="min-h-11 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 sm:col-span-3"
          >
            Seçimlerimi Kaydet
          </button>
          <button
            type="button"
            onClick={onAcceptAll}
            className="min-h-11 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 sm:col-span-1"
          >
            Tümünü Kabul Et
          </button>
          <button
            type="button"
            onClick={onRejectAll}
            className="min-h-11 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 sm:col-span-2"
          >
            Tümünü Reddet
          </button>
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  );
}

function PreferenceRow({
  title,
  description,
  label,
  checked,
  disabled = false,
  onChange,
  icon: Icon,
}: {
  title: string;
  description: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  icon: typeof ShieldCheck;
}) {
  const descriptionId = useId();

  return (
    <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        <p id={descriptionId} className="mt-1 text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={descriptionId}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className="mt-1 inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-1 text-sm font-semibold text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-not-allowed"
      >
        <span className="sr-only">{label}</span>
        {disabled ? (
          <span className="hidden text-xs text-slate-500 sm:inline">
            Her zaman aktif
          </span>
        ) : null}
        <span
          className={`relative h-6 w-11 rounded-full transition ${
            checked ? "bg-orange-500" : "bg-slate-300"
          }`}
          aria-hidden="true"
        >
          <span
            className={`absolute top-1 size-4 rounded-full bg-white transition ${
              checked ? "left-6" : "left-1"
            }`}
          />
        </span>
      </button>
    </div>
  );
}
