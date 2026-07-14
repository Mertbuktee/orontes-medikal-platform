import { NotificationCategory } from "@prisma/client";
import Link from "next/link";

import { markAllNotificationsRead, markNotificationRead } from "@/app/admin/notification-actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaNotificationRepository } from "@/lib/database/repositories/notifications";
import {
  firstParam,
  notificationListSchema,
} from "@/lib/notifications/notification-validation";

export const dynamic = "force-dynamic";

type NotificationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminNotificationsPage({
  searchParams,
}: NotificationsPageProps) {
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
        title="Bildirim Merkezi"
        description="Size ait operasyon, guvenlik ve icerik bildirimlerini takip edin."
        eyebrow="Bildirimler"
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <form className="grid gap-3 md:grid-cols-5" action="/admin/notifications">
          <select name="state" defaultValue={parsed.state} className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm">
            <option value="all">Tum bildirimler</option>
            <option value="unread">Okunmamis</option>
            <option value="read">Okunmus</option>
          </select>
          <select name="category" defaultValue={parsed.category ?? ""} className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm md:col-span-2">
            <option value="">Tum kategoriler</option>
            {Object.values(NotificationCategory).map((category) => (
              <option key={category} value={category}>{getCategoryLabel(category)}</option>
            ))}
          </select>
          <select name="pageSize" defaultValue={parsed.pageSize} className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm">
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <button className="min-h-11 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white">
            Filtrele
          </button>
        </form>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {result.total} bildirim, sayfa {result.page}/{result.pageCount}
        </p>
        <form action={markAllNotificationsRead}>
          <button className="min-h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:border-orange-200">
            Tumunu okundu yap
          </button>
        </form>
      </div>

      {result.items.length ? (
        <section className="grid gap-3">
          {result.items.map((item) => (
            <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {getCategoryLabel(item.category)}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-950">{item.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{item.message}</p>
                  <p className="mt-3 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.readAt ? "bg-slate-100 text-slate-600" : "bg-orange-50 text-orange-700"}`}>
                  {item.readAt ? "Okundu" : "Yeni"}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.linkUrl ? (
                  <Link href={item.linkUrl} className="rounded-2xl bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                    Detayi ac
                  </Link>
                ) : null}
                {!item.readAt ? (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
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
          <h2 className="text-lg font-semibold text-slate-950">Bildirim bulunmuyor.</h2>
        </section>
      )}
    </div>
  );
}

export function getCategoryLabel(category: NotificationCategory) {
  const labels: Record<NotificationCategory, string> = {
    SERVICE_REQUEST_NEW: "Yeni servis talebi",
    SERVICE_REQUEST_ASSIGNED: "Servis atamasi",
    SERVICE_REQUEST_STATUS_CHANGED: "Servis durum degisimi",
    SERVICE_REQUEST_NOTE_ADDED: "Servis notu",
    CONTENT_PUBLISHED: "Icerik yayini",
    CONTENT_SCHEDULED: "Planli icerik",
    SECURITY_ALERT: "Guvenlik uyarisi",
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
