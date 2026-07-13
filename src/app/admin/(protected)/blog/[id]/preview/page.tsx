import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogArticleRenderer } from "@/components/blog/BlogArticleRenderer";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaBlogRepository } from "@/lib/database/repositories/blog";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type BlogPreviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BlogPreviewPage({ params }: BlogPreviewPageProps) {
  await requirePermission("blog.view");
  const { id } = await params;
  const post = await new PrismaBlogRepository(prisma).getAdminPostById(id);
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <article className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="mb-8 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-semibold text-orange-800">
          Önizleme Modu: Bu sayfa yalnızca oturumlu admin kullanıcılarına açıktır ve public indekslenmez.
        </div>
        <Link
          href={`/admin/blog/${post.id}`}
          className="text-sm font-semibold text-sky-700 transition hover:text-orange-600"
        >
          Admin detayına dön
        </Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">
          {post.category?.name ?? "Kategori seçilmedi"}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
          {post.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">{post.excerpt}</p>
        <div className="mt-10">
          <BlogArticleRenderer blocks={post.content} />
        </div>
      </article>
    </main>
  );
}
