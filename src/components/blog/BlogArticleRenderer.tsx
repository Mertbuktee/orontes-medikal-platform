import Image from "next/image";

import type { BlogContentBlock } from "@/lib/blog/blog-types";
import { getMediaVariantUrl } from "@/lib/media/media-url";

export function BlogArticleRenderer({
  blocks,
}: {
  blocks: BlogContentBlock[];
}) {
  return (
    <div className="space-y-7 text-slate-700">
      {blocks.map((block) => {
        if (block.type === "paragraph") {
          return (
            <p key={block.id} className="text-base leading-8">
              {block.text}
            </p>
          );
        }

        if (block.type === "heading") {
          const className =
            block.level === 2
              ? "text-2xl font-semibold tracking-tight text-slate-950"
              : "text-xl font-semibold tracking-tight text-slate-950";

          return block.level === 2 ? (
            <h2 key={block.id} className={className}>
              {block.text}
            </h2>
          ) : (
            <h3 key={block.id} className={className}>
              {block.text}
            </h3>
          );
        }

        if (block.type === "bulletList" || block.type === "numberedList") {
          const ListTag = block.type === "bulletList" ? "ul" : "ol";
          return (
            <ListTag
              key={block.id}
              className={`space-y-3 pl-6 text-base leading-7 ${
                block.type === "bulletList" ? "list-disc" : "list-decimal"
              }`}
            >
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ListTag>
          );
        }

        if (block.type === "quote") {
          return (
            <blockquote
              key={block.id}
              className="rounded-3xl border-l-4 border-orange-500 bg-orange-50 p-5 text-base font-semibold leading-8 text-slate-800"
            >
              {block.text}
              {block.attribution ? (
                <footer className="mt-3 text-sm font-medium text-slate-500">
                  {block.attribution}
                </footer>
              ) : null}
            </blockquote>
          );
        }

        if (block.type === "image") {
          return (
            <figure key={block.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <div className="relative aspect-[16/9] bg-slate-100">
                <Image
                  src={getMediaVariantUrl(block.mediaId, "LARGE")}
                  alt={block.altText}
                  fill
                  sizes="(min-width: 1024px) 860px, 100vw"
                  className="object-cover"
                />
              </div>
              {block.caption ? (
                <figcaption className="px-4 py-3 text-sm text-slate-500">
                  {block.caption}
                </figcaption>
              ) : null}
            </figure>
          );
        }

        if (block.type === "callout") {
          return (
            <aside
              key={block.id}
              className={`rounded-3xl border p-5 ${
                block.tone === "warning"
                  ? "border-amber-200 bg-amber-50"
                  : block.tone === "success"
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-sky-200 bg-sky-50"
              }`}
            >
              {block.title ? (
                <p className="font-semibold text-slate-950">{block.title}</p>
              ) : null}
              <p className="mt-2 text-sm leading-7 text-slate-700">{block.text}</p>
            </aside>
          );
        }

        return <hr key={block.id} className="border-slate-200" />;
      })}
    </div>
  );
}
