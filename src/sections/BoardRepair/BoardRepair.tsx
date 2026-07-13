import {
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  PackageSearch,
  Repeat2,
  Scale,
  Search,
  Wrench,
} from "lucide-react";
import Link from "next/link";

import type { BoardRepairContent } from "@/lib/homepage/homepage-types";

const decisionSteps = [
  {
    title: "Fiziksel Durum",
    description: "Kartın yanık, kırık, sıvı teması ve bağlantı hasarı kontrol edilir.",
    icon: Search,
  },
  {
    title: "Arıza Tekrarı",
    description: "Arızanın aynı koşullarda tekrar edip etmediği değerlendirilir.",
    icon: Repeat2,
  },
  {
    title: "Maliyet Değerlendirmesi",
    description: "Onarım maliyeti cihazın kullanım değeriyle birlikte ele alınır.",
    icon: Scale,
  },
  {
    title: "Parça Bulunabilirliği",
    description: "Gerekli komponentlerin temin edilebilirliği kontrol edilir.",
    icon: PackageSearch,
  },
  {
    title: "Test Edilebilirlik",
    description: "Onarım sonrası kartın güvenli şekilde test edilip edilemeyeceği incelenir.",
    icon: ClipboardCheck,
  },
  {
    title: "Net Servis Önerisi",
    description: "Onarım, değişim veya ileri değerlendirme önerisi müşteriye iletilir.",
    icon: BadgeCheck,
  },
];

const defaultContent: BoardRepairContent = {
  badge: "Elektronik Kart Tamiri",
  title: "Elektronik Kart Tamirinde Uzman Teknik Servis",
  description:
    "Medikal cihazlara ait elektronik kartlarda arıza tespiti, komponent değişimi, lehimleme, besleme devresi analizi ve fonksiyon testlerini profesyonel ekipmanlarla gerçekleştiriyoruz.",
  featureItems: [
    "Cihaz değişim maliyetini azaltır",
    "Arıza kaynağı netleşir",
    "Kart ömrü uzatılır",
    "Gereksiz parça değişimi önlenir",
    "Servis süreci hızlanır",
    "Sürdürülebilir çözüm sağlar",
  ],
  primaryCtaLabel: "Servis Talebi",
  primaryCtaHref: "/servis-talebi",
  secondaryCtaLabel: "İletişime Geç",
  secondaryCtaHref: "/iletisim",
  mediaId: null,
};

type BoardRepairProps = {
  content?: BoardRepairContent;
};

export default function BoardRepair({ content = defaultContent }: BoardRepairProps) {
  return (
    <section
      id="kart-tamiri"
      className="relative overflow-hidden bg-slate-950 py-16 text-white sm:py-20 lg:py-24"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_14%,rgba(14,165,233,0.24),transparent_28%),radial-gradient(circle_at_86%_20%,rgba(249,115,22,0.22),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#082f49_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-size-[28px_28px]" />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">
            {content.badge}
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-white sm:text-5xl">
            {content.title}
          </h2>

          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            {content.description}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {content.featureItems.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-medium text-slate-100 shadow-sm backdrop-blur"
              >
                <CheckCircle2 className="size-5 shrink-0 text-orange-300" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={content.primaryCtaHref}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            >
              {content.primaryCtaLabel}
            </Link>
            <Link
              href={content.secondaryCtaHref}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-white/15 bg-white/10 px-5 text-sm font-semibold text-white shadow-sm backdrop-blur transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              {content.secondaryCtaLabel}
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-4 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-5">
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <span className="inline-flex rounded-full bg-sky-400/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-sky-200 ring-1 ring-sky-300/20">
                  TEKNİK KARAR
                </span>
                <h3 className="mt-3 text-2xl font-semibold text-white">
                  Onarım Kararı Nasıl Verilir?
                </h3>
              </div>
              <div className="hidden size-12 items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/25 sm:flex">
                <Scale className="size-6" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {decisionSteps.map(({ title, description, icon: Icon }, index) => (
                <div key={title} className="relative flex gap-4">
                  {index < decisionSteps.length - 1 && (
                    <span className="absolute left-5 top-11 h-[calc(100%-1rem)] w-px bg-linear-to-b from-sky-300/50 to-orange-300/30" />
                  )}
                  <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-400/10 text-sky-200 ring-1 ring-sky-300/20">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-semibold text-white">{title}</h4>
                      <span className="text-xs font-semibold text-orange-200">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-orange-300/20 bg-linear-to-br from-orange-500/15 via-white/[0.06] to-sky-400/10 p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/25">
                  <Wrench className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">
                    Teslim güveni
                  </p>
                  <h4 className="mt-1 text-base font-semibold text-white sm:text-lg">
                    Servis Sonrası Teslim Standartları
                  </h4>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Onarım tamamlandıktan sonra kartın durumu, yapılan işlem ve
                teslim hazırlığı kontrollü şekilde değerlendirilir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
