import type { Metadata } from "next";
import { ArrowUpRight, Search } from "lucide-react";
import Link from "next/link";

import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { publicRoutes } from "@/config/site";
import { formatBlogDate } from "@/lib/blog/blog-date";
import { getPublicBlogCategories, getPublicBlogPosts } from "@/lib/blog/public-blog";
import { createPageMetadata } from "@/lib/seo/metadata";

const route = publicRoutes.find((item) => item.path === "/blog");

export const metadata: Metadata = createPageMetadata({
  title: route?.title ?? "Teknik Bilgi ve Servis Notları | Orontes Teknoloji",
  description:
    route?.description ??
    "Medikal cihaz bakım, onarım ve arıza analizi hakkında teknik servis notları.",
  path: "/blog",
});

type BlogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const categorySlug = getParam(params.kategori);
  const query = getParam(params.q);
  const [posts, categories] = await Promise.all([
    getPublicBlogPosts({ categorySlug, query }),
    getPublicBlogCategories(),
  ]);

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

          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
            <form action="/blog" className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
              <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
                <Search className="size-4 text-slate-400" aria-hidden="true" />
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Blog içinde ara"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </div>
              <select
                name="kategori"
                defaultValue={categorySlug ?? ""}
                className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
              >
                <option value="">Tüm kategoriler</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button className="min-h-12 rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white">
                Filtrele
              </button>
            </form>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {posts.map((post) => {
              const publishedDate = formatBlogDate(post.publishedAt);

              return (
                <article
                  key={post.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                      {post.category?.name ?? "Teknik Not"}
                    </span>
                    {publishedDate ? (
                      <time className="text-xs font-semibold text-slate-400">
                        {publishedDate}
                      </time>
                    ) : null}
                  </div>
                <h2 className="mt-6 text-xl font-semibold leading-snug text-slate-950">
                  {post.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {post.excerpt}
                </p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-sky-700 transition hover:text-orange-600"
                >
                  Yazıyı İncele
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </article>
              );
            })}
          </div>

          {!posts.length ? (
            <div className="mt-12 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-semibold text-slate-500">
              Yayında blog yazısı bulunmuyor.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
