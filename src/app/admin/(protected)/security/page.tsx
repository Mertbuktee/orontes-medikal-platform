import Link from "next/link";
import type { ReactNode } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  getAuditSeverityLabel,
} from "@/lib/audit/audit-presentation";
import {
  parseSecurityRange,
  securityRangeOptions,
} from "@/lib/audit/audit-validation";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaAuditLogRepository } from "@/lib/database/repositories/audit-logs";
import { hasPermission } from "@/lib/rbac/permissions";

export const dynamic = "force-dynamic";

type SecurityPageProps = {
  searchParams: Promise<{ range?: string | string[] }>;
};

export default async function AdminSecurityPage({
  searchParams,
}: SecurityPageProps) {
  const session = await requirePermission("security.view");
  const range = parseSecurityRange((await searchParams).range);
  const repository = new PrismaAuditLogRepository(prisma);
  const summary = await repository.getSecurityCenterSummary(range);
  const canViewSessions = hasPermission(session.role, "security.sessions.view");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Guvenlik Merkezi"
        description="Kimlik dogrulama, oturum, hesap guvenligi ve kritik audit sinyallerini tek ekrandan izleyin."
        eyebrow="Security Center"
      />

      <form className="flex flex-wrap items-center gap-2" action="/admin/security">
        {securityRangeOptions.map((option) => (
          <button
            key={option}
            name="range"
            value={option}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              option === range
                ? "bg-slate-950 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:border-orange-200"
            }`}
          >
            {optionLabel(option)}
          </button>
        ))}
      </form>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Basarili giris" value={summary.authentication.successfulLogins} />
        <Metric label="Basarisiz giris" value={summary.authentication.failedLogins} tone={summary.authentication.failedLogins ? "warning" : "default"} />
        <Metric label="Kilitlenen hesap" value={summary.authentication.accountLocks} tone={summary.authentication.accountLocks ? "warning" : "default"} />
        <Metric label="Aktif oturum" value={summary.sessions.active} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Hesap Guvenligi" href="/admin/users">
          <div className="grid gap-3 sm:grid-cols-2">
            <SmallStat label="Toplam kullanici" value={summary.accounts.total} />
            <SmallStat label="Aktif" value={summary.accounts.active} />
            <SmallStat label="Pasif" value={summary.accounts.inactive} />
            <SmallStat label="Kilitli" value={summary.accounts.locked} />
            <SmallStat label="MFA aktif" value={summary.accounts.mfaEnabled} />
            <SmallStat label="MFA eksik" value={summary.accounts.mfaDisabled} />
          </div>
          <div className="mt-4 space-y-2">
            {summary.accounts.byRole.map((item) => (
              <div key={item.role} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                <span className="font-semibold text-slate-700">{item.role}</span>
                <span className="text-slate-600">{item.count}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Konfigurasyon Hazirligi" href="/admin/settings">
          <div className="space-y-3">
            {summary.configuration.map((item) => (
              <div key={item.key} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-950">{item.label}</p>
                  <StatusPill status={item.status} />
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {canViewSessions ? (
          <Panel title="Oturum Sagligi" href="/admin/users">
            <div className="grid gap-3 sm:grid-cols-3">
              <SmallStat label="Aktif" value={summary.sessions.active} />
              <SmallStat label="Remember me" value={summary.sessions.remembered} />
              <SmallStat label="Suresi gecmis" value={summary.sessions.expiredUncleaned} />
            </div>
            <div className="mt-4 divide-y divide-slate-100">
              {summary.sessions.recent.map((item) => (
                <div key={item.id} className="py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-950">{item.userName}</span>
                    <span className="text-xs text-slate-500">{item.userRole}</span>
                  </div>
                  <p className="mt-1 text-slate-600">
                    {item.userAgentLabel} - {item.ipAddressLabel} - son gorulme {formatDate(item.lastSeenAt ?? item.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        ) : null}

        <Panel title="Oneriler">
          <div className="space-y-3">
            {summary.recommendations.map((item) => (
              <div key={item.key} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  </div>
                  <StatusPill status={item.severity === "warning" ? "warning" : "info"} />
                </div>
                {item.href ? (
                  <Link href={item.href} className="mt-3 inline-flex text-sm font-semibold text-sky-700 hover:text-orange-700">
                    Incele
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <Panel title="Son Guvenlik Olaylari" href="/admin/audit">
        {summary.recentSecurityEvents.length ? (
          <div className="divide-y divide-slate-100">
            {summary.recentSecurityEvents.map((item) => (
              <Link
                key={item.id}
                href={`/admin/audit/${item.id}`}
                className="block py-3 text-sm transition hover:bg-slate-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-950">{item.presentation.label}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {getAuditSeverityLabel(item.presentation.severity)}
                  </span>
                </div>
                <p className="mt-1 text-slate-600">{item.presentation.summary}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">Secili aralikta guvenlik olayi bulunmuyor.</p>
        )}
      </Panel>
    </div>
  );
}

function Panel({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        {href ? (
          <Link href={href} className="text-sm font-semibold text-sky-700 hover:text-orange-700">
            Ac
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warning";
}) {
  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${tone === "warning" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: "ok" | "warning" | "info" }) {
  const label = status === "ok" ? "Tamam" : status === "warning" ? "Uyari" : "Bilgi";
  const className =
    status === "ok"
      ? "bg-emerald-50 text-emerald-700"
      : status === "warning"
        ? "bg-amber-50 text-amber-700"
        : "bg-sky-50 text-sky-700";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function optionLabel(option: string) {
  const labels: Record<string, string> = {
    "24h": "Son 24 Saat",
    "7d": "Son 7 Gun",
    "30d": "Son 30 Gun",
    "90d": "Son 90 Gun",
  };
  return labels[option] ?? option;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(date);
}
