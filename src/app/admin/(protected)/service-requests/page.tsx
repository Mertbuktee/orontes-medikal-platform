import type { ServiceRequestStatus } from "@prisma/client";
import {
  ArrowUpRight,
  CalendarClock,
  FileText,
  Mail,
  Paperclip,
  Phone,
  Search,
} from "lucide-react";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  getServiceRequestStatusClassName,
  getServiceRequestStatusMeta,
  serviceRequestStatusOptions,
} from "@/components/admin/service-request-status";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaServiceRequestRepository } from "@/lib/database/repositories/service-requests";

type ServiceRequestsPageProps = {
  searchParams: Promise<{
    status?: string;
    q?: string;
  }>;
};

export default async function AdminServiceRequestsPage({
  searchParams,
}: ServiceRequestsPageProps) {
  await requirePermission("serviceRequests.view");

  const params = await searchParams;
  const status = parseStatus(params.status);
  const query = typeof params.q === "string" ? params.q : undefined;
  const repository = new PrismaServiceRequestRepository(prisma);
  const [requests, statusCounts] = await Promise.all([
    repository.list({ status, query }),
    repository.getStatusCounts(),
  ]);
  const totalActive = statusCounts.reduce((total, item) => total + item._count.status, 0);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Servis Operasyonu"
        title="Servis Talepleri"
        description="Web sitesinden gelen teknik servis başvurularını inceleyin, durumlarını yönetin ve ekip içi notları takip edin."
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatusSummaryCard label="Aktif Talepler" value={totalActive} active />
        {serviceRequestStatusOptions.slice(0, 3).map((option) => (
          <StatusSummaryCard
            key={option.value}
            label={option.label}
            value={statusCounts.find((item) => item.status === option.value)?._count.status ?? 0}
          />
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
        <form className="grid gap-3 lg:grid-cols-[1fr_220px_auto]" action="/admin/service-requests">
          <label className="sr-only" htmlFor="service-request-search">
            Talep ara
          </label>
          <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
            <Search className="size-4 text-slate-400" aria-hidden="true" />
            <input
              id="service-request-search"
              name="q"
              defaultValue={query}
              placeholder="Ad, firma, telefon, e-posta veya cihaz ara"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
          <label className="sr-only" htmlFor="service-request-status">
            Durum filtresi
          </label>
          <select
            id="service-request-status"
            name="status"
            defaultValue={status ?? ""}
            className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          >
            <option value="">Tüm durumlar</option>
            {serviceRequestStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            Filtrele
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">
            Gelen Başvurular
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Son 50 aktif servis talebi listelenir.
          </p>
        </div>

        {requests.length ? (
          <div className="divide-y divide-slate-100">
            {requests.map((request) => {
              const statusMeta = getServiceRequestStatusMeta(request.status);
              const deviceLabel = [request.deviceBrand, request.deviceModel]
                .filter(Boolean)
                .join(" ");

              return (
                <article
                  key={request.id}
                  className="grid gap-4 px-5 py-5 transition hover:bg-slate-50 lg:grid-cols-[1fr_190px_150px_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-950">
                        {request.fullName}
                      </h3>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getServiceRequestStatusClassName(request.status)}`}
                      >
                        {statusMeta.label}
                      </span>
                      {request.attachments.length > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          <Paperclip className="size-3" aria-hidden="true" />
                          Dosya
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {request.company}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {request.message}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                      <Phone className="size-4 text-sky-600" aria-hidden="true" />
                      {request.phone}
                    </p>
                    <p className="flex min-w-0 items-center gap-2">
                      <Mail className="size-4 shrink-0 text-sky-600" aria-hidden="true" />
                      <span className="truncate">{request.email}</span>
                    </p>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                      <CalendarClock className="size-4 text-orange-500" aria-hidden="true" />
                      {formatDate(request.createdAt)}
                    </p>
                    <p className="flex items-center gap-2">
                      <FileText className="size-4 text-orange-500" aria-hidden="true" />
                      {deviceLabel || "Cihaz bilgisi yok"}
                    </p>
                  </div>

                  <div className="flex items-center lg:justify-end">
                    <Link
                      href={`/admin/service-requests/${request.id}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    >
                      Detay
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-14 text-center">
            <ClipboardEmptyState />
          </div>
        )}
      </section>
    </div>
  );
}

function StatusSummaryCard({
  label,
  value,
  active = false,
}: {
  label: string;
  value: number;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        active
          ? "border-orange-200 bg-orange-50 shadow-orange-100/70"
          : "border-slate-200 bg-white shadow-slate-200/60"
      }`}
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ClipboardEmptyState() {
  return (
    <div>
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <FileText className="size-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-950">
        Servis talebi bulunmuyor
      </h3>
      <p className="mt-2 text-sm text-slate-500">
        Filtreleri temizleyin veya yeni başvuruların gelmesini bekleyin.
      </p>
    </div>
  );
}

function parseStatus(value: string | undefined): ServiceRequestStatus | undefined {
  if (!value) {
    return undefined;
  }

  return serviceRequestStatusOptions.some((option) => option.value === value)
    ? (value as ServiceRequestStatus)
    : undefined;
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
