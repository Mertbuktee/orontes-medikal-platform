import Link from "next/link";
import { ArrowRight, Home, Mail, MapPin, SearchX, Wrench } from "lucide-react";

import { getPublicSiteSettings } from "@/lib/site-settings/public-site-settings";
import { formatFullAddress } from "@/lib/site-settings/site-settings-types";

const suggestedLinks = [
  { label: "Hizmetler", href: "/hizmetler" },
  { label: "Cihazlar", href: "/cihazlar" },
  { label: "Elektronik Kart Tamiri", href: "/elektronik-kart-tamiri" },
  { label: "İletişim", href: "/iletisim" },
];

export default async function NotFound() {
  const settings = await getPublicSiteSettings();
  const supportItems = [
    {
      icon: Wrench,
      title: "Teknik servis talebi",
      text: "Cihaz arızası veya bakım ihtiyacı için servis formuna geçin.",
      href: "/servis-talebi",
    },
    {
      icon: Mail,
      title: "E-posta ile ulaşın",
      text: `${settings.contact.emailPrimary} adresinden destek alabilirsiniz.`,
      href: `mailto:${settings.contact.emailPrimary}`,
    },
    {
      icon: MapPin,
      title: "Ofis konumu",
      text: `${formatFullAddress(settings)} adresimizi haritada görüntüleyin.`,
      href: settings.map.googleMapsPlaceId || settings.map.googleMapsEmbed || "/iletisim",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-slate-50 px-6 py-20 sm:px-8 lg:px-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-0 top-0 size-80 rounded-full bg-sky-200/45 blur-3xl" />
        <div className="absolute bottom-0 right-0 size-96 rounded-full bg-orange-200/50 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(2,34,58,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(2,34,58,0.045)_1px,transparent_1px)] bg-[size:42px_42px]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-600 shadow-sm">
            <SearchX className="size-4" aria-hidden="true" />
            404
          </div>

          <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
            Aradığınız sayfa bulunamadı
          </h1>

          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
            Ulaşmak istediğiniz sayfa taşınmış, kaldırılmış veya adres hatalı
            yazılmış olabilir. Ana sayfaya dönebilir ya da servis ve iletişim
            sayfalarından hızlıca devam edebilirsiniz.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            >
              <Home className="size-4" aria-hidden="true" />
              Ana Sayfaya Dön
            </Link>
            <Link
              href="/servis-talebi"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-sky-200 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
            >
              Servis Talebi Oluştur
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <nav aria-label="Önerilen sayfa bağlantıları" className="mt-8">
            <ul className="flex flex-wrap gap-2">
              {suggestedLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-orange-200 hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-[#071526] p-5 shadow-2xl shadow-slate-300/50">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6">
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:34px_34px]"
              aria-hidden="true"
            />
            <div className="relative">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-300">
                Orontes Destek
              </p>
              <h2 className="mt-3 text-2xl font-bold text-white">
                Doğru bölüme birlikte gidelim
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Medikal cihaz teknik servis, elektronik kart tamiri ve iletişim
                kanallarına aşağıdaki kısa yollarla ulaşabilirsiniz.
              </p>

              <div className="mt-6 grid gap-3">
                {supportItems.map(({ icon: Icon, ...item }) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                    className="group rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:-translate-y-0.5 hover:border-orange-300/30 hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071526]"
                  >
                    <span className="flex gap-4">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-400/10 text-sky-200 transition group-hover:text-orange-200">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-white">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-slate-300">
                          {item.text}
                        </span>
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
