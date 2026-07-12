import type { MediaCategory, MediaUsageType } from "@prisma/client";
import { Archive, FileImage, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { MediaUploadForm } from "@/components/admin/media/MediaUploadForm";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import {
  normalizeMediaPage,
  normalizeMediaPageSize,
  PrismaMediaRepository,
  type MediaSort,
} from "@/lib/database/repositories/media";
import {
  mediaCategories,
  mediaPageSizes,
  mediaUsageTypes,
} from "@/lib/media/media-types";

type AdminMediaPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminMediaPage({
  searchParams,
}: AdminMediaPageProps) {
  await requirePermission("media.view");

  const params = await searchParams;
  const filters = parseFilters(params);
  const repository = new PrismaMediaRepository(prisma);
  const result = await repository.listMedia(filters);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Medya Yönetimi"
        title="Medya Kütüphanesi"
        description="Site görsellerini güvenli şekilde yükleyin, sınıflandırın ve içeriklerde yeniden kullanıma hazırlayın."
      />

      <MediaUploadForm />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
        <form
          action="/admin/media"
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.3fr_repeat(6,minmax(0,1fr))_auto]"
        >
          <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 md:col-span-2 xl:col-span-1">
            <Search className="size-4 text-slate-400" aria-hidden="true" />
            <input
              name="q"
              defaultValue={filters.query}
              maxLength={120}
              placeholder="Başlık, dosya adı veya alt metin"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
          <SelectFilter name="category" value={filters.category ?? ""}>
            <option value="">Tüm kategoriler</option>
            {mediaCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </SelectFilter>
          <SelectFilter name="usageType" value={filters.usageType ?? ""}>
            <option value="">Tüm kullanımlar</option>
            {mediaUsageTypes.map((usageType) => (
              <option key={usageType} value={usageType}>
                {usageType}
              </option>
            ))}
          </SelectFilter>
          <SelectFilter name="archived" value={filters.archived}>
            <option value="active">Aktif</option>
            <option value="archived">Arşiv</option>
            <option value="all">Tümü</option>
          </SelectFilter>
          <SelectFilter name="used" value={filters.used}>
            <option value="all">Kullanım fark etmez</option>
            <option value="used">Kullanılan</option>
            <option value="unused">Kullanılmayan</option>
          </SelectFilter>
          <SelectFilter name="sort" value={filters.sort}>
            <option value="newest">Yeni önce</option>
            <option value="oldest">Eski önce</option>
            <option value="filename">Dosya adı</option>
            <option value="largest">Büyük dosya</option>
            <option value="smallest">Küçük dosya</option>
          </SelectFilter>
          <SelectFilter name="pageSize" value={String(filters.pageSize)}>
            {mediaPageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </SelectFilter>
          <input type="hidden" name="page" value="1" />
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
          >
            Filtrele
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Medya Dosyaları
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {result.total} kayıt, sayfa {result.page}/{result.totalPages}
            </p>
          </div>
          <div className="flex gap-2">
            <PageLink disabled={result.page <= 1} href={buildListHref({ ...filters, page: result.page - 1 })}>
              Önceki
            </PageLink>
            <PageLink disabled={result.page >= result.totalPages} href={buildListHref({ ...filters, page: result.page + 1 })}>
              Sonraki
            </PageLink>
          </div>
        </div>

        {result.items.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {result.items.map((media) => {
              const usageCount =
                media._count.heroSlides + media._count.blogPostCovers;
              const hasThumbnail = media.variants.some(
                (variant) => variant.variant === "THUMBNAIL"
              );

              return (
                <Link
                  key={media.id}
                  href={`/admin/media/${media.id}`}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  <div className="relative aspect-[4/3] bg-slate-100">
                    {media.archivedAt ? (
                      <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-slate-950/80 px-2.5 py-1 text-xs font-semibold text-white">
                        <Archive className="size-3" aria-hidden="true" />
                        Arşiv
                      </span>
                    ) : null}
                    {hasThumbnail ? (
                      <Image
                        src={`/media/${media.id}/THUMBNAIL`}
                        alt={media.altText || media.title}
                        fill
                        sizes="(min-width: 1536px) 25vw, (min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <FileImage className="size-10" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="line-clamp-1 text-sm font-semibold text-slate-950">
                      {media.title}
                    </p>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                      {media.originalName}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">
                        {media.category}
                      </span>
                      <span className="rounded-full bg-orange-50 px-2.5 py-1 text-orange-700">
                        {media.width}x{media.height}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-slate-600">
                        {usageCount ? `${usageCount} kullanım` : "Kullanılmıyor"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <FileImage className="mx-auto size-10 text-slate-400" aria-hidden="true" />
            <h3 className="mt-4 text-base font-semibold text-slate-950">
              Henüz medya dosyası bulunmuyor.
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              İlk görseli yükleyerek medya kütüphanesini başlatabilirsiniz.
            </p>
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
      className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
    >
      {children}
    </select>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-disabled={disabled}
      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 aria-disabled:pointer-events-none aria-disabled:opacity-40"
    >
      {children}
    </Link>
  );
}

type ParsedMediaFilters = {
  query?: string;
  category?: MediaCategory;
  usageType?: MediaUsageType;
  archived: "active" | "archived" | "all";
  used: "used" | "unused" | "all";
  page: number;
  pageSize: number;
  sort: MediaSort;
};

function parseFilters(
  params: Record<string, string | string[] | undefined>
): ParsedMediaFilters {
  return {
    query: getParam(params.q)?.slice(0, 120),
    category: parseCategory(getParam(params.category)),
    usageType: parseUsageType(getParam(params.usageType)),
    archived: parseArchive(getParam(params.archived)),
    used: parseUsed(getParam(params.used)),
    page: normalizeMediaPage(Number(getParam(params.page))),
    pageSize: normalizeMediaPageSize(Number(getParam(params.pageSize))),
    sort: parseSort(getParam(params.sort)),
  };
}

function buildListHref(filters: ParsedMediaFilters) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.category) params.set("category", filters.category);
  if (filters.usageType) params.set("usageType", filters.usageType);
  if (filters.archived !== "active") params.set("archived", filters.archived);
  if (filters.used !== "all") params.set("used", filters.used);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.pageSize !== 24) params.set("pageSize", String(filters.pageSize));
  if (filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `/admin/media?${query}` : "/admin/media";
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseCategory(value: string | undefined) {
  return mediaCategories.some((category) => category === value)
    ? (value as MediaCategory)
    : undefined;
}

function parseUsageType(value: string | undefined) {
  return mediaUsageTypes.some((usageType) => usageType === value)
    ? (value as MediaUsageType)
    : undefined;
}

function parseArchive(value: string | undefined) {
  return value === "archived" || value === "all" ? value : "active";
}

function parseUsed(value: string | undefined) {
  return value === "used" || value === "unused" ? value : "all";
}

function parseSort(value: string | undefined): MediaSort {
  if (
    value === "oldest" ||
    value === "filename" ||
    value === "largest" ||
    value === "smallest"
  ) {
    return value;
  }
  return "newest";
}
