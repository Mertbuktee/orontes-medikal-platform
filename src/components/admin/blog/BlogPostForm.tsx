"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { createBlogPost, updateBlogPost } from "@/app/admin/(protected)/blog/actions";
import { BlogContentEditor } from "@/components/admin/blog/BlogContentEditor";
import type { BlogContentBlock, BlogPostFormValue } from "@/lib/blog/blog-types";
import { createBlogSlug } from "@/lib/blog/blog-validation";
import { getMediaVariantUrl } from "@/lib/media/media-url";

type MediaOption = {
  id: string;
  title: string;
  altText: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  variants: { variant: "THUMBNAIL" | "MEDIUM" | "LARGE" | "ORIGINAL" }[];
};

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

type AuthorOption = {
  id: string;
  name: string;
  email: string;
};

export function BlogPostForm({
  mode,
  post,
  categories,
  authors,
  mediaItems,
}: {
  mode: "create" | "edit";
  post: BlogPostFormValue;
  categories: CategoryOption[];
  authors: AuthorOption[];
  mediaItems: MediaOption[];
}) {
  const action = mode === "create" ? createBlogPost : updateBlogPost;
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [seoTitle, setSeoTitle] = useState(post.seoTitle);
  const [seoDescription, setSeoDescription] = useState(post.seoDescription);
  const [slugEdited, setSlugEdited] = useState(Boolean(post.slug));
  const suggestedSlug = useMemo(() => createBlogSlug(title), [title]);

  function updateTitle(value: string) {
    setTitle(value);
    if (!slugEdited) {
      setSlug(createBlogSlug(value));
    }
  }

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_420px]">
      {post.id ? <input type="hidden" name="id" value={post.id} /> : null}

      <div className="space-y-6">
        <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Başlık"
              name="title"
              value={title}
              onChange={updateTitle}
              required
              maxLength={200}
            />
            <Field
              label="Slug"
              name="slug"
              value={slug}
              onChange={(value) => {
                setSlugEdited(true);
                setSlug(value);
              }}
              help={
                suggestedSlug && suggestedSlug !== slug
                  ? `Öneri: ${suggestedSlug}`
                  : "Başlıktan otomatik önerilir; manuel düzenleyebilirsiniz."
              }
              required
              maxLength={180}
            />
          </div>

          <Textarea
            label="Özet"
            name="excerpt"
            defaultValue={post.excerpt}
            minHeight="min-h-28"
            maxLength={500}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Kategori" name="categoryId" defaultValue={post.categoryId ?? ""}>
              <option value="">Kategori seçin</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.isActive ? "" : " (pasif)"}
                </option>
              ))}
            </Select>
            <Select label="Yazar" name="authorId" defaultValue={post.authorId ?? ""}>
              <option value="">Yazar seçin</option>
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name} · {author.email}
                </option>
              ))}
            </Select>
          </div>
        </section>

        <BlogContentEditor
          initialBlocks={post.content as BlogContentBlock[]}
          mediaItems={mediaItems}
        />
      </div>

      <aside className="space-y-6">
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <h2 className="text-lg font-semibold text-slate-950">Yayın Durumu</h2>
          <Select label="Durum" name="status" defaultValue={post.status}>
            <option value="DRAFT">Taslak</option>
            <option value="PUBLISHED">Yayınla</option>
            <option value="ARCHIVED">Arşivle</option>
          </Select>
          <Field
            label="Planlanan Yayın Tarihi"
            name="scheduledFor"
            type="datetime-local"
            defaultValue={toDateTimeLocal(post.scheduledFor)}
          />
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800">
            Planlandı — otomatik yayın worker&apos;ı production aşamasında
            etkinleştirilecektir. Şu an zamanlama kaydı tutulur, otomatik yayın
            aktifmiş gibi gösterilmez.
          </p>
          <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              name="isFeatured"
              value="true"
              defaultChecked={post.isFeatured}
              className="size-4 accent-orange-500"
            />
            Ana sayfada öne çıkar
          </label>
        </section>

        <MediaPicker
          name="coverImageId"
          title="Kapak Görseli"
          selectedId={post.coverImageId}
          mediaItems={mediaItems}
        />
        <MediaPicker
          name="openGraphImageId"
          title="Open Graph Görseli"
          selectedId={post.openGraphImageId}
          mediaItems={mediaItems}
        />

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <h2 className="text-lg font-semibold text-slate-950">SEO</h2>
          <Field
            label="SEO Başlığı"
            name="seoTitle"
            value={seoTitle}
            onChange={setSeoTitle}
            required
            maxLength={180}
          />
          <Textarea
            label="SEO Açıklaması"
            name="seoDescription"
            value={seoDescription}
            onChange={setSeoDescription}
            minHeight="min-h-24"
            maxLength={320}
          />
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-semibold">
            <p className={seoTitle.length > 70 ? "text-amber-700" : "text-slate-500"}>
              Başlık: {seoTitle.length}/70 önerilen karakter
            </p>
            <p
              className={
                seoDescription.length > 170 ? "mt-2 text-amber-700" : "mt-2 text-slate-500"
              }
            >
              Açıklama: {seoDescription.length}/170 önerilen karakter
            </p>
            <p className="mt-3 text-sky-700">/blog/{slug || "blog-slug"}</p>
          </div>
        </section>

        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
        >
          {mode === "create" ? "Blog Yazısı Oluştur" : "Değişiklikleri Kaydet"}
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
}: {
  name: string;
  title: string;
  selectedId: string | null;
  mediaItems: MediaOption[];
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
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
        {mediaItems.map((media) => (
          <label
            key={`${name}-${media.id}`}
            className="grid cursor-pointer grid-cols-[88px_1fr] gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition has-[:checked]:border-orange-300 has-[:checked]:bg-orange-50"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-200">
              {media.variants.some((variant) => variant.variant === "THUMBNAIL") ? (
                <Image
                  src={getMediaVariantUrl(media.id, "THUMBNAIL")}
                  alt={media.altText ?? media.title}
                  fill
                  sizes="88px"
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
            </div>
          </label>
        ))}
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  maxLength,
  help,
  value,
  defaultValue,
  onChange,
}: {
  label: string;
  name: string;
  type?: "text" | "datetime-local";
  required?: boolean;
  maxLength?: number;
  help?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
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
        maxLength={maxLength}
        className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
      />
      {help ? <span className="mt-2 block text-xs text-slate-500">{help}</span> : null}
    </label>
  );
}

function Textarea({
  label,
  name,
  value,
  defaultValue,
  onChange,
  minHeight,
  maxLength,
}: {
  label: string;
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  minHeight: string;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        maxLength={maxLength}
        className={`mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 ${minHeight}`}
      />
    </label>
  );
}

function Select({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-2 min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
      >
        {children}
      </select>
    </label>
  );
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}
