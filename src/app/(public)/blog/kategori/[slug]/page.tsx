import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";

import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { formatBlogDate } from "@/lib/blog/blog-date";
import {
  getPublicBlogCategoryBySlug,
  getPublicBlogPosts,
} from "@/lib/blog/public-blog";
import { createPageMetadata } from "@/lib/seo/metadata";
import { createBreadcrumbJsonLd } from "@/lib/seo/structured-data";

type BlogCategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const pageSize = 9;

export async function generateMetadata({
  params,
}: BlogCategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getPublicBlogCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Blog kategorisi bulunamadı | Orontes Teknoloji",
      robots: { index: false, follow: false },
    };
  }

  return createPageMetadata({
    title:
      category.seoTitle ||
      `${category.name} Blog Yazıları | Orontes Teknoloji`,
    description:
      category.seoDescription ||
      category.description ||
      `${category.name} konusunda medikal teknik servis notları.`,
    path: `/blog/kategori/${category.slug}`,
  });
}

export default async function BlogCategoryPage({
  params,
  searchParams,
}: BlogCategoryPageProps) {
  const [{ slug }, queryParams] = await Promise.all([params, searchParams]);
  const category = await getPublicBlogCategoryBySlug(slug);
  if (!category) notFound();

  const currentPage = normalizePage(getParam(queryParams.sayfa));
  const allPosts = await getPublicBlogPosts({ categorySlug: category.slug });
  const totalPages = Math.max(1, Math.ceil(allPosts.length / pageSize));
  if (currentPage > totalPages) notFound();

  const posts = allPosts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  if (!posts.length) notFound();

  const breadcrumbItems = [
    { name: "Ana Sayfa", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: category.name, path: `/blog/kategori/${category.slug}` },
  ];
  const breadcrumbJsonLd = createBreadcrumbJsonLd(breadcrumbItems);

  return (
    <main className="bg-slate-50">
      <Script
        id={`blog-category-breadcrumb-${category.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">
              Blog kategorisi
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {category.name}
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
              {category.description ||
                `${category.name} konusunda yayınlanmış teknik servis notları.`}
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {posts.map((post) => {
              const publishedDate = formatBlogDate(post.publishedAt);

              return (
                <article
                  key={post.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70"
                >
                  {publishedDate ? (
                    <time className="text-xs font-semibold text-slate-400">
                      {publishedDate}
                    </time>
                  ) : null}
                <h2 className="mt-4 text-xl font-semibold leading-snug text-slate-950">
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

          {totalPages > 1 ? (
            <nav
              className="mt-10 flex items-center justify-center gap-3"
              aria-label="Blog kategori sayfaları"
            >
              {Array.from({ length: totalPages }).map((_, index) => {
                const page = index + 1;
                const href =
                  page === 1
                    ? `/blog/kategori/${category.slug}`
                    : `/blog/kategori/${category.slug}?sayfa=${page}`;
                return (
                  <Link
                    key={page}
                    href={href}
                    className={`inline-flex size-11 items-center justify-center rounded-xl border text-sm font-semibold ${
                      page === currentPage
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {page}
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function normalizePage(value: string | undefined) {
  const page = Number(value ?? 1);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
