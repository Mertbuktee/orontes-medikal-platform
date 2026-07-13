import { Archive, ArrowDown, ArrowUp, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  archiveBlogCategory,
  moveBlogCategory,
} from "@/app/admin/(protected)/blog/actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaBlogRepository } from "@/lib/database/repositories/blog";

export default async function BlogCategoriesPage() {
  await requirePermission("blog.categories.manage");
  const categories = await new PrismaBlogRepository(prisma).listAdminCategories({
    includeArchived: true,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Blog CMS"
        title="Blog Kategorileri"
        description="Blog yazıları için kategori, slug, aktiflik ve sıralama yönetimi."
      />
      <div className="flex justify-end">
        <Link
          href="/admin/blog/categories/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
        >
          <Plus className="size-4" aria-hidden="true" />
          Yeni Kategori
        </Link>
      </div>
      <section className="grid gap-4">
        {categories.map((category, index) => (
          <article
            key={category.id}
            className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 lg:grid-cols-[1fr_auto]"
          >
            <div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-orange-700">
                  #{category.order}
                </span>
                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">
                  {category._count.posts} yayın
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                  {category.isActive ? "Aktif" : "Pasif"}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-slate-950">
                {category.name}
              </h2>
              <p className="mt-1 text-sm text-sky-700">/blog/kategori/{category.slug}</p>
              {category.description ? (
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {category.description}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <MoveButton id={category.id} direction="up" disabled={index === 0}>
                <ArrowUp className="size-4" aria-hidden="true" />
              </MoveButton>
              <MoveButton
                id={category.id}
                direction="down"
                disabled={index === categories.length - 1}
              >
                <ArrowDown className="size-4" aria-hidden="true" />
              </MoveButton>
              <Link
                href={`/admin/blog/categories/${category.id}/edit`}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition hover:bg-orange-50"
              >
                <Pencil className="size-4" aria-hidden="true" />
                Düzenle
              </Link>
              {!category.archivedAt ? (
                <form action={archiveBlogCategory}>
                  <input type="hidden" name="id" value={category.id} />
                  <button className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition hover:bg-orange-50">
                    <Archive className="size-4" aria-hidden="true" />
                    Arşivle
                  </button>
                </form>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function MoveButton({
  id,
  direction,
  disabled,
  children,
}: {
  id: string;
  direction: "up" | "down" | "first" | "last";
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <form action={moveBlogCategory}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="direction" value={direction} />
      <button
        disabled={disabled}
        className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-orange-50 disabled:opacity-40"
      >
        {children}
      </button>
    </form>
  );
}
