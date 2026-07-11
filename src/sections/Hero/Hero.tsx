import {
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

import { HeroServiceSlider } from "./HeroServiceSlider";

const trustItems = [
  "Elektronik Kart Onarımı",
  "Mekanik Servis",
  "Türkiye Geneli Hizmet",
];

const stats = [
  {
    step: "01",
    title: "Kontrollü Arıza Analizi",
    text: "Cihaz ve kart tarafında teknik ön değerlendirme.",
  },
  {
    step: "02",
    title: "Onarım + Test Süreci",
    text: "Uygulanan işlem sonrası fonksiyon kontrolü.",
  },
  {
    step: "03",
    title: "Cihaz Kabul Desteği",
    text: "Türkiye genelinden servis başvurusu ve yönlendirme.",
  },
];

export default function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden bg-slate-50">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_12%,rgba(14,165,233,0.18),transparent_32%),radial-gradient(circle_at_84%_16%,rgba(249,115,22,0.2),transparent_28%),linear-gradient(135deg,#f8fbff_0%,#ffffff_48%,#fff7ed_100%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:min-h-[calc(100svh-8rem)] lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-14">
        <div className="max-w-3xl">
          <h1 className="max-w-4xl text-3xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
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

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="#servis-talebi"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-orange-500 px-6 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 sm:w-auto lg:hidden"
            >
              Servis Talebi
            </Link>
            <Link
              href="#hizmetler"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/85 px-6 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 sm:w-auto"
            >
              Hizmetlerimizi İnceleyin
              <ArrowRight className="size-4 text-orange-500" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-lg shadow-sky-100/50 backdrop-blur">
            <div className="flex flex-col gap-2 border-b border-slate-200/80 bg-linear-to-r from-sky-50 via-white to-orange-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-500">
                Servis yaklaşımı
              </p>
              <p className="text-xs font-medium text-slate-500">
                İnceleme, uygulama ve teslim süreci tek akışta yönetilir.
              </p>
            </div>
            <div className="grid gap-0 sm:grid-cols-3">
            {stats.map((item) => (
              <div
                key={item.title}
                className="group relative px-4 py-4 text-sm text-slate-700 transition-colors hover:bg-sky-50/70 sm:border-r sm:border-slate-200/70 sm:last:border-r-0"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-orange-300 shadow-sm transition-colors group-hover:bg-orange-500 group-hover:text-white">
                    {item.step}
                  </span>
                  <span className="h-px flex-1 bg-linear-to-r from-orange-300 to-transparent" />
                </div>
                <h2 className="font-semibold text-slate-950">
                  {item.title}
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.text}</p>
              </div>
            ))}
            </div>
          </div>
        </div>

        <div className="relative min-w-0">
          <HeroServiceSlider />
        </div>
      </div>
    </section>
  );
}
