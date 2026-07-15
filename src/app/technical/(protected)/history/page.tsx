import { CheckCircle2, FileText } from "lucide-react";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  getServiceRequestStatusClassName,
  getServiceRequestStatusMeta,
} from "@/components/admin/service-request-status";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaServiceRequestRepository } from "@/lib/database/repositories/service-requests";

export const dynamic = "force-dynamic";

export default async function TechnicalHistoryPage() {
  await requirePermission("serviceRequests.view");

  const repository = new PrismaServiceRequestRepository(prisma);
  const history = await repository.listCompletedServiceHistory();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Teknik Operasyon"
        title="Servis Geçmişi"
        description="Tamamlanan veya arşivlenen servis taleplerini geçmiş görünümünde inceleyin."
      />

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Tamamlanan Servisler</h2>
          <p className="mt-1 text-sm text-slate-500">{history.length} kayıt gösteriliyor.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {history.length ? (
            history.map((item) => {
              const status = getServiceRequestStatusMeta(item.serviceRequest.status);
              const deviceLabel = [item.deviceBrand, item.deviceModel].filter(Boolean).join(" ");
              return (
                <article key={item.id} className="grid gap-4 px-5 py-5 transition hover:bg-slate-50 md:grid-cols-[1fr_180px_170px_170px]">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-semibold text-slate-950">
                      <CheckCircle2 className="size-4 text-cyan-600" aria-hidden="true" />
                      {item.fullName}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{item.company || "Firma bilgisi yok"}</p>
                    <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-500">
                      <FileText className="size-4" aria-hidden="true" />
                      {deviceLabel || "Cihaz bilgisi yok"}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Seri No: {item.deviceSerialNumber || "Belirtilmedi"}
                    </p>
                  </div>
                  <span className={`inline-flex h-fit w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getServiceRequestStatusClassName(item.serviceRequest.status)}`}>
                    {status.label}
                  </span>
                  <p className="text-sm font-semibold text-slate-700 md:text-right">{formatDate(item.completedAt)}</p>
                  <div className="flex flex-wrap items-start gap-2 md:justify-end">
                    <Link
                      href={`/technical/service-requests/${item.serviceRequestId}`}
                      className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50"
                    >
                      Detay
                    </Link>
                    <Link
                      href={`/technical/service-requests/new?historyId=${item.id}`}
                      className="inline-flex min-h-10 items-center rounded-xl bg-cyan-500 px-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                    >
                      Yeni Servis Oluştur
                    </Link>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="px-5 py-10 text-sm text-slate-500">Henüz tamamlanan servis kaydı bulunmuyor.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
