"use client";

import { useMemo, useState } from "react";

import {
  createBlogCategory,
  updateBlogCategory,
} from "@/app/admin/(protected)/blog/actions";
import type { BlogCategoryFormValue } from "@/lib/blog/blog-types";
import { createBlogSlug } from "@/lib/blog/blog-validation";

export function BlogCategoryForm({
  mode,
  category,
}: {
  mode: "create" | "edit";
  category: BlogCategoryFormValue;
}) {
  const action = mode === "create" ? createBlogCategory : updateBlogCategory;
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [slugEdited, setSlugEdited] = useState(Boolean(category.slug));
  const suggestedSlug = useMemo(() => createBlogSlug(name), [name]);

  function updateName(value: string) {
    setName(value);
    if (!slugEdited) {
      setSlug(createBlogSlug(value));
    }
  }

  return (
    <form action={action} className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 lg:grid-cols-2">
      {category.id ? <input type="hidden" name="id" value={category.id} /> : null}
      <Field label="Kategori Adı" name="name" value={name} onChange={updateName} required />
      <Field
        label="Slug"
        name="slug"
        value={slug}
        onChange={(value) => {
          setSlugEdited(true);
          setSlug(value);
        }}
        help={suggestedSlug && suggestedSlug !== slug ? `Öneri: ${suggestedSlug}` : undefined}
        required
      />
      <Field label="Sıralama" name="order" type="number" defaultValue={String(category.order)} required />
      <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800">
        <input
          type="checkbox"
          name="isActive"
          value="true"
          defaultChecked={category.isActive}
          className="size-4 accent-orange-500"
        />
        Aktif
      </label>
      <Textarea label="Açıklama" name="description" defaultValue={category.description} />
      <div className="grid gap-4">
        <Field label="SEO Başlığı" name="seoTitle" defaultValue={category.seoTitle} />
        <Textarea
          label="SEO Açıklaması"
          name="seoDescription"
          defaultValue={category.seoDescription}
        />
      </div>
      <div className="lg:col-span-2">
        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 sm:w-auto"
        >
          {mode === "create" ? "Kategori Oluştur" : "Değişiklikleri Kaydet"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  value,
  defaultValue,
  onChange,
  help,
}: {
  label: string;
  name: string;
  type?: "text" | "number";
  required?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  help?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        required={required}
        className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
      />
      {help ? <span className="mt-2 block text-xs text-slate-500">{help}</span> : null}
    </label>
  );
}

function Textarea({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
      />
    </label>
  );
}
