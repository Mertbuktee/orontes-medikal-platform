"use client";

import { Bell, RefreshCw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type LiveSnapshot = {
  totalActive: number;
  latestCreated: {
    id: string;
    fullName: string;
    company: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  latestUpdated: {
    id: string;
    updatedAt: string;
  } | null;
};

type ServiceRequestLiveWatcherProps = {
  initialSnapshot: LiveSnapshot;
  intervalMs?: number;
};

export function ServiceRequestLiveWatcher({
  initialSnapshot,
  intervalMs = 7000,
}: ServiceRequestLiveWatcherProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string>();
  const [desktopPermission, setDesktopPermission] = useState<
    NotificationPermission | "unsupported"
  >(() =>
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported"
  );
  const snapshotRef = useRef(initialSnapshot);
  const refreshInFlightRef = useRef(false);

  const showDesktopNotification = useCallback((label: string) => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    new Notification("Yeni servis talebi", {
      body: label,
      tag: "orontes-service-request",
    });
  }, []);

  useEffect(() => {
    snapshotRef.current = initialSnapshot;
  }, [initialSnapshot]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (document.visibilityState !== "visible") return;

      try {
        const response = await fetch("/api/admin/service-requests/live", {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) return;

        const payload = (await response.json()) as {
          success: boolean;
          snapshot?: LiveSnapshot;
        };

        if (!payload.success || !payload.snapshot || cancelled) return;

        const previous = snapshotRef.current;
        const next = payload.snapshot;
        const hasNewRequest =
          next.latestCreated &&
          (!previous.latestCreated ||
            new Date(next.latestCreated.createdAt).getTime() >
              new Date(previous.latestCreated.createdAt).getTime());
        const hasListChange =
          next.totalActive !== previous.totalActive ||
          next.latestUpdated?.updatedAt !== previous.latestUpdated?.updatedAt;

        snapshotRef.current = next;

        if (hasNewRequest && next.latestCreated) {
          const label = next.latestCreated.company || next.latestCreated.fullName;
          setMessage(`Yeni servis talebi geldi: ${label}`);
          showDesktopNotification(label);
        } else if (hasListChange) {
          setMessage("Servis talepleri güncellendi.");
        }

        if (hasNewRequest || hasListChange) {
          refreshInFlightRef.current = true;
          router.refresh();
          window.setTimeout(() => {
            refreshInFlightRef.current = false;
          }, 1500);
        }
      } catch {
        // Live refresh must never interrupt the operator's page.
      }
    }

    const timer = window.setInterval(() => {
      if (!refreshInFlightRef.current) void poll();
    }, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [intervalMs, router, showDesktopNotification]);

  async function requestDesktopPermission() {
    if (!("Notification" in window)) {
      setDesktopPermission("unsupported");
      return;
    }

    const permission = await Notification.requestPermission();
    setDesktopPermission(permission);
  }

  return (
    <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-950 shadow-sm shadow-cyan-100/70">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-semibold">
          <RefreshCw className="size-4" aria-hidden="true" />
          Canlı takip açık
        </div>
        {desktopPermission === "default" ? (
          <button
            type="button"
            onClick={requestDesktopPermission}
            className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-cyan-200 bg-white px-3 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100"
          >
            <Bell className="size-4" aria-hidden="true" />
            Masaüstü bildirimi aç
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-cyan-800">
        Sayfa yeni talepleri otomatik algılar ve listeyi yeniler.
      </p>
      {message ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-cyan-200 bg-white px-3 py-2 text-cyan-950">
          <span>{message}</span>
          <button
            type="button"
            onClick={() => setMessage(undefined)}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-cyan-700 transition hover:bg-cyan-50"
            aria-label="Bildirimi kapat"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
