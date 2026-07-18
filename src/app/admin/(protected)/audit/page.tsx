import { AuditAction } from "@prisma/client";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  getAuditCategoryLabel,
  getAuditSeverityLabel,
} from "@/lib/audit/audit-presentation";
import {
  auditCategories,
  auditSeverities,
  auditSuccessStates,
  parseAuditListSearchParams,
} from "@/lib/audit/audit-validation";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaAuditLogRepository } from "@/lib/database/repositories/audit-logs";
import { hasPermission } from "@/lib/rbac/permissions";

export const dynamic = "force-dynamic";

type AuditPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminAuditPage({ searchParams }: AuditPageProps) {
  const session = await requirePermission("audit.view");
  const params = await searchParams;
  const parsed = parseAuditListSearchParams(params);
  const repository = new PrismaAuditLogRepository(prisma);
  const result = await repository.listAuditEvents(parsed);
  const exportHref = `/admin/audit/export?${new URLSearchParams(
    cleanSearchParams({ ...params, format: "csv", limit: "1000" })
  ).toString()}`;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Audit Log"
        description="Yönetim panelindeki kritik işlemleri güvenli, redakte edilmiş ve okunabilir şekilde inceleyin."
        eyebrow="Güvenlik"
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <form className="grid gap-3 md:grid-cols-4 xl:grid-cols-8" action="/admin/audit">
          <input
            name="query"
            defaultValue={parsed.query}
            placeholder="Actor, entity veya ID ara"
            className="min-h-11 rounded-2xl border border-slate-200 px-4 text-sm md:col-span-2"
          />
          <select name="category" defaultValue={parsed.category ?? ""} className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm">
            <option value="">Tüm kategoriler</option>
            {auditCategories.map((category) => (
              <option key={category} value={category}>
                {getAuditCategoryLabel(category)}
              </option>
            ))}
          </select>
          <select name="severity" defaultValue={parsed.severity ?? ""} className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm">
            <option value="">Tüm seviyeler</option>
            {auditSeverities.map((severity) => (
              <option key={severity} value={severity}>
                {getAuditSeverityLabel(severity)}
              </option>
            ))}
          </select>
          <select name="success" defaultValue={parsed.success ?? ""} className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm">
            <option value="">Tüm sonuçlar</option>
            {auditSuccessStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <select name="action" defaultValue={parsed.action ?? ""} className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm">
            <option value="">Tüm aksiyonlar</option>
            {Object.values(AuditAction).map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
          <select name="pageSize" defaultValue={parsed.pageSize} className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm">
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
          </select>
          <button className="min-h-11 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
            Filtrele
          </button>
        </form>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {result.total} kayit, sayfa {result.page}/{result.pageCount}
        </p>
        {hasPermission(session.role, "audit.export") ? (
          <Link
            href={exportHref}
            className="inline-flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-orange-200 hover:text-orange-700"
          >
            Guvenli CSV indir
          </Link>
        ) : null}
      </div>

      {result.items.length ? (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Zaman</th>
                  <th className="px-5 py-4">Olay</th>
                  <th className="px-5 py-4">Actor</th>
                  <th className="px-5 py-4">Entity</th>
                  <th className="px-5 py-4">Seviye</th>
                  <th className="px-5 py-4">Islem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.items.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-5 py-4 text-slate-600">{formatDate(item.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-950">{item.presentation.label}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.presentation.summary}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-700">{item.actor?.name ?? "System"}</td>
                    <td className="px-5 py-4 text-slate-700">
                      {item.entityType}
                      {item.entityId ? <span className="block text-xs text-slate-500">{shortId(item.entityId)}</span> : null}
                    </td>
                    <td className="px-5 py-4">
                      <AuditBadge label={getAuditSeverityLabel(item.presentation.severity)} tone={item.presentation.severity} />
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/admin/audit/${item.id}`} className="font-semibold text-sky-700 hover:text-orange-700">
                        Detay
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-4 lg:hidden">
            {result.items.map((item) => (
              <Link
                key={item.id}
                href={`/admin/audit/${item.id}`}
                className="rounded-2xl border border-slate-200 p-4 transition hover:border-orange-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{item.presentation.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                  </div>
                  <AuditBadge label={getAuditSeverityLabel(item.presentation.severity)} tone={item.presentation.severity} />
                </div>
                <p className="mt-3 text-sm text-slate-600">{item.presentation.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-950">Audit kaydi bulunmuyor.</h2>
          <p className="mt-2 text-sm text-slate-600">Filtreleri genisleterek tekrar deneyin.</p>
        </section>
      )}

      <Pagination page={result.page} pageCount={result.pageCount} params={params} />
    </div>
  );
}

function AuditBadge({ label, tone }: { label: string; tone: string }) {
  const className =
    tone === "CRITICAL"
      ? "bg-red-50 text-red-700"
      : tone === "WARNING"
        ? "bg-amber-50 text-amber-700"
        : tone === "NOTICE"
          ? "bg-sky-50 text-sky-700"
          : "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function Pagination({
  page,
  pageCount,
  params,
}: {
  page: number;
  pageCount: number;
  params: Record<string, string | string[] | undefined>;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Link
        href={`/admin/audit?${new URLSearchParams(cleanSearchParams({ ...params, page: String(Math.max(1, page - 1)) })).toString()}`}
        aria-disabled={page <= 1}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 aria-disabled:pointer-events-none aria-disabled:opacity-50"
      >
        Onceki
      </Link>
      <Link
        href={`/admin/audit?${new URLSearchParams(cleanSearchParams({ ...params, page: String(Math.min(pageCount, page + 1)) })).toString()}`}
        aria-disabled={page >= pageCount}
        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 aria-disabled:pointer-events-none aria-disabled:opacity-50"
      >
        Sonraki
      </Link>
    </div>
  );
}

function cleanSearchParams(params: Record<string, string | string[] | undefined>) {
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first) output[key] = first;
  }
  return output;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

function shortId(id: string) {
  return id.length <= 10 ? id : `${id.slice(0, 8)}...`;
}
