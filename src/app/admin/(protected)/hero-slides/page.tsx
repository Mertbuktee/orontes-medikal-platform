import {
  ArrowDown,
  ArrowUp,
  ChevronsDown,
  ChevronsUp,
  Copy,
  Eye,
  Pencil,
  Plus,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaHeroSlideRepository } from "@/lib/database/repositories/hero-slides";
import { getMediaVariantUrl } from "@/lib/media/media-url";

import {
  moveHeroSlide,
  duplicateHeroSlide,
  toggleHeroSlideActive,
  toggleHeroSlideAutoplay,
  updateHeroSliderSettings,
} from "./actions";

export default async function AdminHeroSlidesPage() {
  await requirePermission("heroSlides.view");

  const repository = new PrismaHeroSlideRepository(prisma);
  const [slides, settings] = await Promise.all([
    repository.listAdminSlides(),
    repository.getSliderSettings(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Hero Slider"
        title="Hero Slider Yönetimi"
        description="Ana sayfanın Hero alanında gösterilen servis görsellerini ve içeriklerini yönetin."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/hero-slides/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
        >
          <Plus className="size-4" aria-hidden="true" />
          Yeni Slayt Ekle
        </Link>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
        <h2 className="text-lg font-semibold text-slate-950">Slider Ayarları</h2>
        <form
          action={updateHeroSliderSettings}
          className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-7"
        >
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Autoplay aralığı (milisaniye)
            </span>
            <input
              name="autoplayIntervalMs"
              type="number"
              min={3000}
              max={15000}
              defaultValue={settings.autoplayIntervalMs}
              className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Geçiş süresi (milisaniye)
            </span>
            <input
              name="transitionDurationMs"
              type="number"
              min={200}
              max={1500}
              defaultValue={settings.transitionDurationMs}
              className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm"
            />
          </label>
          <SettingCheck name="autoplayEnabled" label="Autoplay aktif" checked={settings.autoplayEnabled} />
          <SettingCheck name="pauseOnHover" label="Hover'da duraklat" checked={settings.pauseOnHover} />
          <SettingCheck name="showPagination" label="Noktaları göster" checked={settings.showPagination} />
          <SettingCheck name="showArrows" label="Okları göster" checked={settings.showArrows} />
          <SettingCheck name="showSlideCounter" label="Slayt sayacını göster" checked={settings.showSlideCounter} />
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-orange-500 xl:col-span-7"
          >
            Ayarları Kaydet
          </button>
        </form>
      </section>

      <section className="grid gap-4">
        {slides.length ? (
          slides.map((slide, index) => {
            const thumbnail = slide.image.variants.some(
              (variant) => variant.variant === "THUMBNAIL"
            );

            return (
              <article
                key={slide.id}
                className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 lg:grid-cols-[220px_1fr_auto]"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
                  {thumbnail ? (
                    <Image
                      src={getMediaVariantUrl(slide.image.id, "THUMBNAIL")}
                      alt={slide.imageAlt || slide.title}
                      fill
                      sizes="220px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-orange-700">
                      #{slide.order}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 ${slide.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {slide.isActive ? "Aktif" : "Pasif"}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 ${slide.includeInAutoplay ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-500"}`}>
                      {slide.includeInAutoplay ? "Autoplay dahil" : "Autoplay hariç"}
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-slate-950">
                    {slide.title}
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                    {slide.description}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">
                    Güncelleyen: {slide.updatedBy?.name ?? "-"} ·{" "}
                    {slide.updatedAt.toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:max-w-[220px]">
                  <IconLink href={`/admin/hero-slides/${slide.id}`} label="Önizle" icon={Eye} />
                  <IconLink href={`/admin/hero-slides/${slide.id}/edit`} label="Düzenle" icon={Pencil} />
                  <form action={duplicateHeroSlide}>
                    <input type="hidden" name="id" value={slide.id} />
                    <SmallButton icon={Copy}>Kopyala</SmallButton>
                  </form>
                  <MoveButton id={slide.id} direction="first" label="İlk sıraya taşı" icon={ChevronsUp} disabled={index === 0} />
                  <MoveButton id={slide.id} direction="up" label="Yukarı taşı" icon={ArrowUp} disabled={index === 0} />
                  <MoveButton id={slide.id} direction="down" label="Aşağı taşı" icon={ArrowDown} disabled={index === slides.length - 1} />
                  <MoveButton id={slide.id} direction="last" label="Son sıraya taşı" icon={ChevronsDown} disabled={index === slides.length - 1} />
                  <form action={toggleHeroSlideActive}>
                    <input type="hidden" name="id" value={slide.id} />
                    <input type="hidden" name="isActive" value={String(!slide.isActive)} />
                    <SmallButton>{slide.isActive ? "Pasifleştir" : "Aktifleştir"}</SmallButton>
                  </form>
                  <form action={toggleHeroSlideAutoplay}>
                    <input type="hidden" name="id" value={slide.id} />
                    <input type="hidden" name="includeInAutoplay" value={String(!slide.includeInAutoplay)} />
                    <SmallButton>{slide.includeInAutoplay ? "Autoplay çıkar" : "Autoplay ekle"}</SmallButton>
                  </form>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-lg font-semibold text-slate-950">
              Henüz Hero slider içeriği bulunmuyor.
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Ana sayfa Hero alanını yönetmek için ilk slaytı ekleyin.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function SettingCheck({
  name,
  label,
  checked,
}: {
  name: string;
  label: string;
  checked: boolean;
}) {
  return (
    <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800">
      <input
        type="checkbox"
        name={name}
        value="true"
        defaultChecked={checked}
        className="size-4 accent-orange-500"
      />
      {label}
    </label>
  );
}

function IconLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition hover:bg-orange-50"
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

function MoveButton({
  id,
  direction,
  label,
  icon: Icon,
  disabled,
}: {
  id: string;
  direction: "up" | "down" | "first" | "last";
  label: string;
  icon: LucideIcon;
  disabled: boolean;
}) {
  return (
    <form action={moveHeroSlide}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={disabled}
        aria-label={label}
        className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-orange-50 disabled:opacity-40"
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}

function SmallButton({
  children,
  icon: Icon,
}: {
  children: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="submit"
      className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition hover:bg-orange-50"
    >
      {Icon ? <Icon className="mr-2 size-4" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}



