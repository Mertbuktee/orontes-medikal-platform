import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaHeroSlideRepository } from "@/lib/database/repositories/hero-slides";
import { getMediaVariantUrl } from "@/lib/media/media-url";
import { hasPermission } from "@/lib/rbac/permissions";

import { deleteHeroSlide } from "../actions";

type HeroSlideDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function HeroSlideDetailPage({
  params,
}: HeroSlideDetailPageProps) {
  const session = await requirePermission("heroSlides.view");
  const { id } = await params;
  const repository = new PrismaHeroSlideRepository(prisma);
  const slide = await repository.getAdminSlideById(id);

  if (!slide) {
    notFound();
  }

  const canUpdate = hasPermission(session.role, "heroSlides.update");
  const canDelete = hasPermission(session.role, "heroSlides.delete");
  const previewVariant =
    slide.image.variants.find((variant) => variant.variant === "LARGE") ??
    slide.image.variants.find((variant) => variant.variant === "ORIGINAL");

  return (
    <div className="space-y-6">
      <Link
        href="/admin/hero-slides"
        className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-orange-50"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Hero slider listesine dön
      </Link>

      <AdminPageHeader
        eyebrow="Önizleme"
        title={slide.title}
        description="Bu önizleme yayın durumunu değiştirmez; aktif/pasif kontrolü liste ekranından yönetilir."
      />

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-sm shadow-slate-200/60">
        <div className="relative min-h-[420px]">
          {previewVariant ? (
            <Image
              src={getMediaVariantUrl(slide.image.id, previewVariant.variant)}
              alt={slide.imageAlt}
              fill
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: slide.objectPosition }}
            />
          ) : null}
          <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/45 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-10">
            {slide.badge ? (
              <span className="rounded-full border border-orange-300/40 bg-orange-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-100">
                {slide.badge}
              </span>
            ) : null}
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold md:text-5xl">
              {slide.title}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">
              {slide.description}
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        {canUpdate ? (
          <Link
            href={`/admin/hero-slides/${slide.id}/edit`}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            <Pencil className="size-4" aria-hidden="true" />
            Düzenle
          </Link>
        ) : null}
        {canDelete ? (
          <form action={deleteHeroSlide}>
            <input type="hidden" name="id" value={slide.id} />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Sil
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
