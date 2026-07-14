"use client";

/* eslint-disable @next/next/no-img-element -- Private authenticated attachments are served through protected admin routes, not the public Next image optimizer. */

import { ChevronLeft, ChevronRight, Download, Maximize2, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";

export type ServiceRequestImageAttachment = {
  id: string;
  mimeType: string;
  sizeLabel: string;
  previewUrl: string;
  downloadUrl: string;
};

type ServiceRequestAttachmentViewerProps = {
  attachments: ServiceRequestImageAttachment[];
};

export function ServiceRequestAttachmentViewer({
  attachments,
}: ServiceRequestAttachmentViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const active = attachments[activeIndex];
  const canNavigate = attachments.length > 1;

  const activeLabel = useMemo(
    () => `${activeIndex + 1} / ${attachments.length}`,
    [activeIndex, attachments.length]
  );

  if (!active) {
    return null;
  }

  const goTo = (nextIndex: number) => {
    setZoom(1);
    setActiveIndex((nextIndex + attachments.length) % attachments.length);
  };

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-950 p-3 text-white">
      <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-xl bg-slate-900 sm:min-h-[360px]">
        <img
          src={active.previewUrl}
          alt={`Servis talebi eki ${activeLabel}`}
          className="max-h-[520px] max-w-full object-contain transition-transform"
          style={{ transform: `scale(${zoom})` }}
        />

        {canNavigate ? (
          <>
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              className="absolute left-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-950 shadow-lg transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              aria-label="Önceki görsel"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              className="absolute right-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-950 shadow-lg transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              aria-label="Sonraki görsel"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{activeLabel}</p>
          <p className="text-xs text-slate-300">
            {active.mimeType} · {active.sizeLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/10 px-3 text-xs font-semibold transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <Minus className="size-4" aria-hidden="true" />
            Uzaklaştır
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/10 px-3 text-xs font-semibold transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <Maximize2 className="size-4" aria-hidden="true" />
            Sıfırla
          </button>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.min(3, value + 0.25))}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/10 px-3 text-xs font-semibold transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <Plus className="size-4" aria-hidden="true" />
            Yakınlaştır
          </button>
          <a
            href={active.downloadUrl}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-orange-500 px-3 text-xs font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <Download className="size-4" aria-hidden="true" />
            İndir
          </a>
        </div>
      </div>

      {canNavigate ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {attachments.map((attachment, index) => (
            <button
              key={attachment.id}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`${index + 1}. görseli aç`}
              aria-current={index === activeIndex ? "true" : undefined}
              className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                index === activeIndex
                  ? "border-orange-400"
                  : "border-white/10 opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={attachment.previewUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
