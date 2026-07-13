"use client";

import { UploadCloud, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";

import { uploadMedia } from "@/app/admin/(protected)/media/actions";
import {
  mediaCategories,
  mediaCategoryLabels,
  mediaUsageTypeLabels,
  mediaUsageTypes,
} from "@/lib/media/media-types";

const maxClientFileSize = 10 * 1024 * 1024;
const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];

export function MediaUploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSelectedFile(selected: File | null) {
    if (
      selected &&
      (!acceptedTypes.includes(selected.type) || selected.size > maxClientFileSize)
    ) {
      setMessage("Lütfen geçerli ve 10 MB altında bir görsel seçin.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setFile(null);
      return;
    }

    setMessage(null);
    setFile(selected);
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setMessage(null);
        startTransition(async () => {
          const result = await uploadMedia(formData);
          setMessage(result.message);

          if (result.success && !result.duplicate) {
            formRef.current?.reset();
            setFile(null);
          }
        });
      }}
      className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
            <UploadCloud className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-950">
              Medya Yükle
            </h2>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              JPEG, PNG veya WebP görsel yükleyin. Güvenlik kontrolleri
              sunucuda yeniden yapılır.
            </p>
          </div>
        </div>

        {file ? (
          <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="max-w-[280px] truncate text-xs font-semibold text-slate-700">
              {file.name} - {formatFileSize(file.size)}
            </p>
            <button
              type="button"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600"
              onClick={() => {
                formRef.current?.reset();
                setFile(null);
              }}
              aria-label="Seçilen dosyayı kaldır"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Başlık" name="title" required maxLength={150} />
        <Field label="Alt metin" name="altText" required maxLength={300} />
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Kategori</span>
          <select
            name="category"
            defaultValue="GENERAL"
            className="mt-2 min-h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          >
            {mediaCategories.map((category) => (
              <option key={category} value={category}>
                {mediaCategoryLabels[category]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Kullanım</span>
          <select
            name="usageType"
            defaultValue="IMAGE"
            className="mt-2 min-h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          >
            {mediaUsageTypes.map((usageType) => (
              <option key={usageType} value={usageType}>
                {mediaUsageTypeLabels[usageType]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_420px]">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Açıklama</span>
          <textarea
            name="description"
            maxLength={1000}
            className="mt-2 min-h-20 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          />
        </label>

        <label
          className="flex min-h-20 cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-sky-200 bg-sky-50/60 px-4 py-3 text-left transition hover:border-orange-200 hover:bg-orange-50/60"
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
            const selected = event.dataTransfer.files.item(0);

            if (selected && fileInputRef.current) {
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(selected);
              fileInputRef.current.files = dataTransfer.files;
            }

            handleSelectedFile(selected);
          }}
        >
          <UploadCloud className="size-6 shrink-0 text-sky-700" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-950">
              Görsel seçin veya buraya bırakın
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">
              JPEG, PNG, WebP - maksimum 10 MB
            </span>
          </span>
          <input
            ref={fileInputRef}
            type="file"
            name="file"
            required
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => {
              handleSelectedFile(event.currentTarget.files?.[0] ?? null);
            }}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Yükleniyor..." : "Medya Yükle"}
      </button>

      {message ? (
        <p className="mt-3 text-sm font-medium text-slate-700" aria-live="polite">
          {message}
        </p>
      ) : null}
    </form>
  );
}

function Field({
  label,
  name,
  required,
  maxLength,
}: {
  label: string;
  name: string;
  required?: boolean;
  maxLength: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        name={name}
        required={required}
        maxLength={maxLength}
        className="mt-2 min-h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
      />
    </label>
  );
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
