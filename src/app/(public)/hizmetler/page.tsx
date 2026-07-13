import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { createElement } from "react";

import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { publicRoutes } from "@/config/site";
import { getPublicActiveServices } from "@/lib/services/public-services";
import { getServiceIcon } from "@/lib/services/service-registry";
import { createPageMetadata } from "@/lib/seo/metadata";

const route = publicRoutes.find((item) => item.path === "/hizmetler");

export const metadata: Metadata = createPageMetadata({
  title: route?.title ?? "Medikal Cihaz Teknik Servis Hizmetleri | Orontes Teknoloji",
  description:
    route?.description ??
    "Medikal cihaz bakım, onarım ve teknik servis hizmetleri.",
  path: "/hizmetler",
});

export default async function ServicesPage() {
  const serviceItems = await getPublicActiveServices();

  return (
    <main className="bg-white">
      <section className="relative overflow-hidden bg-slate-50 py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_12%,rgba(14,165,233,0.15),transparent_30%),radial-gradient(circle_at_88%_16%,rgba(249,115,22,0.14),transparent_28%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { name: "Ana Sayfa", path: "/" },
              { name: "Hizmetler", path: "/hizmetler" },
            ]}
          />
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">
              Orontes Teknik Servis
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Medikal cihazlar için uçtan uca teknik servis çözümleri
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              Cihaz kabulünden arıza analizine, elektronik kart onarımından
              teslim öncesi kontrole kadar servis süreçlerini planlı ve
              izlenebilir bir yaklaşımla yürütüyoruz.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {serviceItems.length ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {serviceItems.map(
                ({ id, title, slug, shortDescription, fullDescription, iconKey }) => (
                  <article
                    id={slug}
                    key={id}
                    className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-900/10"
                  >
                    <div className="flex size-12 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100 group-hover:bg-orange-50 group-hover:text-orange-600">
                      {createElement(getServiceIcon(iconKey), {
                        className: "size-6",
                        "aria-hidden": true,
                      })}
                    </div>
                    <h2 className="mt-6 text-xl font-semibold text-slate-950">
                      {title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {shortDescription}
                    </p>
                    <p className="mt-4 text-sm leading-7 text-slate-700">
                      {fullDescription}
                    </p>
                    {slug === "elektronik-kart-tamiri" ? (
                      <Link
                        href="/elektronik-kart-tamiri"
                        className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-sky-700 transition hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                      >
                        Elektronik kart tamiri detaylarını inceleyin
                      </Link>
                    ) : null}
                  </article>
                )
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <h2 className="text-xl font-semibold text-slate-950">
                Yayında olan hizmet içeriği bulunmuyor.
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Hizmet içerikleri yönetim panelinden aktif edildiğinde burada görüntülenecek.
              </p>
            </div>
          )}

          <div className="mt-12 rounded-3xl bg-slate-950 p-6 text-white shadow-2xl shadow-slate-200/80 sm:flex sm:items-center sm:justify-between sm:gap-8 lg:p-8">
            <div>
              <h2 className="text-2xl font-semibold">
                Servis kapsamını birlikte netleştirelim
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Cihaz bilgilerini ve arıza belirtisini paylaşın, ekibimiz uygun
                servis süreci için dönüş sağlasın.
              </p>
            </div>
            <Link
              href="/servis-talebi"
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 sm:mt-0 sm:w-auto"
            >
              Servis Talebi Oluştur
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
