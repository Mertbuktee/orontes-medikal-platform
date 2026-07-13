"use client";

import type { MediaCategory } from "@prisma/client";
import { Eye, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { updateHomepageSection } from "@/app/admin/(protected)/homepage/actions";
import type {
  BoardRepairContent,
  FinalCtaContent,
  HomepageListItem,
  HomepageSectionContent,
  HomepageSectionKey,
  PreviewContent,
  ProcessContent,
  WhyUsContent,
} from "@/lib/homepage/homepage-types";
import { homepageIconKeys } from "@/lib/homepage/homepage-validation";

type MediaOption = {
  id: string;
  title: string;
  originalName: string | null;
  category: MediaCategory;
  width: number | null;
  height: number | null;
  altText: string | null;
};

type HomepageSectionFormProps = {
  section: {
    key: HomepageSectionKey;
    title: string;
    eyebrow: string | null;
    description: string;
    order: number;
    isVisible: boolean;
    content: HomepageSectionContent;
  };
  mediaItems: MediaOption[];
};

export function HomepageSectionForm({
  section,
  mediaItems,
}: HomepageSectionFormProps) {
  const [content, setContent] = useState(section.content);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const serializedContent = useMemo(() => JSON.stringify(content), [content]);

  return (
    <form
      action={updateHomepageSection}
      className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-2"
    >
      <input type="hidden" name="key" value={section.key} />
      <input type="hidden" name="content" value={serializedContent} />

      <Field label="Bölüm Başlığı">
        <input
          name="title"
          defaultValue={section.title}
          required
          maxLength={180}
          className={inputClassName}
        />
      </Field>

      <Field label="Eyebrow">
        <input
          name="eyebrow"
          defaultValue={section.eyebrow ?? ""}
          maxLength={80}
          className={inputClassName}
        />
      </Field>

      <Field label="Bölüm Açıklaması" className="lg:col-span-2">
        <textarea
          name="description"
          defaultValue={section.description}
          required
          rows={3}
          className={textareaClassName}
        />
      </Field>

      <Field label="Sıralama">
        <input
          type="number"
          name="order"
          defaultValue={section.order}
          min={1}
          required
          className={inputClassName}
        />
      </Field>

      <Field label="Görünürlük">
        <select
          name="isVisible"
          defaultValue={String(section.isVisible)}
          className={inputClassName}
        >
          <option value="true">Görünür</option>
          <option value="false">Gizli</option>
        </select>
      </Field>

      <div className="lg:col-span-2">
        {renderContentEditor(section.key, content, setContent, mediaItems)}
      </div>

      <div className="flex flex-col gap-3 lg:col-span-2 sm:flex-row">
        <button
          type="button"
          onClick={() => setIsPreviewOpen(true)}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 sm:w-auto"
        >
          <Eye className="size-4" aria-hidden="true" />
          Kaydetmeden Önizle
        </button>
        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 sm:w-auto"
        >
          Bölümü Kaydet
        </button>
      </div>

      {isPreviewOpen ? (
        <PreviewModal
          sectionKey={section.key}
          sectionTitle={section.title}
          content={content}
          onClose={() => setIsPreviewOpen(false)}
        />
      ) : null}
    </form>
  );
}

function renderContentEditor(
  key: HomepageSectionKey,
  content: HomepageSectionContent,
  setContent: (content: HomepageSectionContent) => void,
  mediaItems: MediaOption[]
) {
  if (
    key === "SERVICES_PREVIEW" ||
    key === "DEVICES_PREVIEW" ||
    key === "BLOG_PREVIEW" ||
    key === "HERO_SUPPORTING_CONTENT"
  ) {
    return (
      <PreviewEditor
        content={content as PreviewContent}
        onChange={(value) => setContent(value)}
      />
    );
  }

  if (key === "BOARD_REPAIR") {
    return (
      <BoardRepairEditor
        content={content as BoardRepairContent}
        mediaItems={mediaItems}
        onChange={(value) => setContent(value)}
      />
    );
  }

  if (key === "WHY_US") {
    return (
      <ListEditor
        title="Neden Orontes maddeleri"
        items={(content as WhyUsContent).items}
        onChange={(items) =>
          setContent({ ...(content as WhyUsContent), items })
        }
      />
    );
  }

  if (key === "PROCESS") {
    return (
      <ListEditor
        title="Süreç adımları"
        items={(content as ProcessContent).steps}
        onChange={(steps) =>
          setContent({ ...(content as ProcessContent), steps })
        }
      />
    );
  }

  return (
    <FinalCtaEditor
      content={content as FinalCtaContent}
      onChange={(value) => setContent(value)}
    />
  );
}

function PreviewEditor({
  content,
  onChange,
}: {
  content: PreviewContent;
  onChange: (content: PreviewContent) => void;
}) {
  return (
    <Panel title="Önizleme Ayarları">
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Public Başlık">
          <input
            value={content.title}
            onChange={(event) =>
              onChange({ ...content, title: event.target.value })
            }
            className={inputClassName}
          />
        </Field>
        <Field label="View All Buton Metni">
          <input
            value={content.viewAllLabel}
            onChange={(event) =>
              onChange({ ...content, viewAllLabel: event.target.value })
            }
            className={inputClassName}
          />
        </Field>
        <Field label="Açıklama" className="lg:col-span-2">
          <textarea
            value={content.description}
            onChange={(event) =>
              onChange({ ...content, description: event.target.value })
            }
            rows={3}
            className={textareaClassName}
          />
        </Field>
        <Field label="Gösterilecek Kart Sayısı">
          <input
            type="number"
            min={2}
            max={8}
            value={content.itemLimit}
            onChange={(event) =>
              onChange({
                ...content,
                itemLimit: Number(event.target.value),
              })
            }
            className={inputClassName}
          />
        </Field>
        <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800">
          <input
            type="checkbox"
            checked={content.showViewAll}
            onChange={(event) =>
              onChange({ ...content, showViewAll: event.target.checked })
            }
            className="size-4 accent-orange-500"
          />
          Tümünü gör butonu göster
        </label>
      </div>
    </Panel>
  );
}

function BoardRepairEditor({
  content,
  mediaItems,
  onChange,
}: {
  content: BoardRepairContent;
  mediaItems: MediaOption[];
  onChange: (content: BoardRepairContent) => void;
}) {
  return (
    <Panel title="Elektronik Kart Tamiri İçeriği">
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Badge">
          <input
            value={content.badge}
            onChange={(event) => onChange({ ...content, badge: event.target.value })}
            className={inputClassName}
          />
        </Field>
        <Field label="Başlık">
          <input
            value={content.title}
            onChange={(event) => onChange({ ...content, title: event.target.value })}
            className={inputClassName}
          />
        </Field>
        <Field label="Açıklama" className="lg:col-span-2">
          <textarea
            value={content.description}
            onChange={(event) =>
              onChange({ ...content, description: event.target.value })
            }
            rows={4}
            className={textareaClassName}
          />
        </Field>
        <Field
          label="Özellikler"
          hint="Her satır bir madde olarak kaydedilir."
          className="lg:col-span-2"
        >
          <textarea
            value={content.featureItems.join("\n")}
            onChange={(event) =>
              onChange({
                ...content,
                featureItems: linesToItems(event.target.value),
              })
            }
            rows={6}
            className={textareaClassName}
          />
        </Field>
        <Field label="Birincil CTA Metni">
          <input
            value={content.primaryCtaLabel}
            onChange={(event) =>
              onChange({ ...content, primaryCtaLabel: event.target.value })
            }
            className={inputClassName}
          />
        </Field>
        <Field label="Birincil CTA Link">
          <input
            value={content.primaryCtaHref}
            onChange={(event) =>
              onChange({ ...content, primaryCtaHref: event.target.value })
            }
            className={inputClassName}
          />
        </Field>
        <Field label="İkincil CTA Metni">
          <input
            value={content.secondaryCtaLabel}
            onChange={(event) =>
              onChange({ ...content, secondaryCtaLabel: event.target.value })
            }
            className={inputClassName}
          />
        </Field>
        <Field label="İkincil CTA Link">
          <input
            value={content.secondaryCtaHref}
            onChange={(event) =>
              onChange({ ...content, secondaryCtaHref: event.target.value })
            }
            className={inputClassName}
          />
        </Field>
        <MediaSelect
          label="Opsiyonel Görsel"
          value={content.mediaId}
          mediaItems={mediaItems}
          onChange={(mediaId) => onChange({ ...content, mediaId })}
        />
      </div>
    </Panel>
  );
}

function FinalCtaEditor({
  content,
  onChange,
}: {
  content: FinalCtaContent;
  onChange: (content: FinalCtaContent) => void;
}) {
  return (
    <Panel title="Final CTA İçeriği">
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Badge">
          <input
            value={content.badge}
            onChange={(event) => onChange({ ...content, badge: event.target.value })}
            className={inputClassName}
          />
        </Field>
        <Field label="Başlık">
          <input
            value={content.title}
            onChange={(event) => onChange({ ...content, title: event.target.value })}
            className={inputClassName}
          />
        </Field>
        <Field label="Açıklama" className="lg:col-span-2">
          <textarea
            value={content.description}
            onChange={(event) =>
              onChange({ ...content, description: event.target.value })
            }
            rows={4}
            className={textareaClassName}
          />
        </Field>
        <Field label="Birincil Buton Metni">
          <input
            value={content.primaryLabel}
            onChange={(event) =>
              onChange({ ...content, primaryLabel: event.target.value })
            }
            className={inputClassName}
          />
        </Field>
        <Field label="Birincil Buton Link">
          <input
            value={content.primaryHref}
            onChange={(event) =>
              onChange({ ...content, primaryHref: event.target.value })
            }
            className={inputClassName}
          />
        </Field>
        <Field label="İkincil Buton Metni">
          <input
            value={content.secondaryLabel}
            onChange={(event) =>
              onChange({ ...content, secondaryLabel: event.target.value })
            }
            className={inputClassName}
          />
        </Field>
        <Field label="İkincil Buton Link">
          <input
            value={content.secondaryHref}
            onChange={(event) =>
              onChange({ ...content, secondaryHref: event.target.value })
            }
            className={inputClassName}
          />
        </Field>
        <Field
          label="Güven Maddeleri"
          hint="Her satır bir madde olarak kaydedilir."
          className="lg:col-span-2"
        >
          <textarea
            value={content.trustItems.join("\n")}
            onChange={(event) =>
              onChange({
                ...content,
                trustItems: linesToItems(event.target.value),
              })
            }
            rows={5}
            className={textareaClassName}
          />
        </Field>
      </div>
    </Panel>
  );
}

function ListEditor({
  title,
  items,
  onChange,
}: {
  title: string;
  items: HomepageListItem[];
  onChange: (items: HomepageListItem[]) => void;
}) {
  return (
    <Panel title={title}>
      <div className="space-y-4">
        {items
          .map((item, originalIndex) => ({ item, originalIndex }))
          .sort((first, second) => first.item.order - second.item.order)
          .map(({ item, originalIndex }, index) => (
            <div
              key={`${item.order}-${index}`}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-2"
            >
              <Field label="Başlık">
                <input
                  value={item.title}
                  onChange={(event) =>
                    onChange(updateItem(items, originalIndex, { title: event.target.value }))
                  }
                  className={inputClassName}
                />
              </Field>
              <Field label="İkon">
                <select
                  value={item.iconKey}
                  onChange={(event) =>
                    onChange(updateItem(items, originalIndex, { iconKey: event.target.value }))
                  }
                  className={inputClassName}
                >
                  {homepageIconKeys.map((iconKey) => (
                    <option key={iconKey} value={iconKey}>
                      {iconKey}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Açıklama" className="lg:col-span-2">
                <textarea
                  value={item.description}
                  onChange={(event) =>
                    onChange(
                      updateItem(items, originalIndex, { description: event.target.value })
                    )
                  }
                  rows={3}
                  className={textareaClassName}
                />
              </Field>
              <Field label="Sıralama">
                <input
                  type="number"
                  min={1}
                  value={item.order}
                  onChange={(event) =>
                    onChange(
                      updateItem(items, originalIndex, { order: Number(event.target.value) })
                    )
                  }
                  className={inputClassName}
                />
              </Field>
              <div className="flex items-end gap-2">
                <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={item.isActive}
                    onChange={(event) =>
                      onChange(
                        updateItem(items, originalIndex, { isActive: event.target.checked })
                      )
                    }
                    className="size-4 accent-orange-500"
                  />
                  Aktif
                </label>
                <button
                  type="button"
                  onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== originalIndex))}
                  className="inline-flex size-12 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                  aria-label="Maddeyi sil"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}

        <button
          type="button"
          onClick={() =>
            onChange([
              ...items,
              {
                title: "Yeni madde",
                description: "Yeni madde açıklaması buraya yazılır.",
                iconKey: "ShieldCheck",
                order: items.length + 1,
                isActive: true,
              },
            ])
          }
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-orange-50"
        >
          <Plus className="size-4" aria-hidden="true" />
          Madde Ekle
        </button>
      </div>
    </Panel>
  );
}

function MediaSelect({
  label,
  value,
  mediaItems,
  onChange,
}: {
  label: string;
  value: string | null;
  mediaItems: MediaOption[];
  onChange: (mediaId: string | null) => void;
}) {
  return (
    <Field label={label} className="lg:col-span-2">
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        className={inputClassName}
      >
        <option value="">Medya seçilmedi</option>
        {mediaItems.map((media) => (
          <option key={media.id} value={media.id}>
            {media.title} · {media.category}
            {media.width && media.height ? ` · ${media.width}x${media.height}` : ""}
          </option>
        ))}
      </select>
    </Field>
  );
}

function PreviewModal({
  sectionKey,
  sectionTitle,
  content,
  onClose,
}: {
  sectionKey: HomepageSectionKey;
  sectionTitle: string;
  content: HomepageSectionContent;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="homepage-section-preview-title"
    >
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/20 bg-slate-50 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-600">
              Kaydedilmemiş önizleme
            </p>
            <h2
              id="homepage-section-preview-title"
              className="mt-1 text-xl font-semibold text-slate-950"
            >
              {sectionTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"
            aria-label="Önizlemeyi kapat"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="p-5">{renderSectionPreview(sectionKey, content)}</div>
      </div>
    </div>
  );
}

function renderSectionPreview(
  sectionKey: HomepageSectionKey,
  content: HomepageSectionContent
) {
  if (
    sectionKey === "SERVICES_PREVIEW" ||
    sectionKey === "DEVICES_PREVIEW" ||
    sectionKey === "BLOG_PREVIEW" ||
    sectionKey === "HERO_SUPPORTING_CONTENT"
  ) {
    return <PreviewListSection content={content as PreviewContent} />;
  }

  if (sectionKey === "BOARD_REPAIR") {
    return <BoardRepairPreview content={content as BoardRepairContent} />;
  }

  if (sectionKey === "WHY_US") {
    const whyUsContent = content as WhyUsContent;
    return (
      <ListSectionPreview
        title={whyUsContent.title}
        description={whyUsContent.description}
        items={whyUsContent.items}
      />
    );
  }

  if (sectionKey === "PROCESS") {
    const processContent = content as ProcessContent;
    return (
      <ListSectionPreview
        title={processContent.title}
        description={processContent.description}
        items={processContent.steps}
      />
    );
  }

  return <FinalCtaPreview content={content as FinalCtaContent} />;
}

function PreviewListSection({ content }: { content: PreviewContent }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="max-w-3xl">
        <h3 className="text-3xl font-semibold text-slate-950">{content.title}</h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {content.description}
        </p>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {Array.from({ length: Math.min(content.itemLimit, 6) }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="h-1 w-10 rounded-full bg-orange-500" />
            <p className="mt-4 text-sm font-semibold text-slate-900">
              Önizleme kartı {index + 1}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Bu alan gerçek liste verileriyle yayın ekranında doldurulur.
            </p>
          </div>
        ))}
      </div>
      {content.showViewAll ? (
        <span className="mt-6 inline-flex min-h-11 items-center rounded-2xl border border-orange-200 px-4 text-sm font-semibold text-orange-700">
          {content.viewAllLabel}
        </span>
      ) : null}
    </section>
  );
}

function BoardRepairPreview({ content }: { content: BoardRepairContent }) {
  return (
    <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">
        {content.badge}
      </p>
      <h3 className="mt-4 max-w-3xl text-3xl font-semibold">{content.title}</h3>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
        {content.description}
      </p>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {content.featureItems.map((feature) => (
          <div
            key={feature}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
          >
            {feature}
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <span className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-orange-500 px-5 text-sm font-semibold">
          {content.primaryCtaLabel}
        </span>
        <span className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/20 px-5 text-sm font-semibold">
          {content.secondaryCtaLabel}
        </span>
      </div>
    </section>
  );
}

function ListSectionPreview({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: HomepageListItem[];
}) {
  const activeItems = getActiveItems(items);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="max-w-3xl">
        <h3 className="text-3xl font-semibold text-slate-950">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {description}
        </p>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {activeItems.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex size-9 items-center justify-center rounded-xl bg-orange-50 text-xs font-bold text-orange-600">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                <p className="text-xs text-slate-500">{item.iconKey}</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCtaPreview({ content }: { content: FinalCtaContent }) {
  return (
    <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">
        {content.badge}
      </p>
      <h3 className="mt-4 max-w-3xl text-3xl font-semibold">{content.title}</h3>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
        {content.description}
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <span className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-orange-500 px-5 text-sm font-semibold">
          {content.primaryLabel}
        </span>
        <span className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/20 px-5 text-sm font-semibold">
          {content.secondaryLabel}
        </span>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {content.trustItems.map((item) => (
          <span
            key={item}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function getActiveItems(items: HomepageListItem[]) {
  return [...items]
    .filter((item) => item.isActive)
    .sort((first, second) => first.order - second.order);
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="text-sm font-semibold text-slate-900">{label}</span>
      <span className="mt-2 block">{children}</span>
      {hint ? (
        <span className="mt-2 block text-xs leading-5 text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function linesToItems(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function updateItem(
  items: HomepageListItem[],
  index: number,
  patch: Partial<HomepageListItem>
) {
  return items.map((item, itemIndex) =>
    itemIndex === index ? { ...item, ...patch } : item
  );
}

const inputClassName =
  "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100";

const textareaClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100";
