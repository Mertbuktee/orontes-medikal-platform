import type { ServiceRequestStatus } from "@prisma/client";
import {
  ArrowUpRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FileText,
  Mail,
  Paperclip,
  Phone,
  Search,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ServiceRequestLiveWatcher } from "@/components/admin/service-requests/ServiceRequestLiveWatcher";
import {
  getServiceRequestStatusClassName,
  getServiceRequestStatusMeta,
  serviceRequestStatusOptions,
} from "@/components/admin/service-request-status";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import {
  normalizePage,
  normalizePageSize,
  PrismaServiceRequestRepository,
  serviceRequestPageSizes,
  type AdminServiceRequestSort,
} from "@/lib/database/repositories/service-requests";

type ServiceRequestsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminServiceRequestsPage({
  searchParams,
}: ServiceRequestsPageProps) {
  await requirePermission("serviceRequests.view");

  const params = await searchParams;
  const filters = parseFilters(params);
  const repository = new PrismaServiceRequestRepository(prisma);
  const [result, statusCounts, assignableUsers, liveSnapshot] = await Promise.all([
    repository.listAdminRequests(filters),
    repository.getStatusCounts(filters.archived),
    repository.listAssignableUsers(),
    repository.getLiveSnapshot(),
  ]);
  const totalActive = statusCounts.reduce(
    (total, item) => total + item._count.status,
    0
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Servis Operasyonu"
        title="Servis Talepleri"
        description="Web sitesi üzerinden iletilen teknik servis başvurularını inceleyin ve yönetin."
      />

      <ServiceRequestLiveWatcher
        initialSnapshot={serializeLiveSnapshot(liveSnapshot)}
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatusSummaryCard label="Listelenen Kayıt" value={result.total} active />
        <StatusSummaryCard label="Aktif Kapsam" value={totalActive} />
        {serviceRequestStatusOptions.slice(0, 2).map((option) => (
          <StatusSummaryCard
            key={option.value}
            label={option.label}
            value={
              statusCounts.find((item) => item.status === option.value)?._count
                .status ?? 0
            }
          />
        ))}
      </section>

      <ServiceRequestStatusTabs
        filters={filters}
        statusCounts={statusCounts}
        totalCount={totalActive}
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
        <form
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_repeat(8,minmax(0,1fr))_auto]"
          action="/admin/service-requests"
        >
          <label className="sr-only" htmlFor="service-request-search">
            Talep ara
          </label>
          <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 md:col-span-2 xl:col-span-1">
            <Search className="size-4 text-slate-400" aria-hidden="true" />
            <input
              id="service-request-search"
              name="q"
              defaultValue={filters.query}
              maxLength={120}
              placeholder="Ad, firma, telefon, e-posta veya talep no"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
          <SelectFilter name="status" label="Durum" value={filters.status ?? ""}>
            <option value="">Tüm durumlar</option>
            {serviceRequestStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectFilter>
          <SelectFilter
            name="assignedUserId"
            label="Atanan"
            value={filters.assignedUserId ?? ""}
          >
            <option value="">Tüm personel</option>
            {assignableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </SelectFilter>
          <SelectFilter
            name="hasAttachment"
            label="Dosya"
            value={
              typeof filters.hasAttachment === "boolean"
                ? String(filters.hasAttachment)
                : ""
            }
          >
            <option value="">Dosya fark etmez</option>
            <option value="true">Dosyalı</option>
            <option value="false">Dosyasız</option>
          </SelectFilter>
          <SelectFilter
            name="archived"
            label="Arşiv"
            value={filters.archived ?? "active"}
          >
            <option value="active">Aktif</option>
            <option value="archived">Arşiv</option>
            <option value="all">Tümü</option>
          </SelectFilter>
          <DateFilter
            name="dateFrom"
            label="Başlangıç"
            value={filters.dateFromInput}
          />
          <DateFilter name="dateTo" label="Bitiş" value={filters.dateToInput} />
          <SelectFilter name="sort" label="Sıralama" value={filters.sort}>
            <option value="newest">Yeni önce</option>
            <option value="oldest">Eski önce</option>
            <option value="updated">Güncellenen</option>
          </SelectFilter>
          <SelectFilter
            name="pageSize"
            label="Sayfa"
            value={String(filters.pageSize)}
          >
            {serviceRequestPageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </SelectFilter>
          <input type="hidden" name="page" value="1" />
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            Filtrele
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Gelen Başvurular
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {result.total} kayıt, sayfa {result.page}/{result.totalPages}
            </p>
          </div>
          <PaginationControls result={result} filters={filters} />
        </div>

        {result.items.length ? (
          <div className="divide-y divide-slate-100">
            {result.items.map((request) => {
              const statusMeta = getServiceRequestStatusMeta(request.status);
              const deviceLabel = [request.deviceBrand, request.deviceModel]
                .filter(Boolean)
                .join(" ");

              return (
                <article
                  key={request.id}
                  className="grid gap-4 px-5 py-5 transition hover:bg-slate-50 xl:grid-cols-[1fr_210px_180px_150px_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                        {shortId(request.id)}
                      </span>
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
                      {request.company || "Firma bilgisi yok"}
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
                      <Mail
                        className="size-4 shrink-0 text-sky-600"
                        aria-hidden="true"
                      />
                      <span className="truncate">{request.email}</span>
                    </p>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600">
                    <p className="font-semibold text-slate-800">
                      {request.assignedUser?.name ?? "Atanmadı"}
                    </p>
                    <p>{deviceLabel || "Cihaz bilgisi yok"}</p>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                      <CalendarClock
                        className="size-4 text-orange-500"
                        aria-hidden="true"
                      />
                      {formatDate(request.createdAt)}
                    </p>
                    <p className="flex items-center gap-2">
                      <FileText className="size-4 text-orange-500" aria-hidden="true" />
                      {request.attachments.length ? "Dosya var" : "Dosya yok"}
                    </p>
                  </div>

                  <div className="flex items-center xl:justify-end">
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

function SelectFilter({
  name,
  label,
  value,
  children,
}: {
  name: string;
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        name={name}
        defaultValue={value}
        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
      >
        {children}
      </select>
    </label>
  );
}

function DateFilter({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value?: string;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <input
        type="date"
        name={name}
        defaultValue={value}
        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
      />
    </label>
  );
}

function PaginationControls({
  result,
  filters,
}: {
  result: { page: number; totalPages: number };
  filters: ParsedServiceRequestFilters;
}) {
  const previousPage = Math.max(1, result.page - 1);
  const nextPage = Math.min(result.totalPages, result.page + 1);

  return (
    <div className="flex items-center gap-2">
      <Link
        href={buildListHref({ ...filters, page: previousPage })}
        aria-disabled={result.page <= 1}
        className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 aria-disabled:pointer-events-none aria-disabled:opacity-40"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        <span className="sr-only">Önceki sayfa</span>
      </Link>
      <Link
        href={buildListHref({ ...filters, page: nextPage })}
        aria-disabled={result.page >= result.totalPages}
        className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 aria-disabled:pointer-events-none aria-disabled:opacity-40"
      >
        <ChevronRight className="size-4" aria-hidden="true" />
        <span className="sr-only">Sonraki sayfa</span>
      </Link>
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

function ServiceRequestStatusTabs({
  filters,
  statusCounts,
  totalCount,
}: {
  filters: ParsedServiceRequestFilters;
  statusCounts: Array<{
    status: ServiceRequestStatus;
    _count: { status: number };
  }>;
  totalCount: number;
}) {
  const tabs: Array<{
    label: string;
    status?: ServiceRequestStatus;
    count: number;
  }> = [
    { label: "Tümü", count: totalCount },
    ...serviceRequestStatusOptions.map((option) => ({
      label: option.label,
      status: option.value,
      count:
        statusCounts.find((item) => item.status === option.value)?._count
          .status ?? 0,
    })),
  ];

  return (
    <nav
      aria-label="Servis talebi durumları"
      className="flex gap-2 overflow-x-auto rounded-3xl border border-slate-200 bg-white p-2 shadow-sm shadow-slate-200/60"
    >
      {tabs.map((tab) => {
        const active =
          filters.status === tab.status || (!filters.status && !tab.status);

        return (
          <Link
            key={tab.status ?? "all"}
            href={buildListHref({ ...filters, status: tab.status, page: 1 })}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-2xl px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
              active
                ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                : "text-slate-600 hover:bg-orange-50 hover:text-orange-700"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                active
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function ClipboardEmptyState() {
  return (
    <div>
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <FileText className="size-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-950">
        Henüz servis talebi bulunmuyor.
      </h3>
      <p className="mt-2 text-sm text-slate-500">
        Filtreleri temizleyin veya yeni başvuruların gelmesini bekleyin.
      </p>
    </div>
  );
}

type ParsedServiceRequestFilters = {
  status?: ServiceRequestStatus;
  assignedUserId?: string;
  hasAttachment?: boolean;
  archived: "active" | "archived" | "all";
  query?: string;
  dateFrom?: Date;
  dateTo?: Date;
  dateFromInput?: string;
  dateToInput?: string;
  page: number;
  pageSize: number;
  sort: AdminServiceRequestSort;
};

function parseFilters(
  params: Record<string, string | string[] | undefined>
): ParsedServiceRequestFilters {
  const dateFromInput = parseDateInput(getParam(params.dateFrom));
  const dateToInput = parseDateInput(getParam(params.dateTo));
  const status = parseStatus(getParam(params.status));
  const archived = parseArchive(getParam(params.archived));

  return {
    status,
    assignedUserId: getParam(params.assignedUserId),
    hasAttachment: parseBoolean(getParam(params.hasAttachment)),
    archived: status === "ARCHIVED" && archived === "active" ? "archived" : archived,
    query: getParam(params.q)?.slice(0, 120),
    dateFromInput,
    dateToInput,
    dateFrom: dateFromInput ? new Date(`${dateFromInput}T00:00:00.000Z`) : undefined,
    dateTo: dateToInput ? new Date(`${dateToInput}T23:59:59.999Z`) : undefined,
    page: normalizePage(Number(getParam(params.page))),
    pageSize: normalizePageSize(Number(getParam(params.pageSize))),
    sort: parseSort(getParam(params.sort)),
  };
}

function buildListHref(filters: ParsedServiceRequestFilters) {
  const params = new URLSearchParams();
  const archived =
    filters.status === "ARCHIVED" && filters.archived === "active"
      ? "archived"
      : filters.archived;

  if (filters.query) params.set("q", filters.query);
  if (filters.status) params.set("status", filters.status);
  if (filters.assignedUserId) params.set("assignedUserId", filters.assignedUserId);
  if (typeof filters.hasAttachment === "boolean") {
    params.set("hasAttachment", String(filters.hasAttachment));
  }
  if (archived !== "active") params.set("archived", archived);
  if (filters.dateFromInput) params.set("dateFrom", filters.dateFromInput);
  if (filters.dateToInput) params.set("dateTo", filters.dateToInput);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.pageSize !== 20) params.set("pageSize", String(filters.pageSize));
  if (filters.page > 1) params.set("page", String(filters.page));

  const query = params.toString();
  return query ? `/admin/service-requests?${query}` : "/admin/service-requests";
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseStatus(value: string | undefined): ServiceRequestStatus | undefined {
  return serviceRequestStatusOptions.some((option) => option.value === value)
    ? (value as ServiceRequestStatus)
    : undefined;
}

function parseBoolean(value: string | undefined) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function parseArchive(value: string | undefined) {
  return value === "archived" || value === "all" ? value : "active";
}

function parseSort(value: string | undefined): AdminServiceRequestSort {
  return value === "oldest" || value === "updated" ? value : "newest";
}

function parseDateInput(value: string | undefined) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function shortId(id: string) {
  return `#${id.slice(-6).toUpperCase()}`;
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

function serializeLiveSnapshot(
  snapshot: Awaited<
    ReturnType<PrismaServiceRequestRepository["getLiveSnapshot"]>
  >
) {
  return {
    totalActive: snapshot.totalActive,
    latestCreated: snapshot.latestCreated
      ? {
          ...snapshot.latestCreated,
          createdAt: snapshot.latestCreated.createdAt.toISOString(),
          updatedAt: snapshot.latestCreated.updatedAt.toISOString(),
        }
      : null,
    latestUpdated: snapshot.latestUpdated
      ? {
          ...snapshot.latestUpdated,
          updatedAt: snapshot.latestUpdated.updatedAt.toISOString(),
        }
      : null,
  };
}
