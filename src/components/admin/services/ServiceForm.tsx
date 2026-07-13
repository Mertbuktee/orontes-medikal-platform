"use client";

import type { Media } from "@prisma/client";
import Image from "next/image";
import { type ChangeEvent, useMemo, useState } from "react";

import {
  createService,
  updateService,
} from "@/app/admin/(protected)/services/actions";
import { getMediaVariantUrl } from "@/lib/media/media-url";
import { createServiceSlug } from "@/lib/services/service-validation";
import { serviceIconRegistry } from "@/lib/services/service-registry";

type SelectableMedia = Media & {
  variants: { variant: "ORIGINAL" | "THUMBNAIL" | "MEDIUM" | "LARGE" }[];
  _count: {
    heroSlides: number;
    blogPostCovers: number;
    deviceGroups: number;
    deviceGroupOpenGraphs: number;
    services: number;
    serviceOpenGraphs: number;
  };
};

export type ServiceFormValue = {
  id?: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  iconKey: string;
  imageId: string | null;
  openGraphImageId: string | null;
  isFeatured: boolean;
  isActive: boolean;
  order: number;
  seoTitle: string;
  seoDescription: string;
  ctaLabel: string | null;
  ctaHref: string | null;
};

export function ServiceForm({
  mode,
  service,
  mediaItems,
}: {
  mode: "create" | "edit";
  service: ServiceFormValue;
  mediaItems: SelectableMedia[];
}) {
  const action = mode === "create" ? createService : updateService;
  const [title, setTitle] = useState(service.title);
  const [slug, setSlug] = useState(service.slug);
  const [seoTitle, setSeoTitle] = useState(service.seoTitle);
  const [seoDescription, setSeoDescription] = useState(service.seoDescription);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(
    Boolean(service.slug)
  );
  const suggestedSlug = useMemo(() => createServiceSlug(title), [title]);

  function updateTitle(value: string) {
    setTitle(value);
    if (!slugManuallyEdited) {
      setSlug(createServiceSlug(value));
    }
  }

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_430px]">
      {service.id ? <input type="hidden" name="id" value={service.id} /> : null}

      <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Başlık"
            name="title"
            value={title}
            onChange={updateTitle}
            required
            maxLength={150}
          />
          <Field
            label="Slug"
            name="slug"
            value={slug}
            onChange={(value) => {
              setSlugManuallyEdited(true);
              setSlug(value);
            }}
            help={
              suggestedSlug && suggestedSlug !== slug
                ? `Öneri: ${suggestedSlug}`
                : "Başlıktan otomatik önerilir; manuel düzenleyebilirsiniz."
            }
            required
            maxLength={160}
          />
          <Field
            label="Sıralama"
            name="order"
            type="number"
            defaultValue={String(service.order)}
            required
          />
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">İkon</span>
            <select
              name="iconKey"
              defaultValue={service.iconKey}
              className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            >
              {serviceIconRegistry.map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <Textarea
          label="Kısa Açıklama"
          name="shortDescription"
          defaultValue={service.shortDescription}
          minHeight="min-h-24"
          maxLength={400}
        />
        <Textarea
          label="Detaylı Açıklama"
          name="fullDescription"
          defaultValue={service.fullDescription}
          minHeight="min-h-44"
          maxLength={5000}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Opsiyonel CTA Etiketi"
            name="ctaLabel"
            defaultValue={service.ctaLabel ?? ""}
            maxLength={120}
          />
          <Field
            label="Opsiyonel CTA Bağlantısı"
            name="ctaHref"
            defaultValue={service.ctaHref ?? ""}
            maxLength={300}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="SEO Başlığı"
            name="seoTitle"
            value={seoTitle}
            onChange={setSeoTitle}
            maxLength={180}
            required
          />
          <Field
            label="SEO Açıklaması"
            name="seoDescription"
            value={seoDescription}
            onChange={setSeoDescription}
            maxLength={320}
            required
          />
        </div>

        <SeoLengthNotice
          titleLength={seoTitle.length}
          descriptionLength={seoDescription.length}
        />

        <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="flex items-center gap-3 text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              name="isFeatured"
              value="true"
              defaultChecked={service.isFeatured}
              className="size-4 accent-orange-500"
            />
            Ana sayfada öne çıkar
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              name="isActive"
              value="true"
              defaultChecked={service.isActive}
              className="size-4 accent-orange-500"
            />
            Aktif
          </label>
        </div>
      </section>

      <aside className="space-y-6">
        <MediaPicker
          name="imageId"
          title="Hizmet Görseli"
          selectedId={service.imageId}
          mediaItems={mediaItems}
          allowEmpty
        />
        <MediaPicker
          name="openGraphImageId"
          title="Open Graph Görseli"
          selectedId={service.openGraphImageId}
          mediaItems={mediaItems}
          allowEmpty
        />
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">
            SEO Önizleme
          </p>
          <p className="mt-3 text-base font-semibold text-slate-950">
            {seoTitle || title || "Hizmet başlığı"}
          </p>
          <p className="mt-1 text-sm text-sky-700">
            /hizmetler/{slug || "hizmet-slug"}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {seoDescription || service.shortDescription}
          </p>
        </div>
        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
        >
          {mode === "create" ? "Hizmet Oluştur" : "Değişiklikleri Kaydet"}
        </button>
      </aside>
    </form>
  );
}

function SeoLengthNotice({
  titleLength,
  descriptionLength,
}: {
  titleLength: number;
  descriptionLength: number;
}) {
  const titleWarning = titleLength > 70;
  const descriptionWarning = descriptionLength > 170;

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-semibold md:grid-cols-2">
      <p className={titleWarning ? "text-amber-700" : "text-slate-500"}>
        SEO başlığı: {titleLength}/70 önerilen karakter
      </p>
      <p className={descriptionWarning ? "text-amber-700" : "text-slate-500"}>
        SEO açıklaması: {descriptionLength}/170 önerilen karakter
      </p>
    </div>
  );
}

function MediaPicker({
  name,
  title,
  selectedId,
  mediaItems,
  allowEmpty = false,
}: {
  name: string;
  title: string;
  selectedId: string | null;
  mediaItems: SelectableMedia[];
  allowEmpty?: boolean;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {allowEmpty ? (
          <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
            <input
              type="radio"
              name={name}
              value=""
              defaultChecked={!selectedId}
              className="size-4 accent-orange-500"
            />
            Görsel seçme
          </label>
        ) : null}
        {mediaItems.map((media) => {
          const usageCount =
            media._count.heroSlides +
            media._count.blogPostCovers +
            media._count.deviceGroups +
            media._count.deviceGroupOpenGraphs +
            media._count.services +
            media._count.serviceOpenGraphs;
          const hasThumbnail = media.variants.some(
            (variant) => variant.variant === "THUMBNAIL"
          );

          return (
            <label
              key={`${name}-${media.id}`}
              className="grid cursor-pointer grid-cols-[92px_1fr] gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition has-[:checked]:border-orange-300 has-[:checked]:bg-orange-50"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-200">
                {hasThumbnail ? (
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
                  name={name}
                  value={media.id}
                  defaultChecked={selectedId === media.id}
                  className="sr-only"
                />
                <p className="line-clamp-1 text-sm font-semibold text-slate-950">
                  {media.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {media.width ?? "-"}x{media.height ?? "-"}
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
  );
}

type FieldProps = {
  label: string;
  name: string;
  type?: "text" | "number";
  required?: boolean;
  maxLength?: number;
  help?: string;
} & (
  | {
      value: string;
      onChange: (value: string) => void;
      defaultValue?: never;
    }
  | {
      defaultValue: string;
      value?: never;
      onChange?: never;
    }
);

function Field({
  label,
  name,
  type = "text",
  required = false,
  maxLength,
  help,
  ...props
}: FieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        name={name}
        required={required}
        maxLength={maxLength}
        {...(typeof props.onChange === "function"
          ? {
              value: props.value,
              onChange: (event: ChangeEvent<HTMLInputElement>) =>
                props.onChange(event.currentTarget.value),
            }
          : { defaultValue: props.defaultValue })}
        className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
      />
      {help ? <span className="mt-1 block text-xs text-slate-500">{help}</span> : null}
    </label>
  );
}

function Textarea({
  label,
  name,
  defaultValue,
  minHeight,
  maxLength,
}: {
  label: string;
  name: string;
  defaultValue: string;
  minHeight: string;
  maxLength: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        name={name}
        required
        maxLength={maxLength}
        defaultValue={defaultValue}
        className={`mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 ${minHeight}`}
      />
    </label>
  );
}
