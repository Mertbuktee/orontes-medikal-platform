import type { Media } from "@prisma/client";
import Image from "next/image";

import {
  createDeviceGroup,
  updateDeviceGroup,
} from "@/app/admin/(protected)/devices/actions";
import {
  deviceCapabilityLabels,
  deviceIconRegistry,
} from "@/lib/devices/device-registry";
import { getMediaVariantUrl } from "@/lib/media/media-url";

type SelectableMedia = Media & {
  variants: { variant: "ORIGINAL" | "THUMBNAIL" | "MEDIUM" | "LARGE" }[];
  _count: {
    heroSlides: number;
    blogPostCovers: number;
    deviceGroups: number;
    deviceGroupOpenGraphs: number;
  };
};

export type DeviceGroupFormValue = {
  id?: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  iconKey: string;
  imageId: string | null;
  openGraphImageId: string | null;
  capabilities: string[];
  isFeatured: boolean;
  isActive: boolean;
  order: number;
  seoTitle: string;
  seoDescription: string;
};

export function DeviceGroupForm({
  mode,
  device,
  mediaItems,
}: {
  mode: "create" | "edit";
  device: DeviceGroupFormValue;
  mediaItems: SelectableMedia[];
}) {
  const action = mode === "create" ? createDeviceGroup : updateDeviceGroup;

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_430px]">
      {device.id ? <input type="hidden" name="id" value={device.id} /> : null}

      <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Başlık"
            name="title"
            defaultValue={device.title}
            required
            maxLength={150}
          />
          <Field
            label="Slug"
            name="slug"
            defaultValue={device.slug}
            required
            maxLength={160}
          />
          <Field
            label="Sıralama"
            name="order"
            type="number"
            defaultValue={String(device.order)}
            required
          />
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">İkon</span>
            <select
              name="iconKey"
              defaultValue={device.iconKey}
              className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            >
              {deviceIconRegistry.map(({ key, label }) => (
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
          defaultValue={device.shortDescription}
          minHeight="min-h-24"
          maxLength={400}
        />
        <Textarea
          label="Detaylı Açıklama"
          name="fullDescription"
          defaultValue={device.fullDescription}
          minHeight="min-h-44"
          maxLength={5000}
        />

        <fieldset className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <legend className="px-1 text-sm font-semibold text-slate-700">
            Yetenekler
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {deviceCapabilityLabels.map((capability) => (
              <label
                key={capability}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
              >
                <input
                  type="checkbox"
                  name={`capability:${capability}`}
                  value="true"
                  defaultChecked={device.capabilities.includes(capability)}
                  className="size-4 accent-orange-500"
                />
                {capability}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="SEO Başlığı"
            name="seoTitle"
            defaultValue={device.seoTitle}
            maxLength={180}
            required
          />
          <Field
            label="SEO Açıklaması"
            name="seoDescription"
            defaultValue={device.seoDescription}
            maxLength={320}
            required
          />
        </div>

        <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="flex items-center gap-3 text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              name="isFeatured"
              value="true"
              defaultChecked={device.isFeatured}
              className="size-4 accent-orange-500"
            />
            Ana sayfada öne çıkar
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              name="isActive"
              value="true"
              defaultChecked={device.isActive}
              className="size-4 accent-orange-500"
            />
            Aktif
          </label>
        </div>
      </section>

      <aside className="space-y-6">
        <MediaPicker
          name="imageId"
          title="Cihaz Görseli"
          selectedId={device.imageId}
          mediaItems={mediaItems}
          allowEmpty
        />
        <MediaPicker
          name="openGraphImageId"
          title="Open Graph Görseli"
          selectedId={device.openGraphImageId}
          mediaItems={mediaItems}
          allowEmpty
        />
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">
            SEO Önizleme
          </p>
          <p className="mt-3 text-base font-semibold text-slate-950">
            {device.seoTitle || device.title || "Cihaz grubu başlığı"}
          </p>
          <p className="mt-1 text-sm text-sky-700">
            /cihazlar/{device.slug || "cihaz-slug"}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {device.seoDescription || device.shortDescription}
          </p>
        </div>
        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
        >
          {mode === "create" ? "Cihaz Grubu Oluştur" : "Değişiklikleri Kaydet"}
        </button>
      </aside>
    </form>
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
            media._count.deviceGroupOpenGraphs;
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
