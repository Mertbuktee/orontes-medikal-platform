import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";

import { BlogArticleRenderer } from "@/components/blog/BlogArticleRenderer";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { absoluteUrl } from "@/config/site";
import { formatBlogDate, parseBlogDate, toBlogIsoString } from "@/lib/blog/blog-date";
import {
  getPublicBlogPostBySlug,
  getPublicBlogPosts,
  incrementPublicBlogPostView,
} from "@/lib/blog/public-blog";
import { getMediaVariantUrl } from "@/lib/media/media-url";
import { createPageMetadata } from "@/lib/seo/metadata";
import {
  createArticleJsonLd,
  createBreadcrumbJsonLd,
} from "@/lib/seo/structured-data";

type BlogDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicBlogPostBySlug(slug);

  if (!post) {
    return createPageMetadata({
      title: "Blog yazısı bulunamadı | Orontes Teknoloji",
      description: "Aradığınız blog yazısı yayında değil veya kaldırılmış olabilir.",
      path: `/blog/${slug}`,
    });
  }

  return {
    ...createPageMetadata({
      title: post.seoTitle,
      description: post.seoDescription,
      path: `/blog/${post.slug}`,
    }),
    openGraph: {
      title: post.seoTitle,
      description: post.seoDescription,
      url: absoluteUrl(`/blog/${post.slug}`),
      type: "article",
      locale: "tr_TR",
      images: post.openGraphImageId
        ? [{ url: absoluteUrl(getMediaVariantUrl(post.openGraphImageId, "LARGE")) }]
        : undefined,
      publishedTime: toBlogIsoString(post.publishedAt),
      modifiedTime: toBlogIsoString(post.updatedAt),
      authors: post.authorName ? [post.authorName] : undefined,
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = await getPublicBlogPostBySlug(slug);
  if (!post) notFound();
  await incrementPublicBlogPostView(post.slug);
  const dateModified = parseBlogDate(post.updatedAt);
  if (!dateModified) notFound();

  const related = (await getPublicBlogPosts({ limit: 4 }))
    .filter((item) => item.id !== post.id)
    .slice(0, 3);
  const breadcrumbItems = [
    { name: "Ana Sayfa", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ];
  const articleJsonLd = createArticleJsonLd({
    path: `/blog/${post.slug}`,
    headline: post.title,
    description: post.excerpt,
    image: post.openGraphImageId
      ? absoluteUrl(getMediaVariantUrl(post.openGraphImageId, "LARGE"))
      : null,
    datePublished: parseBlogDate(post.publishedAt),
    dateModified,
    authorName: post.authorName,
  });
  const breadcrumbJsonLd = createBreadcrumbJsonLd(breadcrumbItems);

  return (
    <main className="bg-slate-50">
      <Script
        id={`article-jsonld-${post.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Script
        id={`breadcrumb-jsonld-${post.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <article className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={breadcrumbItems} />
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">
            {post.category?.name ?? "Teknik Not"}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">{post.excerpt}</p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-500">
            {formatBlogDate(post.publishedAt) ? (
              <time>{formatBlogDate(post.publishedAt)}</time>
            ) : null}
            {post.authorName ? <span>{post.authorName}</span> : null}
            <span>{estimateReadingMinutes(post.content)} dk tahmini okuma</span>
          </div>

          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 sm:p-10">
            <BlogArticleRenderer blocks={post.content} />
          </div>

          <div className="mt-10 rounded-3xl bg-slate-950 p-6 text-white">
            <h2 className="text-2xl font-semibold">
              Cihazınız için teknik destek mi gerekiyor?
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Arıza, bakım veya elektronik kart onarımı için servis talebinizi
              güvenli form üzerinden iletebilirsiniz.
            </p>
            <Link
              href="/servis-talebi"
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white"
            >
              Servis Talebi Oluştur
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          {related.length ? (
            <section className="mt-12">
              <h2 className="text-2xl font-semibold text-slate-950">
                İlgili servis notları
              </h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    href={`/blog/${item.slug}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 transition hover:border-orange-200 hover:text-orange-600"
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </article>
    </main>
  );
}

function estimateReadingMinutes(blocks: Array<{ type: string } & Record<string, unknown>>) {
  const text = blocks
    .map((block) => {
      if ("text" in block && typeof block.text === "string") return block.text;
      if ("items" in block && Array.isArray(block.items)) return block.items.join(" ");
      return "";
    })
    .join(" ");
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 180));
}
