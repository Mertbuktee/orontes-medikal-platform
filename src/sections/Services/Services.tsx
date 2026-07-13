import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { createElement } from "react";

import { getPublicFeaturedServices } from "@/lib/services/public-services";
import { getServiceIcon } from "@/lib/services/service-registry";

type ServicesProps = {
  title?: string;
  description?: string;
  itemLimit?: number;
  showViewAll?: boolean;
  viewAllLabel?: string;
};

export default async function Services({
  title = "Hizmetlerimiz",
  description = "Medikal cihazların yaşam döngüsünü destekleyen profesyonel teknik servis çözümleri.",
  itemLimit = 6,
  showViewAll = true,
  viewAllLabel = "Tüm Hizmetleri Gör",
}: ServicesProps) {
  const services = await getPublicFeaturedServices(itemLimit);

  return (
    <section id="hizmetler" className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg">
            {description}
          </p>
        </div>

        {services.length ? (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map(({ title: serviceTitle, shortDescription, slug, iconKey }) => (
              <Link
                key={slug}
                href={
                  slug === "elektronik-kart-tamiri"
                    ? "/elektronik-kart-tamiri"
                    : `/hizmetler#${slug}`
                }
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-sky-500 via-orange-400 to-orange-500 opacity-80" />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100 transition-colors group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:ring-orange-100">
                    {createElement(getServiceIcon(iconKey), {
                      className: "size-6",
                      "aria-hidden": true,
                    })}
                  </div>
                  <ArrowUpRight
                    className="size-5 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-orange-500"
                    aria-hidden="true"
                  />
                </div>

                <h3 className="mt-6 text-lg font-semibold text-slate-950">
                  {serviceTitle}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {shortDescription}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-sm font-semibold text-slate-700">
              Yayında olan hizmet içeriği bulunmuyor.
            </p>
          </div>
        )}

        {showViewAll ? (
          <div className="mt-10 flex justify-center">
            <Link
              href="/hizmetler"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:text-orange-600 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            >
              {viewAllLabel}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
