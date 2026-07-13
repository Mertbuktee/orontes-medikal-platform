import { ArrowRight, ArrowUpRight, BookOpenText } from "lucide-react";
import Link from "next/link";

import { getPublicBlogPosts } from "@/lib/blog/public-blog";

type BlogPreviewProps = {
  title?: string;
  description?: string;
  itemLimit?: number;
  showViewAll?: boolean;
  viewAllLabel?: string;
};

export default async function BlogPreview({
  title = "Teknik Bilgi ve Servis Notları",
  description = "Medikal cihaz bakım, onarım ve arıza süreçleri hakkında bilgilendirici içerikler.",
  itemLimit = 3,
  showViewAll = true,
  viewAllLabel = "Tüm Yazıları Gör",
}: BlogPreviewProps) {
  const posts = await getPublicBlogPosts({
    limit: itemLimit,
    featuredOnly: true,
  });

  return (
    <section
      id="blog"
      className="relative overflow-hidden bg-slate-50 py-16 sm:py-20 lg:py-24"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_10%,rgba(14,165,233,0.14),transparent_30%),radial-gradient(circle_at_88%_18%,rgba(249,115,22,0.13),transparent_28%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            {description}
          </p>
        </div>

        {posts.length ? (
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-slate-200/80"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-sky-500 via-orange-400 to-orange-500 opacity-80" />

                <div className="flex items-start justify-between gap-4">
                  <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                    {post.category?.name ?? "Teknik Not"}
                  </span>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100 transition-colors group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:ring-orange-100">
                    <BookOpenText className="size-5" aria-hidden="true" />
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-semibold leading-snug text-slate-950">
                  {post.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 md:min-h-20">
                  {post.excerpt}
                </p>

                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-sky-700 transition-colors hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                  aria-label={`${post.title} yazısını incele`}
                >
                  Yazıyı İncele
                  <ArrowUpRight
                    className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-semibold text-slate-500">
            Yayında öne çıkan blog yazısı bulunmuyor.
          </div>
        )}

        {showViewAll ? (
          <div className="mt-10 flex justify-center">
            <Link
              href="/blog"
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
