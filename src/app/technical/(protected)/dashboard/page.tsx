import { ClipboardList, Clock3, CheckCircle2, Hourglass, RefreshCcw } from "lucide-react";
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

export default async function TechnicalDashboardPage() {
  await requirePermission("serviceRequests.view");

  const repository = new PrismaServiceRequestRepository(prisma);
  const summary = await repository.getTechnicalDashboardSummary();
  const count = (status: string) =>
    summary.statusCounts.find((item) => item.status === status)?._count.status ?? 0;

  const metrics = [
    { label: "Yeni Talepler", value: count("NEW"), icon: ClipboardList },
    { label: "İnceleniyor", value: count("REVIEWING"), icon: Clock3 },
    { label: "Bekleyen", value: count("WAITING_FOR_CUSTOMER"), icon: Hourglass },
    { label: "Tamamlanan", value: count("COMPLETED"), icon: CheckCircle2 },
    { label: "Son 7 Gün Güncellenen", value: summary.recentlyUpdated, icon: RefreshCcw },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Teknik Operasyon"
        title="Teknik Dashboard"
        description="Servis operasyonunun anlık durumunu gerçek servis talebi kayıtlarından takip edin."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                <Icon className="size-5 text-cyan-600" aria-hidden="true" />
              </div>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{metric.value}</p>
            </div>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Son Güncellenen Talepler</h2>
            <p className="mt-1 text-sm text-slate-500">Operasyon akışındaki en yeni beş kayıt.</p>
          </div>
          <Link
            href="/technical/service-requests"
            className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
          >
            Tümünü Gör
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {summary.latest.length ? (
            summary.latest.map((request) => {
              const status = getServiceRequestStatusMeta(request.status);
              return (
                <Link
                  key={request.id}
                  href={`/technical/service-requests/${request.id}`}
                  className="grid gap-3 px-5 py-4 transition hover:bg-slate-50 md:grid-cols-[1fr_180px_180px]"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-950">{request.fullName}</p>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {request.company || "Firma bilgisi yok"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex w-fit self-start rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getServiceRequestStatusClassName(request.status)}`}
                  >
                    {status.label}
                  </span>
                  <p className="text-sm text-slate-500">{formatDate(request.updatedAt)}</p>
                </Link>
              );
            })
          ) : (
            <p className="px-5 py-10 text-sm text-slate-500">Henüz servis talebi bulunmuyor.</p>
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
