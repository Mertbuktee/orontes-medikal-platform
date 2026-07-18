import { NotificationCategory } from "@prisma/client";
import Link from "next/link";

import {
  markAllTechnicalNotificationsRead,
  markTechnicalNotificationRead,
} from "@/app/technical/notification-actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaNotificationRepository } from "@/lib/database/repositories/notifications";
import {
  firstParam,
  notificationListSchema,
} from "@/lib/notifications/notification-validation";

export const dynamic = "force-dynamic";

type TechnicalNotificationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TechnicalNotificationsPage({
  searchParams,
}: TechnicalNotificationsPageProps) {
  const session = await requirePermission("notifications.view");
  const params = await searchParams;
  const parsed = notificationListSchema.parse({
    page: firstParam(params.page),
    pageSize: firstParam(params.pageSize),
    state: firstParam(params.state),
    category: firstParam(params.category),
  });
  const repository = new PrismaNotificationRepository(prisma);
  const result = await repository.listForUser({
    userId: session.userId,
    ...parsed,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Bildirimler"
        description="Teknik operasyonla ilgili okunmamış, okunmuş ve sistem bildirimlerinizi takip edin."
        eyebrow="Teknik Operasyon"
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <form className="grid gap-3 md:grid-cols-5" action="/technical/notifications">
          <select
            name="state"
            defaultValue={parsed.state}
            className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm"
          >
            <option value="all">Tüm bildirimler</option>
            <option value="unread">Okunmamış</option>
            <option value="read">Okunmuş</option>
          </select>
          <select
            name="category"
            defaultValue={parsed.category ?? ""}
            className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm md:col-span-2"
          >
            <option value="">Tüm kategoriler</option>
            {Object.values(NotificationCategory).map((category) => (
              <option key={category} value={category}>
                {getCategoryLabel(category)}
              </option>
            ))}
          </select>
          <select
            name="pageSize"
            defaultValue={parsed.pageSize}
            className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm"
          >
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <button className="min-h-11 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-cyan-700">
            Filtrele
          </button>
        </form>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {result.total} bildirim, sayfa {result.page}/{result.pageCount}
        </p>
        <form action={markAllTechnicalNotificationsRead}>
          <button className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800">
            Tümünü okundu yap
          </button>
        </form>
      </div>

      {result.items.length ? (
        <section className="grid gap-3">
          {result.items.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {getCategoryLabel(item.category)}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-950">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">{item.message}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    {formatDate(item.createdAt)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    item.readAt
                      ? "bg-slate-100 text-slate-600"
                      : "bg-cyan-50 text-cyan-800"
                  }`}
                >
                  {item.readAt ? "Okundu" : "Yeni"}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.linkUrl ? (
                  <Link
                    href={item.linkUrl}
                    className="rounded-2xl bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800"
                  >
                    Detayı aç
                  </Link>
                ) : null}
                {!item.readAt ? (
                  <form action={markTechnicalNotificationRead}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800">
                      Okundu yap
                    </button>
                  </form>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-950">
            Bildirim bulunmuyor.
          </h2>
        </section>
      )}
    </div>
  );
}

function getCategoryLabel(category: NotificationCategory) {
  const labels: Record<NotificationCategory, string> = {
    SERVICE_REQUEST_NEW: "Servis talebi",
    SERVICE_REQUEST_ASSIGNED: "Servis ataması",
    SERVICE_REQUEST_STATUS_CHANGED: "Servis durum değişimi",
    SERVICE_REQUEST_NOTE_ADDED: "Servis notu",
    CONTENT_PUBLISHED: "İçerik yayını",
    CONTENT_SCHEDULED: "Planlı içerik",
    SECURITY_ALERT: "Güvenlik uyarısı",
    PASSWORD_CHANGED: "Parola",
    MFA_CHANGED: "MFA",
    SESSION_REVOKED: "Oturum",
    SYSTEM_ALERT: "Sistem",
  };

  return labels[category];
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(date);
}
