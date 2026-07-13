import { Archive, Eye, Pencil, Plus, Search, Send, Undo2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  archiveBlogPost,
  publishBlogPost,
  unpublishBlogPost,
} from "@/app/admin/(protected)/blog/actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaBlogRepository } from "@/lib/database/repositories/blog";
import { hasPermission } from "@/lib/rbac/permissions";

type AdminBlogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminBlogPage({ searchParams }: AdminBlogPageProps) {
  const session = await requirePermission("blog.view");
  const params = await searchParams;
  const filters = {
    query: getParam(params.query),
    status: getParam(params.status) as "DRAFT" | "PUBLISHED" | "ARCHIVED" | "all" | undefined,
    categoryId: getParam(params.categoryId),
    page: Number(getParam(params.page) ?? 1),
    pageSize: Number(getParam(params.pageSize) ?? 20),
    sort: getParam(params.sort) as "newest" | "oldest" | "updated" | "published" | undefined,
  };
  const repository = new PrismaBlogRepository(prisma);
  const [result, categories] = await Promise.all([
    repository.listAdminPosts(filters),
    repository.listAdminCategories(),
  ]);
  const canCreate = hasPermission(session.role, "blog.create");
  const canUpdate = hasPermission(session.role, "blog.update");
  const canPublish = hasPermission(session.role, "blog.publish");
  const canArchive = hasPermission(session.role, "blog.delete");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="İçerik Yönetimi"
        title="Blog Yazıları"
        description="Teknik içerikleri, taslakları ve yayınlanan blog yazılarını yönetin."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {result.total} kayıt, sayfa {result.page}/{result.totalPages}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/blog/categories"
            className="inline-flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-orange-50"
          >
            Kategoriler
          </Link>
          {canCreate ? (
            <Link
              href="/admin/blog/new"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
            >
              <Plus className="size-4" aria-hidden="true" />
              Yeni Blog Yazısı
            </Link>
          ) : null}
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
        <form
          action="/admin/blog"
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.6fr_repeat(4,minmax(0,1fr))_auto]"
        >
          <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 md:col-span-2 xl:col-span-1">
            <Search className="size-4 text-slate-400" aria-hidden="true" />
            <input
              name="query"
              defaultValue={filters.query}
              maxLength={120}
              placeholder="Başlık, slug veya özet ara"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <SelectFilter name="status" value={filters.status ?? "all"}>
            <option value="all">Tüm durumlar</option>
            <option value="DRAFT">Taslak</option>
            <option value="PUBLISHED">Yayında</option>
            <option value="ARCHIVED">Arşiv</option>
          </SelectFilter>
          <SelectFilter name="categoryId" value={filters.categoryId ?? ""}>
            <option value="">Tüm kategoriler</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectFilter>
          <SelectFilter name="sort" value={filters.sort ?? "newest"}>
            <option value="newest">Yeni</option>
            <option value="oldest">Eski</option>
            <option value="updated">Son güncellenen</option>
            <option value="published">Yayın tarihi</option>
          </SelectFilter>
          <SelectFilter name="pageSize" value={String(filters.pageSize)}>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </SelectFilter>
          <input type="hidden" name="page" value="1" />
          <button className="min-h-12 rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white">
            Filtrele
          </button>
        </form>
      </section>

      <section className="grid gap-4">
        {result.items.length ? (
          result.items.map((post) => (
            <article
              key={post.id}
              className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 lg:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <StatusBadge status={post.status} scheduledFor={post.scheduledFor} />
                  {post.isFeatured ? (
                    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-orange-700">
                      Öne çıkan
                    </span>
                  ) : null}
                  {post.category ? (
                    <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">
                      {post.category.name}
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-3 text-lg font-semibold text-slate-950">
                  {post.title}
                </h2>
                <p className="mt-1 text-sm font-semibold text-sky-700">
                  /blog/{post.slug}
                </p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                  {post.excerpt}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Yazar: {post.author?.name ?? "-"} · Güncelleme:{" "}
                  {post.updatedAt.toLocaleDateString("tr-TR")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <IconLink href={`/admin/blog/${post.id}`} label="Detay">
                  <Eye className="size-4" aria-hidden="true" />
                </IconLink>
                {canUpdate ? (
                  <IconLink href={`/admin/blog/${post.id}/edit`} label="Düzenle">
                    <Pencil className="size-4" aria-hidden="true" />
                  </IconLink>
                ) : null}
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
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm font-semibold text-slate-500">
            Henüz blog yazısı bulunmuyor.
          </div>
        )}
      </section>
    </div>
  );
}

function SelectFilter({
  name,
  value,
  children,
}: {
  name: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <select
      name={name}
      defaultValue={value}
      className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
    >
      {children}
    </select>
  );
}

function StatusBadge({
  status,
  scheduledFor,
}: {
  status: string;
  scheduledFor: Date | null;
}) {
  const scheduled = status === "DRAFT" && scheduledFor && scheduledFor > new Date();
  const label = scheduled
    ? "Planlandı"
    : status === "PUBLISHED"
      ? "Yayında"
      : status === "ARCHIVED"
        ? "Arşiv"
        : "Taslak";

  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
      {label}
    </span>
  );
}

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition hover:bg-orange-50"
    >
      {children}
      {label}
    </Link>
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
      <button className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition hover:bg-orange-50">
        {children}
      </button>
    </form>
  );
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
