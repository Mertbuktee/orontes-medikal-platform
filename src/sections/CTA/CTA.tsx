import { BadgeCheck, ClipboardCheck, FileText, PlugZap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import ServiceRequestForm from "@/sections/CTA/ServiceRequestForm";

type CTALink = {
  text: string;
  href: string;
};

export interface CTAProps {
  badge?: string;
  title?: string;
  description?: string;
  primaryLink?: CTALink;
  secondaryLink?: CTALink;
  trustItems?: string[];
}

const defaultTrustItems = [
  "Elektronik ve Mekanik Çözümler",
  "Türkiye Geneli Cihaz Kabulü",
  "Kontrollü Onarım Süreci",
];

export default function CTA({
  badge = "TEKNİK SERVİS DESTEĞİ",
  title = "Medikal Cihazınız İçin Teknik Destek Alın",
  description = "Arıza, bakım, elektronik kart onarımı veya servis kapsamı hakkında bilgi almak için cihaz detaylarını ekibimizle paylaşın.",
  secondaryLink = {
    text: "WhatsApp",
    href: "https://wa.me/905536065703?text=Merhabalar%20Website%20%C3%9Czerinden%20%C4%B0leti%C5%9Fime%20Ge%C3%A7iyorum",
  },
  trustItems = defaultTrustItems,
}: CTAProps) {
  return (
    <section id="servis-talebi" className="bg-white px-3 py-14 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl shadow-slate-200/80">
        <div className="relative isolate grid gap-8 px-4 py-8 sm:px-8 sm:py-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:px-12 lg:py-14">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_12%,rgba(14,165,233,0.26),transparent_30%),radial-gradient(circle_at_90%_15%,rgba(249,115,22,0.24),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_52%,#082f49_100%)]" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-size-[30px_30px]" />

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/25 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-orange-200 backdrop-blur">
              <PlugZap className="size-3.5" aria-hidden="true" />
              {badge}
            </div>

            <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {title}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              {description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={secondaryLink.href}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 sm:w-auto"
                target={secondaryLink.href.startsWith("http") ? "_blank" : undefined}
                rel={secondaryLink.href.startsWith("http") ? "noreferrer" : undefined}
                aria-label="WhatsApp üzerinden mesaj gönder"
              >
                <Image
                  src="/images/icons/wp.png"
                  alt=""
                  width={16}
                  height={16}
                  className="size-6 rounded-sm"
                  aria-hidden="true"
                />
                {secondaryLink.text}
              </Link>
            </div>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                <div className="flex items-start gap-3 sm:items-center">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-200 ring-1 ring-orange-300/20">
                    <FileText className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-sm font-semibold text-white">Form üzerinden başvuru</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Marka, model, seri no ve arıza bilgisini sağdaki formdan güvenli şekilde iletin.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                <div className="flex items-start gap-3 sm:items-center">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-sky-400/10 text-sky-200 ring-1 ring-sky-300/20">
                    <ClipboardCheck className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-sm font-semibold text-white">Teknik ön değerlendirme</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Ekibimiz servis kapsamı ve uygun süreç için başvurunuzu değerlendirir.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <ServiceRequestForm />
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {trustItems.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm font-medium text-slate-100 transition-colors hover:border-orange-300/30 hover:bg-white/[0.08]"
                >
                  <BadgeCheck className="size-5 shrink-0 text-orange-300" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
