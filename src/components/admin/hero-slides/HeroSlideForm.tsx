import type { Media } from "@prisma/client";
import Image from "next/image";

import {
  createHeroSlide,
  updateHeroSlide,
} from "@/app/admin/(protected)/hero-slides/actions";
import { heroObjectPositions } from "@/lib/hero-slider/hero-slide-validation";
import { mediaCategoryLabels } from "@/lib/media/media-types";
import { getMediaVariantUrl } from "@/lib/media/media-url";

type SelectableMedia = Media & {
  variants: { variant: "ORIGINAL" | "THUMBNAIL" | "MEDIUM" | "LARGE" }[];
  _count: { heroSlides: number; blogPostCovers: number };
};

type HeroSlideFormValue = {
  id?: string;
  badge: string | null;
  title: string;
  description: string;
  imageId: string;
  imageAlt: string;
  linkLabel: string | null;
  linkUrl: string | null;
  objectPosition: string;
  order: number;
  isActive: boolean;
  includeInAutoplay: boolean;
};

export function HeroSlideForm({
  slide,
  mediaItems,
  mode,
}: {
  slide?: HeroSlideFormValue;
  mediaItems: SelectableMedia[];
  mode: "create" | "edit";
}) {
  const action = mode === "create" ? createHeroSlide : updateHeroSlide;
  const selectedImageId = slide?.imageId ?? mediaItems[0]?.id ?? "";

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_420px]">
      {slide?.id ? <input type="hidden" name="id" value={slide.id} /> : null}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Badge" name="badge" defaultValue={slide?.badge ?? ""} maxLength={80} />
          <Field label="Sıralama" name="order" type="number" defaultValue={String(slide?.order ?? 1)} required />
          <Field label="Başlık" name="title" defaultValue={slide?.title ?? ""} required maxLength={150} />
          <Field label="Alt metin" name="imageAlt" defaultValue={slide?.imageAlt ?? ""} required maxLength={300} />
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-700">Açıklama</span>
          <textarea
            name="description"
            required
            maxLength={500}
            defaultValue={slide?.description ?? ""}
            className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          />
        </label>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Bağlantı etiketi" name="linkLabel" defaultValue={slide?.linkLabel ?? ""} maxLength={120} />
          <Field label="Bağlantı URL'si" name="linkUrl" defaultValue={slide?.linkUrl ?? ""} maxLength={500} />
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Görsel odak konumu
            </span>
            <select
              name="objectPosition"
              defaultValue={slide?.objectPosition ?? "center"}
              className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            >
              {heroObjectPositions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                name="isActive"
                value="true"
                defaultChecked={slide?.isActive ?? true}
                className="size-4 accent-orange-500"
              />
              Aktif
            </label>
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                name="includeInAutoplay"
                value="true"
                defaultChecked={slide?.includeInAutoplay ?? true}
                className="size-4 accent-orange-500"
              />
              Autoplay&apos;e dahil et
            </label>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <h2 className="text-lg font-semibold text-slate-950">Görsel Seç</h2>
          <p className="mt-1 text-sm text-slate-500">
            Yalnızca aktif görsel medya kayıtları seçilebilir.
          </p>
          <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
            {mediaItems.map((media) => {
              const thumbnail = media.variants.some(
                (variant) => variant.variant === "THUMBNAIL"
              );
              const usageCount =
                media._count.heroSlides + media._count.blogPostCovers;

              return (
                <label
                  key={media.id}
                  className="grid cursor-pointer grid-cols-[92px_1fr] gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition has-[:checked]:border-orange-300 has-[:checked]:bg-orange-50"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-200">
                    {thumbnail ? (
                      <Image
                        src={getMediaVariantUrl(media.id, "THUMBNAIL")}
                        alt={media.altText ?? media.title}
                        fill
                        sizes="92px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <input
                      type="radio"
                      name="imageId"
                      value={media.id}
                      defaultChecked={media.id === selectedImageId}
                      required
                      className="sr-only"
                    />
                    <p className="line-clamp-1 text-sm font-semibold text-slate-950">
                      {media.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {media.width ?? "-"}x{media.height ?? "-"} ·{" "}
                      {mediaCategoryLabels[media.category]}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-orange-700">
                      {usageCount ? `${usageCount} kullanım` : "Kullanılmıyor"}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
        >
          {mode === "create" ? "Slayt Oluştur" : "Değişiklikleri Kaydet"}
        </button>
      </aside>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
  maxLength,
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: "text" | "number";
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        name={name}
        required={required}
        maxLength={maxLength}
        defaultValue={defaultValue}
        className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
      />
    </label>
  );
}
