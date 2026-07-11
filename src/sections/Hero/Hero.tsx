import {
  Activity,
  ArrowRight,
  CheckCircle2,
  CircuitBoard,
  ClipboardCheck,
  Stethoscope,
  Wrench,
} from "lucide-react";
import Link from "next/link";

const trustItems = [
  "Elektronik Kart Onarımı",
  "Mekanik Servis",
  "Periyodik Bakım",
  "Yedek Parça",
];

const scopeSteps = ["Arıza tespiti", "Onarım", "Test & kontrol", "Teslim"];

const stats = [
  "Elektronik + Mekanik Çözümler",
  "Türkiye Geneli Hizmet",
  "Hızlı Arıza Analizi",
];

const statusChips = ["Analiz", "Onarım", "Kontrol"];

const serviceCards = [
  {
    title: "Elektronik Kart Tamiri",
    text: "Arıza tespiti, komponent değişimi ve fonksiyonel test süreçleri.",
    icon: CircuitBoard,
  },
  {
    title: "Mekanik Bakım",
    text: "Cihaz güvenilirliğini artıran düzenli bakım ve parça kontrolü.",
    icon: Wrench,
  },
  {
    title: "Teknik Destek",
    text: "Sağlık kuruluşları için hızlı analiz ve uygulanabilir servis planı.",
    icon: Stethoscope,
  },
];

export default function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden bg-slate-50">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_12%,rgba(14,165,233,0.18),transparent_32%),radial-gradient(circle_at_84%_16%,rgba(249,115,22,0.2),transparent_28%),linear-gradient(135deg,#f8fbff_0%,#ffffff_48%,#fff7ed_100%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:min-h-[calc(100svh-8rem)] lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-14">
        <div className="max-w-3xl">
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-orange-200 bg-white/85 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-slate-800 shadow-sm shadow-orange-100/60 sm:tracking-[0.16em]">
            <Activity className="size-3.5 text-orange-500" aria-hidden="true" />
            <span className="min-w-0">MEDİKAL CİHAZ TEKNİK SERVİSİ</span>
          </div>

          <h1 className="mt-5 max-w-4xl text-3xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Medikal Cihazlarınız İçin Güvenilir Teknik Servis Çözümleri
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Türkiye genelindeki sağlık kuruluşlarına medikal cihaz bakım,
            onarım, elektronik kart tamiri ve teknik destek hizmetleri
            sunuyoruz.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {trustItems.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
              >
                <CheckCircle2 className="size-3.5 text-orange-500" />
                {item}
              </span>
            ))}
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-[auto_1fr] lg:items-center">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="#servis-talebi"
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 sm:w-auto"
              >
                Servis Talebi
              </Link>
              <Link
                href="#hizmetler"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/85 px-5 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 sm:w-auto"
              >
                Hizmetlerimizi İnceleyin
                <ArrowRight className="size-4 text-orange-500" aria-hidden="true" />
              </Link>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm shadow-sky-100/60">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-500">
                Servis kapsamı
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                {scopeSteps.map((step) => (
                  <span key={step} className="rounded-md bg-sky-50 px-2.5 py-2 text-xs font-medium text-slate-700">
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {stats.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-800 shadow-sm shadow-sky-100/60"
              >
                <span className="mb-2 block h-1 w-8 rounded-full bg-orange-400" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-4 -z-10 rounded-[2rem] bg-[linear-gradient(rgba(14,165,233,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.08)_1px,transparent_1px)] bg-size-[22px_22px]" />
          <div className="rounded-3xl border border-white/80 bg-white/85 p-3 shadow-2xl shadow-slate-900/10 backdrop-blur sm:p-4">
            <div className="rounded-2xl border border-sky-100 bg-linear-to-br from-sky-50 via-white to-orange-50 p-4 sm:p-5">
              <div className="flex flex-col gap-3 border-b border-slate-200/70 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">
                    Servis Operasyonu
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-950">
                    Aktif servis süreci
                  </h2>
                </div>
                <div className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                  Süreç açık
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white bg-white/90 p-4 shadow-sm shadow-slate-900/5">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-slate-900 text-orange-300 shadow-lg shadow-slate-900/15">
                    <ClipboardCheck className="size-6" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950">
                      Bakım, onarım ve analiz tek akışta
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Teknik ekip için kontrollü servis adımları
                    </p>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-2/3 rounded-full bg-linear-to-r from-sky-500 to-orange-400" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {statusChips.map((chip) => (
                    <span key={chip} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {serviceCards.map(({ title, text, icon: Icon }) => (
                  <div
                    key={title}
                    className="flex gap-4 rounded-xl border border-white bg-white/90 p-4 shadow-sm shadow-slate-900/5"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 ring-1 ring-sky-200">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-950">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -bottom-5 left-8 right-8 -z-10 h-12 rounded-full bg-sky-900/15 blur-2xl" />
        </div>
      </div>
    </section>
  );
}
