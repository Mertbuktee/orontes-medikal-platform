import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { publicRoutes } from "@/config/site";
import { getBlogIcon, getPublishedBlogPosts } from "@/content/blog-posts";
import { createPageMetadata } from "@/lib/seo/metadata";

const route = publicRoutes.find((item) => item.path === "/blog");

export const metadata: Metadata = createPageMetadata({
  title: route?.title ?? "Teknik Bilgi ve Servis Notları | Orontes Teknoloji",
  description:
    route?.description ??
    "Medikal cihaz bakım, onarım ve arıza analizi hakkında teknik servis notları.",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <main className="bg-slate-50">
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { name: "Ana Sayfa", path: "/" },
              { name: "Blog", path: "/blog" },
            ]}
          />
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">
              Teknik bilgi
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Medikal cihaz servis notları
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
              Cihaz güvenliği, bakım süreçleri ve arıza analizi hakkında
              bilgilendirici içerikler.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {getPublishedBlogPosts().map(({ id, title, excerpt, category, slug, iconKey }) => {
              const Icon = getBlogIcon(iconKey);

              return (
                <article
                  id={slug}
                  key={id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                      {category}
                    </span>
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                  </div>
                  <h2 className="mt-6 text-xl font-semibold leading-snug text-slate-950">
                    {title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {excerpt}
                  </p>
                  <Link
                    href="/servis-talebi"
                    className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-sky-700 transition hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                  >
                    Konuyla ilgili servis talebi oluştur
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
