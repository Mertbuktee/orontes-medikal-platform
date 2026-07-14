import { EmailDeliveryStatus } from "@prisma/client";

import {
  cancelEmailDelivery,
  retryEmailDelivery,
} from "@/app/admin/notification-actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaNotificationRepository } from "@/lib/database/repositories/notifications";
import {
  emailDeliveryListSchema,
  firstParam,
} from "@/lib/notifications/notification-validation";
import { hasPermission } from "@/lib/rbac/permissions";

export const dynamic = "force-dynamic";

type EmailDeliveriesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EmailDeliveriesPage({
  searchParams,
}: EmailDeliveriesPageProps) {
  const session = await requirePermission("notifications.emailDeliveries.view");
  const params = await searchParams;
  const parsed = emailDeliveryListSchema.parse({
    page: firstParam(params.page),
    pageSize: firstParam(params.pageSize),
    status: firstParam(params.status),
    templateKey: firstParam(params.templateKey),
    failedOnly: firstParam(params.failedOnly),
  });
  const result = await new PrismaNotificationRepository(prisma).listAdminDeliveries(parsed);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="E-posta Teslimatlari"
        description="Queued, retry ve failed transactional e-postalari guvenli sekilde izleyin."
        eyebrow="Bildirim Operasyonu"
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <form className="grid gap-3 md:grid-cols-5" action="/admin/notifications/email-deliveries">
          <select name="status" defaultValue={parsed.status ?? ""} className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm">
            <option value="">Tum durumlar</option>
            {Object.values(EmailDeliveryStatus).map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <input
            name="templateKey"
            defaultValue={parsed.templateKey ?? ""}
            placeholder="Template"
            className="min-h-11 rounded-2xl border border-slate-200 px-4 text-sm"
          />
          <select name="pageSize" defaultValue={parsed.pageSize} className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm">
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <label className="flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 px-3 text-sm font-semibold text-slate-700">
            <input type="checkbox" name="failedOnly" defaultChecked={parsed.failedOnly} />
            Failed/retry
          </label>
          <button className="min-h-11 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white">
            Filtrele
          </button>
        </form>
      </section>

      <p className="text-sm text-slate-600">
        {result.total} teslimat, sayfa {result.page}/{result.pageCount}
      </p>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden lg:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="px-5 py-4">Tarih</th>
                <th className="px-5 py-4">Template</th>
                <th className="px-5 py-4">Alici</th>
                <th className="px-5 py-4">Durum</th>
                <th className="px-5 py-4">Deneme</th>
                <th className="px-5 py-4">Hata</th>
                <th className="px-5 py-4">Islem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4 text-slate-600">{formatDate(item.createdAt)}</td>
                  <td className="px-5 py-4 font-semibold text-slate-950">{item.templateKey}</td>
                  <td className="px-5 py-4 text-slate-600">{item.recipient}</td>
                  <td className="px-5 py-4">{item.status}</td>
                  <td className="px-5 py-4">{item.attemptCount}</td>
                  <td className="px-5 py-4 text-slate-600">{item.errorCode ?? "-"}</td>
                  <td className="px-5 py-4">
                    <DeliveryActions
                      id={item.id}
                      status={item.status}
                      canRetry={hasPermission(session.role, "notifications.emailDeliveries.retry")}
                      canCancel={hasPermission(session.role, "notifications.emailDeliveries.cancel")}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 p-4 lg:hidden">
          {result.items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-950">{item.templateKey}</p>
              <p className="mt-1 text-sm text-slate-600">{item.recipient}</p>
              <p className="mt-2 text-sm">{item.status} - {item.attemptCount} deneme</p>
              <DeliveryActions
                id={item.id}
                status={item.status}
                canRetry={hasPermission(session.role, "notifications.emailDeliveries.retry")}
                canCancel={hasPermission(session.role, "notifications.emailDeliveries.cancel")}
              />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function DeliveryActions({
  id,
  status,
  canRetry,
  canCancel,
}: {
  id: string;
  status: EmailDeliveryStatus;
  canRetry: boolean;
  canCancel: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {canRetry && status === "FAILED" ? (
        <form action={retryEmailDelivery}>
          <input type="hidden" name="id" value={id} />
          <button className="rounded-xl bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">
            Retry
          </button>
        </form>
      ) : null}
      {canCancel && (status === "PENDING" || status === "RETRY_SCHEDULED") ? (
        <form action={cancelEmailDelivery}>
          <input type="hidden" name="id" value={id} />
          <button className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            Cancel
          </button>
        </form>
      ) : null}
    </div>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(date);
}
