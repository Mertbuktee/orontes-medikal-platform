"use client";

import { Bell, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

export type NotificationPreviewItem = {
  id: string;
  title: string;
  message: string;
  linkUrl: string | null;
  createdAt: string;
};

type NotificationPreviewMenuProps = {
  unreadNotificationCount: number;
  items: NotificationPreviewItem[];
  allHref: string;
  accent?: "orange" | "cyan";
};

export function NotificationPreviewMenu({
  unreadNotificationCount,
  items,
  allHref,
  accent = "orange",
}: NotificationPreviewMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const buttonClassName =
    accent === "cyan"
      ? "relative inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
      : "relative inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500";
  const badgeClassName =
    accent === "cyan"
      ? "absolute -right-1 -top-1 min-w-5 rounded-full bg-cyan-600 px-1.5 text-center text-[11px] font-bold text-white"
      : "absolute -right-1 -top-1 min-w-5 rounded-full bg-orange-500 px-1.5 text-center text-[11px] font-bold text-white";
  const countClassName =
    accent === "cyan"
      ? "rounded-full bg-cyan-50 px-2 py-1 text-xs font-semibold text-cyan-800"
      : "rounded-full bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700";
  const focusClassName =
    accent === "cyan"
      ? "focus-visible:ring-cyan-500"
      : "focus-visible:ring-orange-500";
  const allButtonClassName =
    accent === "cyan"
      ? "inline-flex h-10 w-full items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
      : "inline-flex h-10 w-full items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Bildirim panelini aç"
        aria-controls={menuId}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className={buttonClassName}
      >
        <Bell className="size-4" aria-hidden="true" />
        {unreadNotificationCount > 0 ? (
          <span className={badgeClassName}>
            {Math.min(unreadNotificationCount, 99)}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="dialog"
          aria-label="Okunmamış bildirimler"
          className="absolute right-0 top-13 z-50 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-950">
                Okunmamış bildirimler
              </p>
              <span className={countClassName}>{unreadNotificationCount}</span>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto py-1">
            {items.length > 0 ? (
              items.map((item) => {
                const content = (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {item.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                        {item.message}
                      </p>
                      <p className="mt-2 text-[11px] font-medium text-slate-400">
                        {formatNotificationTime(item.createdAt)}
                      </p>
                    </div>
                    <ChevronRight
                      className="mt-1 size-4 shrink-0 text-slate-300"
                      aria-hidden="true"
                    />
                  </>
                );

                if (item.linkUrl?.startsWith("/")) {
                  return (
                    <Link
                      key={item.id}
                      href={item.linkUrl}
                      onClick={() => setIsOpen(false)}
                      className={`flex gap-3 px-4 py-3 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset ${focusClassName}`}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <div key={item.id} className="flex gap-3 px-4 py-3">
                    {content}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-6 text-sm text-slate-500">
                Okunmamış bildirim yok.
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 p-3">
            <Link
              href={allHref}
              onClick={() => setIsOpen(false)}
              className={allButtonClassName}
            >
              Tümünü gör
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatNotificationTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
