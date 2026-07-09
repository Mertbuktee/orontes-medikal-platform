import {
  BadgeCheck,
  Brush,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  Gauge,
  Microscope,
  PackageCheck,
  PlugZap,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";

const features = [
  "Cihaz değişim maliyetini azaltır",
  "Arıza kaynağı netleşir",
  "Kart ömrü uzatılır",
  "Gereksiz parça değişimi önlenir",
  "Servis süreci hızlanır",
  "Sürdürülebilir çözüm sağlar",
];

const steps = [
  { title: "Arıza Analizi", description: "Kart ilk incelemesi yapılır.", icon: Microscope },
  { title: "Elektronik Ölçümler", description: "Besleme ve kritik noktalar test edilir.", icon: Gauge },
  { title: "Komponent Değişimi", description: "Arızalı komponentler değiştirilir.", icon: Cpu },
  { title: "Lehim ve Temizlik", description: "Profesyonel lehimleme ve IPA temizliği uygulanır.", icon: Brush },
  { title: "Fonksiyon Testi", description: "Kart cihaz üzerinde test edilir.", icon: ClipboardCheck },
  { title: "Teslim", description: "Kart güvenli şekilde müşteriye teslim edilir.", icon: PackageCheck },
];

const equipment = [
  "Temizlenmiş kart teslimi",
  "Test edilmiş çalışma durumu",
  "Arıza notu paylaşımı",
  "Değişen parça bilgisi",
  "Güvenli paketleme",
  "Teslim öncesi son kontrol",
];

export default function BoardRepair() {
  return (
    <section
      id="kart-tamiri"
      className="relative overflow-hidden bg-slate-950 py-16 text-white sm:py-20 lg:py-24"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_14%,rgba(14,165,233,0.24),transparent_28%),radial-gradient(circle_at_86%_20%,rgba(249,115,22,0.22),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#082f49_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-size-[28px_28px]" />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-300/30 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-orange-200 shadow-sm backdrop-blur">
            <PlugZap className="size-3.5" aria-hidden="true" />
            <span>ELEKTRONİK KART ONARIMI</span>
          </div>

          <h2 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Elektronik Kart Tamirinde
            <span className="block text-orange-300">Uzman Teknik Servis</span>
          </h2>

          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Medikal cihazlara ait elektronik kartlarda arıza tespiti, komponent
            değişimi, lehimleme, besleme devresi analizi ve fonksiyon testlerini
            profesyonel ekipmanlarla gerçekleştiriyoruz.
          </p>

          <div className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-200">
              Neden Kart Onarımı?
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
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
              href="/#servis-talebi"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            >
              Servis Talebi
            </Link>
            <Link
              href="/#iletisim"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-white/15 bg-white/10 px-5 text-sm font-semibold text-white shadow-sm backdrop-blur transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              İletişime Geç
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-4 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-5">
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <span className="inline-flex rounded-full bg-sky-400/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-sky-200 ring-1 ring-sky-300/20">
                  ONARIM SÜRECİ
                </span>
                <h3 className="mt-3 text-2xl font-semibold text-white">
                  Hassas kart onarımı için kontrollü akış
                </h3>
              </div>
              <div className="hidden size-12 items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/25 sm:flex">
                <Zap className="size-6" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {steps.map(({ title, description, icon: Icon }, index) => (
                <div key={title} className="relative flex gap-4">
                  {index < steps.length - 1 && (
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

            <div className="mt-6 overflow-hidden rounded-2xl border border-orange-300/20 bg-linear-to-br from-orange-500/15 via-white/[0.06] to-sky-400/10 shadow-lg shadow-black/10">
              <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/25">
                    <Wrench className="size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">
                      Teslim güveni
                    </p>
                    <h4 className="mt-1 text-lg font-semibold text-white">
                      Servis Sonrası Teslim Standartları
                    </h4>
                  </div>
                </div>
                <div className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-100">
                  Kontrol + Bilgilendirme + Teslim
                </div>
              </div>

              <div className="grid gap-2 p-5 sm:grid-cols-2">
                {equipment.map((item) => (
                  <div
                    key={item}
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-3 text-sm text-slate-100 transition-colors hover:border-orange-300/30 hover:bg-white/[0.08]"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-orange-300/10 text-orange-200 ring-1 ring-orange-300/20">
                      <BadgeCheck className="size-4" aria-hidden="true" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 bg-slate-950/35 px-5 py-3 text-xs leading-5 text-slate-300">
                Onarım tamamlandıktan sonra kartın durumu, yapılan işlem ve
                teslim hazırlığı kontrollü şekilde değerlendirilir.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
