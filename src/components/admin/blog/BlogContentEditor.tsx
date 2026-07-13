"use client";

import { ArrowDown, ArrowUp, Copy, ImageIcon, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import type { BlogContentBlock } from "@/lib/blog/blog-types";
import { createBlogBlockId } from "@/lib/blog/blog-validation";

type MediaOption = {
  id: string;
  title: string;
  altText: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
};

export function BlogContentEditor({
  initialBlocks,
  mediaItems,
}: {
  initialBlocks: BlogContentBlock[];
  mediaItems: MediaOption[];
}) {
  const [blocks, setBlocks] = useState<BlogContentBlock[]>(
    initialBlocks.length ? initialBlocks : [createParagraphBlock()]
  );
  const serializedContent = useMemo(() => JSON.stringify(blocks), [blocks]);

  function updateBlock(index: number, block: BlogContentBlock) {
    setBlocks((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? block : item))
    );
  }

  function addBlock(type: BlogContentBlock["type"]) {
    setBlocks((current) => [...current, createBlock(type)]);
  }

  function moveBlock(index: number, direction: -1 | 1) {
    setBlocks((current) => {
      const next = [...current];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return current;
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  }

  function duplicateBlock(index: number) {
    setBlocks((current) => {
      const clone = { ...current[index], id: createBlogBlockId() } as BlogContentBlock;
      const next = [...current];
      next.splice(index + 1, 0, clone);
      return next;
    });
  }

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
      <input type="hidden" name="content" value={serializedContent} />
      <div>
        <h2 className="text-lg font-semibold text-slate-950">İçerik Blokları</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Ham HTML yoktur. Her blok ayrı doğrulanır ve public sayfada güvenli render edilir.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {blockButtons.map((button) => (
          <button
            key={button.type}
            type="button"
            onClick={() => addBlock(button.type)}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {button.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {blocks.map((block, index) => (
          <article
            key={block.id}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">
                {getBlockLabel(block.type)}
              </p>
              <div className="flex gap-2">
                <IconButton
                  label="Bloğu yukarı taşı"
                  disabled={index === 0}
                  onClick={() => moveBlock(index, -1)}
                >
                  <ArrowUp className="size-4" aria-hidden="true" />
                </IconButton>
                <IconButton
                  label="Bloğu aşağı taşı"
                  disabled={index === blocks.length - 1}
                  onClick={() => moveBlock(index, 1)}
                >
                  <ArrowDown className="size-4" aria-hidden="true" />
                </IconButton>
                <IconButton label="Bloğu çoğalt" onClick={() => duplicateBlock(index)}>
                  <Copy className="size-4" aria-hidden="true" />
                </IconButton>
                <IconButton
                  label="Bloğu sil"
                  disabled={blocks.length === 1}
                  danger
                  onClick={() =>
                    setBlocks((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index)
                    )
                  }
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </IconButton>
              </div>
            </div>
            {renderBlockEditor(block, (value) => updateBlock(index, value), mediaItems)}
          </article>
        ))}
      </div>
    </section>
  );
}

function renderBlockEditor(
  block: BlogContentBlock,
  onChange: (block: BlogContentBlock) => void,
  mediaItems: MediaOption[]
) {
  if (block.type === "paragraph") {
    return (
      <Textarea
        value={block.text}
        rows={4}
        onChange={(text) => onChange({ ...block, text })}
      />
    );
  }

  if (block.type === "heading") {
    return (
      <div className="grid gap-3 md:grid-cols-[160px_1fr]">
        <select
          value={block.level}
          onChange={(event) =>
            onChange({ ...block, level: Number(event.target.value) as 2 | 3 })
          }
          className={inputClassName}
        >
          <option value={2}>H2</option>
          <option value={3}>H3</option>
        </select>
        <input
          value={block.text}
          onChange={(event) => onChange({ ...block, text: event.target.value })}
          className={inputClassName}
        />
      </div>
    );
  }

  if (block.type === "bulletList" || block.type === "numberedList") {
    return (
      <Textarea
        value={block.items.join("\n")}
        rows={5}
        onChange={(value) =>
          onChange({
            ...block,
            items: value
              .split(/\r?\n/)
              .map((item) => item.trim())
              .filter(Boolean),
          })
        }
      />
    );
  }

  if (block.type === "quote") {
    return (
      <div className="grid gap-3">
        <Textarea
          value={block.text}
          rows={3}
          onChange={(text) => onChange({ ...block, text })}
        />
        <input
          value={block.attribution ?? ""}
          placeholder="Atıf (opsiyonel)"
          onChange={(event) =>
            onChange({ ...block, attribution: event.target.value || undefined })
          }
          className={inputClassName}
        />
      </div>
    );
  }

  if (block.type === "image") {
    return (
      <div className="grid gap-3">
        <select
          value={block.mediaId}
          onChange={(event) => onChange({ ...block, mediaId: event.target.value })}
          className={inputClassName}
        >
          <option value="">Görsel seçin</option>
          {mediaItems.map((media) => (
            <option key={media.id} value={media.id}>
              {media.title} · {media.width ?? "-"}x{media.height ?? "-"}
            </option>
          ))}
        </select>
        <input
          value={block.altText}
          placeholder="Alt metin"
          onChange={(event) => onChange({ ...block, altText: event.target.value })}
          className={inputClassName}
        />
        <input
          value={block.caption ?? ""}
          placeholder="Açıklama / caption (opsiyonel)"
          onChange={(event) =>
            onChange({ ...block, caption: event.target.value || undefined })
          }
          className={inputClassName}
        />
      </div>
    );
  }

  if (block.type === "callout") {
    return (
      <div className="grid gap-3">
        <select
          value={block.tone}
          onChange={(event) =>
            onChange({
              ...block,
              tone: event.target.value as "info" | "warning" | "success",
            })
          }
          className={inputClassName}
        >
          <option value="info">Bilgi</option>
          <option value="warning">Uyarı</option>
          <option value="success">Olumlu</option>
        </select>
        <input
          value={block.title ?? ""}
          placeholder="Başlık (opsiyonel)"
          onChange={(event) =>
            onChange({ ...block, title: event.target.value || undefined })
          }
          className={inputClassName}
        />
        <Textarea
          value={block.text}
          rows={3}
          onChange={(text) => onChange({ ...block, text })}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-14 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-500">
      Ayırıcı çizgi
    </div>
  );
}

function createBlock(type: BlogContentBlock["type"]): BlogContentBlock {
  if (type === "paragraph") return createParagraphBlock();
  if (type === "heading") return { id: createBlogBlockId(), type, level: 2, text: "Yeni başlık" };
  if (type === "bulletList" || type === "numberedList") {
    return { id: createBlogBlockId(), type, items: ["Yeni madde"] };
  }
  if (type === "quote") return { id: createBlogBlockId(), type, text: "Alıntı metni" };
  if (type === "image") {
    return {
      id: createBlogBlockId(),
      type,
      mediaId: "",
      altText: "Blog içeriği görseli",
    };
  }
  if (type === "callout") {
    return {
      id: createBlogBlockId(),
      type,
      tone: "info",
      title: "Bilgi",
      text: "Kısa bilgilendirme metni",
    };
  }
  return { id: createBlogBlockId(), type };
}

function createParagraphBlock(): BlogContentBlock {
  return { id: createBlogBlockId(), type: "paragraph", text: "" };
}

function getBlockLabel(type: BlogContentBlock["type"]) {
  return blockButtons.find((button) => button.type === type)?.label ?? "Blok";
}

function IconButton({
  label,
  disabled,
  danger,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex size-10 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? "border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
          : "border-slate-200 bg-white text-slate-700 hover:bg-orange-50"
      }`}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function Textarea({
  value,
  rows,
  onChange,
}: {
  value: string;
  rows: number;
  onChange: (value: string) => void;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
    />
  );
}

const blockButtons = [
  { type: "paragraph", label: "Paragraf" },
  { type: "heading", label: "Başlık" },
  { type: "bulletList", label: "Madde Listesi" },
  { type: "numberedList", label: "Numaralı Liste" },
  { type: "quote", label: "Alıntı" },
  { type: "image", label: "Görsel", icon: ImageIcon },
  { type: "callout", label: "Bilgi Kutusu" },
  { type: "divider", label: "Ayırıcı" },
] satisfies Array<{ type: BlogContentBlock["type"]; label: string; icon?: unknown }>;

const inputClassName =
  "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100";
