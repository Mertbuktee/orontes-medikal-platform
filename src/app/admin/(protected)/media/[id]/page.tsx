import {
  Archive,
  ArrowLeft,
  RotateCcw,
  Save,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaMediaRepository } from "@/lib/database/repositories/media";
import { mediaCategories, mediaUsageTypes } from "@/lib/media/media-types";
import { hasPermission } from "@/lib/rbac/permissions";

import {
  archiveMedia,
  deleteUnusedMedia,
  restoreMedia,
  updateMediaMetadata,
} from "../actions";

type AdminMediaDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminMediaDetailPage({
  params,
}: AdminMediaDetailPageProps) {
  const session = await requirePermission("media.view");
  const { id } = await params;
  const repository = new PrismaMediaRepository(prisma);
  const media = await repository.getMediaById(id);

  if (!media) {
    notFound();
  }

  const usage = repository.getUsage(media);
  const canUpdate = hasPermission(session.role, "media.update");
  const canDelete = hasPermission(session.role, "media.delete");
  const previewVariant =
    media.variants.find((variant) => variant.variant === "MEDIUM") ??
    media.variants.find((variant) => variant.variant === "ORIGINAL");

  return (
    <div className="space-y-6">
      <Link
        href="/admin/media"
        className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Medya kütüphanesine dön
      </Link>

      <AdminPageHeader
        eyebrow="Medya Detayı"
        title={media.title}
        description="Görsel varyantlarını, kullanım durumunu ve metadata bilgilerini yönetin."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
            <div className="relative aspect-video bg-slate-100">
              {previewVariant ? (
                <Image
                  src={`/media/${media.id}/${previewVariant.variant}`}
                  alt={media.altText || media.title}
                  fill
                  sizes="(min-width: 1280px) 60vw, 100vw"
                  className="object-contain"
                />
              ) : null}
            </div>
            <div className="grid gap-3 p-5 text-sm text-slate-600 md:grid-cols-3">
              <Info label="MIME" value={media.mimeType} />
              <Info label="Boyut" value={formatFileSize(media.size)} />
              <Info label="Ölçü" value={`${media.width ?? "-"}x${media.height ?? "-"}`} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
            <h2 className="text-lg font-semibold text-slate-950">Varyantlar</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {media.variants.map((variant) => (
                <a
                  key={variant.id}
                  href={`/media/${media.id}/${variant.variant}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-orange-200 hover:bg-orange-50"
                >
                  <p className="text-sm font-semibold text-slate-950">
                    {variant.variant}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {variant.width ?? "-"}x{variant.height ?? "-"} -{" "}
                    {formatFileSize(variant.size)}
                  </p>
                </a>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
            <h2 className="text-lg font-semibold text-slate-950">Kullanım</h2>
            {usage.length ? (
              <div className="mt-4 space-y-3">
                {usage.map((item) => (
                  <Link
                    key={`${item.entityType}-${item.entityId}`}
                    href={item.adminUrl}
                    className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-800 transition hover:border-orange-200 hover:bg-orange-50"
                  >
                    {item.entityType}: {item.title}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                Bu medya şu anda hiçbir içerikte kullanılmıyor.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
            <h2 className="text-lg font-semibold text-slate-950">Metadata</h2>
            <form action={updateMediaMetadata} className="mt-5 space-y-3">
              <input type="hidden" name="id" value={media.id} />
              <Field name="title" label="Başlık" defaultValue={media.title} disabled={!canUpdate} />
              <Field name="altText" label="Alt metin" defaultValue={media.altText ?? ""} disabled={!canUpdate} />
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Açıklama
                </span>
                <textarea
                  name="description"
                  defaultValue={media.description ?? ""}
                  maxLength={1000}
                  disabled={!canUpdate}
                  className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none disabled:opacity-60"
                />
              </label>
              <Select name="category" label="Kategori" defaultValue={media.category} disabled={!canUpdate} options={mediaCategories} />
              <Select name="usageType" label="Kullanım" defaultValue={media.usageType} disabled={!canUpdate} options={mediaUsageTypes} />
              {canUpdate ? (
                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  Kaydet
                  <Save className="size-4" aria-hidden="true" />
                </button>
              ) : null}
            </form>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
            <h2 className="text-lg font-semibold text-slate-950">İşlemler</h2>
            <div className="mt-4 space-y-3">
              {canUpdate && !media.archivedAt ? (
                <form action={archiveMedia}>
                  <input type="hidden" name="id" value={media.id} />
                  <ActionButton icon={Archive}>Arşivle</ActionButton>
                </form>
              ) : null}
              {canUpdate && media.archivedAt ? (
                <form action={restoreMedia}>
                  <input type="hidden" name="id" value={media.id} />
                  <ActionButton icon={RotateCcw}>Geri Al</ActionButton>
                </form>
              ) : null}
              {canDelete && usage.length === 0 ? (
                <form action={deleteUnusedMedia}>
                  <input type="hidden" name="id" value={media.id} />
                  <ActionButton icon={Trash2} danger>
                    Kullanılmayan Medyayı Sil
                  </ActionButton>
                </form>
              ) : null}
              {usage.length > 0 ? (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Kullanılan medya silinemez. Önce bağlı içerikler güncellenmelidir.
                </p>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
  disabled,
}: {
  name: string;
  label: string;
  defaultValue: string;
  disabled: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        name={name}
        required
        defaultValue={defaultValue}
        disabled={disabled}
        className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none disabled:opacity-60"
      />
    </label>
  );
}

function Select({
  name,
  label,
  defaultValue,
  disabled,
  options,
}: {
  name: string;
  label: string;
  defaultValue: string;
  disabled: boolean;
  options: readonly string[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ActionButton({
  icon: Icon,
  children,
  danger = false,
}: {
  icon: LucideIcon;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="submit"
      className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition ${
        danger
          ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
          : "border border-slate-200 bg-slate-50 text-slate-800 hover:bg-orange-50"
      }`}
    >
      <Icon className="size-4" aria-hidden="true" />
      {children}
    </button>
  );
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
