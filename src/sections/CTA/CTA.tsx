import { ArrowRight, BadgeCheck, MessageCircle, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type CTALink = {
  text: string;
  href: string;
};

export interface CTAProps {
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
  title = "Medikal Cihazınız İçin Teknik Destek Alın",
  description = "Arıza, bakım, elektronik kart onarımı veya servis kapsamı hakkında bilgi almak için cihaz detaylarını ekibimizle paylaşın.",
  primaryLink = { text: "Servis Talebi Oluştur", href: "/servis-talebi" },
  secondaryLink = {
    text: "WhatsApp",
    href: "https://wa.me/905536065703?text=Merhabalar%20Website%20%C3%9Czerinden%20%C4%B0leti%C5%9Fime%20Ge%C3%A7iyorum",
  },
  trustItems = defaultTrustItems,
}: CTAProps) {
  return (
    <section id="servis-talebi" className="bg-white px-3 py-14 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl shadow-slate-200/80">
        <div className="relative isolate grid gap-8 px-4 py-8 sm:px-8 sm:py-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:px-12 lg:py-14">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_12%,rgba(14,165,233,0.26),transparent_30%),radial-gradient(circle_at_90%_15%,rgba(249,115,22,0.24),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_52%,#082f49_100%)]" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-size-[30px_30px]" />

          <div>
            <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {title}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              {description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={primaryLink.href}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:-translate-y-0.5 hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 sm:w-auto"
              >
                {primaryLink.text}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
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
                  width={24}
                  height={24}
                  className="size-6 rounded-sm"
                  aria-hidden="true"
                />
                {secondaryLink.text}
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 shadow-xl shadow-black/20 backdrop-blur">
            <div className="flex items-start gap-3 border-b border-white/10 pb-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-400/10 text-sky-200 ring-1 ring-sky-300/20">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Başvuru ayrı sayfada, süreç daha net
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Marka, model, seri no, arıza açıklaması ve dosya ekini servis
                  talebi sayfasından güvenli şekilde gönderebilirsiniz.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
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

            <div className="mt-5 flex items-center gap-3 rounded-xl border border-sky-300/15 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
              <MessageCircle className="size-5 shrink-0" aria-hidden="true" />
              <span>Hızlı ön görüşme için WhatsApp seçeneği her zaman erişilebilir.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
