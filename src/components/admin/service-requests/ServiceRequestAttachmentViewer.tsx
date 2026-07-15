'use client';

/* eslint-disable @next/next/no-img-element -- Private authenticated attachments are served through protected admin routes, not the public Next image optimizer. */

import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minus,
  Plus,
} from 'lucide-react';
import { useMemo, useState } from 'react';

export type ServiceRequestImageAttachment = {
  id: string;
  mimeType: string;
  sizeLabel: string;
  previewUrl: string;
};

type ServiceRequestAttachmentViewerProps = {
  attachments: ServiceRequestImageAttachment[];
};

type PanPosition = {
  x: number;
  y: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

export function ServiceRequestAttachmentViewer({
  attachments,
}: ServiceRequestAttachmentViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<PanPosition>({ x: 0, y: 0 });
  const [drag, setDrag] = useState<DragState | null>(null);
  const active = attachments[activeIndex];
  const canNavigate = attachments.length > 1;

  const activeLabel = useMemo(
    () => `${activeIndex + 1} / ${attachments.length}`,
    [activeIndex, attachments.length],
  );

  if (!active) {
    return null;
  }

  const goTo = (nextIndex: number) => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setDrag(null);
    setActiveIndex((nextIndex + attachments.length) % attachments.length);
  };

  const updateZoom = (nextZoom: number) => {
    const boundedZoom = Math.min(3, Math.max(0.5, nextZoom));
    setZoom(boundedZoom);
    if (boundedZoom <= 1) {
      setPan({ x: 0, y: 0 });
      setDrag(null);
    }
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setDrag(null);
  };

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-950 p-3 text-white">
      <div
        className={`relative flex min-h-[260px] touch-none items-center justify-center overflow-hidden rounded-xl bg-slate-900 select-none sm:min-h-[360px] ${
          zoom > 1 ? (drag ? 'cursor-grabbing' : 'cursor-grab') : ''
        }`}
        onPointerDown={(event) => {
          if (zoom <= 1 || event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          setDrag({
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            originX: pan.x,
            originY: pan.y,
          });
        }}
        onPointerMove={(event) => {
          if (!drag || drag.pointerId !== event.pointerId) return;
          setPan({
            x: drag.originX + event.clientX - drag.startX,
            y: drag.originY + event.clientY - drag.startY,
          });
        }}
        onPointerUp={(event) => {
          if (drag?.pointerId === event.pointerId) setDrag(null);
        }}
        onPointerCancel={(event) => {
          if (drag?.pointerId === event.pointerId) setDrag(null);
        }}
      >
        <img
          src={active.previewUrl}
          alt={`Servis talebi eki ${activeLabel}`}
          draggable={false}
          className="max-h-[520px] max-w-full object-contain transition-transform"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          }}
        />

        {canNavigate ? (
          <>
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              className="absolute top-1/2 left-3 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-950 shadow-lg transition hover:bg-white focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
              aria-label="Önceki görsel"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              className="absolute top-1/2 right-3 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-950 shadow-lg transition hover:bg-white focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
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
            onClick={() => updateZoom(zoom - 0.25)}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/10 px-3 text-xs font-semibold transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
          >
            <Minus className="size-4" aria-hidden="true" />
            Uzaklaştır
          </button>
          <button
            type="button"
            onClick={resetView}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/10 px-3 text-xs font-semibold transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
          >
            <Maximize2 className="size-4" aria-hidden="true" />
            Sıfırla
          </button>
          <button
            type="button"
            onClick={() => updateZoom(zoom + 0.25)}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/10 px-3 text-xs font-semibold transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
          >
            <Plus className="size-4" aria-hidden="true" />
            Yakınlaştır
          </button>
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
              aria-current={index === activeIndex ? 'true' : undefined}
              className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border transition focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none ${
                index === activeIndex
                  ? 'border-orange-400'
                  : 'border-white/10 opacity-70 hover:opacity-100'
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
