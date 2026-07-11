import type { Metadata } from "next";
import { BadgeCheck, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { publicRoutes } from "@/config/site";
import { createPageMetadata } from "@/lib/seo/metadata";
import ServiceRequestForm from "@/sections/CTA/ServiceRequestForm";

const route = publicRoutes.find((item) => item.path === "/servis-talebi");

export const metadata: Metadata = createPageMetadata({
  title: route?.title ?? "Servis Talebi Oluştur | Orontes Teknoloji",
  description:
    route?.description ??
    "Medikal cihaz arızası için güvenli servis talebi formu.",
  path: "/servis-talebi",
});

const supportItems = [
  "Marka, model ve seri no ile detaylı kayıt",
  "Görsel veya PDF ekleyerek arızayı açıklama",
  "Teknik ön değerlendirme için güvenli başvuru",
];

export default function ServiceRequestPage() {
  return (
    <main className="bg-slate-950 text-white">
      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_12%,rgba(14,165,233,0.26),transparent_30%),radial-gradient(circle_at_88%_10%,rgba(249,115,22,0.24),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_52%,#082f49_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-size-[30px_30px]" />

        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="flex flex-col justify-center">
            <Breadcrumbs
              items={[
                { name: "Ana Sayfa", path: "/" },
                { name: "Servis Talebi", path: "/servis-talebi" },
              ]}
            />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-300">
              Güvenli servis başvurusu
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Medikal cihazınız için teknik servis talebi oluşturun
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Cihaz bilgilerini, arıza belirtisini ve varsa görsel/PDF ekini
              paylaşın. Başvurunuz güvenli servis talebi altyapısına iletilir.
            </p>

            <div className="mt-8 grid gap-3">
              {supportItems.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-slate-100"
                >
                  <BadgeCheck className="size-5 shrink-0 text-orange-300" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <Link
              href="https://wa.me/905536065703?text=Merhabalar%20Website%20%C3%9Czerinden%20%C4%B0leti%C5%9Fime%20Ge%C3%A7iyorum"
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 sm:w-fit"
            >
              <Image
                src="/images/icons/wp.png"
                alt=""
                width={24}
                height={24}
                className="size-6 rounded-sm"
                aria-hidden="true"
              />
              WhatsApp ile hızlı iletişim
              <MessageCircle className="sr-only" aria-hidden="true" />
            </Link>
          </div>

          <ServiceRequestForm />
        </div>
      </section>
    </main>
  );
}
