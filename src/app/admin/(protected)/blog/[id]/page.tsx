import { Archive, ArrowLeft, Eye, Pencil, Send, Undo2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import {
  archiveBlogPost,
  publishBlogPost,
  unpublishBlogPost,
} from "@/app/admin/(protected)/blog/actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BlogArticleRenderer } from "@/components/blog/BlogArticleRenderer";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaBlogRepository } from "@/lib/database/repositories/blog";
import { hasPermission } from "@/lib/rbac/permissions";

type BlogPostDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BlogPostDetailPage({ params }: BlogPostDetailPageProps) {
  const session = await requirePermission("blog.view");
  const { id } = await params;
  const post = await new PrismaBlogRepository(prisma).getAdminPostById(id);

  if (!post) notFound();

  const canUpdate = hasPermission(session.role, "blog.update");
  const canPublish = hasPermission(session.role, "blog.publish");
  const canArchive = hasPermission(session.role, "blog.delete");

  return (
    <div className="space-y-6">
      <Link
        href="/admin/blog"
        className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-orange-600"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Blog yazılarına dön
      </Link>
      <AdminPageHeader
        eyebrow="Blog Önizleme"
        title={post.title}
        description={post.excerpt}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <div className="mb-6 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
              {post.status}
            </span>
            {post.category ? (
              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">
                {post.category.name}
              </span>
            ) : null}
            {post.isFeatured ? (
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-orange-700">
                Öne çıkan
              </span>
            ) : null}
          </div>
          <BlogArticleRenderer blocks={post.content} />
        </article>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <h2 className="text-lg font-semibold text-slate-950">Aksiyonlar</h2>
            <div className="mt-4 grid gap-2">
              {canUpdate ? (
                <Link
                  href={`/admin/blog/${post.id}/edit`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Düzenle
                </Link>
              ) : null}
              <Link
                href={`/admin/blog/${post.id}/preview`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-orange-50"
              >
                <Eye className="size-4" aria-hidden="true" />
                Güvenli Önizleme
              </Link>
              {canPublish && post.status !== "PUBLISHED" && !post.archivedAt ? (
                <ActionButton action={publishBlogPost} id={post.id}>
                  <Send className="size-4" aria-hidden="true" />
                  Yayınla
                </ActionButton>
              ) : null}
              {canPublish && post.status === "PUBLISHED" ? (
                <ActionButton action={unpublishBlogPost} id={post.id}>
                  <Undo2 className="size-4" aria-hidden="true" />
                  Yayından Al
                </ActionButton>
              ) : null}
              {canArchive && !post.archivedAt ? (
                <ActionButton action={archiveBlogPost} id={post.id}>
                  <Archive className="size-4" aria-hidden="true" />
                  Arşivle
                </ActionButton>
              ) : null}
            </div>
          </section>
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <h2 className="text-lg font-semibold text-slate-950">SEO</h2>
            <p className="mt-3 text-sm font-semibold text-slate-900">{post.seoTitle}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{post.seoDescription}</p>
            <p className="mt-3 text-xs text-slate-500">
              /blog/{post.slug} · Revizyon: {post._count.revisions}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ActionButton({
  action,
  id,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  children: ReactNode;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-orange-50">
        {children}
      </button>
    </form>
  );
}
