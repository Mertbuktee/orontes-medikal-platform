import {
  Activity,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  FileText,
  ImageIcon,
  LayoutDashboard,
  LockKeyhole,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { ServiceRequestStatus } from "@prisma/client";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { adminQuickActionItems } from "@/components/admin/admin-navigation";
import { getServiceRequestStatusMeta } from "@/components/admin/service-request-status";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import {
  AdminDashboardRepository,
  createDashboardRangeWindow,
  getPermissionsForRole,
  parseDashboardRange,
  type DashboardRange,
} from "@/lib/database/repositories/admin-dashboard";
import { SiteSettingsRepository } from "@/lib/database/repositories/site-settings";
import { hasPermission } from "@/lib/rbac/permissions";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{ range?: string | string[] }>;
};

export default async function AdminDashboardPage({
  searchParams,
}: DashboardPageProps) {
  const session = await requirePermission("dashboard.view");
  const selectedRange = parseDashboardRange((await searchParams).range);
  const range = createDashboardRangeWindow(selectedRange);
  const repository = new AdminDashboardRepository(prisma);
  const permissions = getPermissionsForRole(session.role);

  const canViewRequests = hasPermission(session.role, "serviceRequests.view");
  const canViewContentHealth =
    session.role === "SUPER_ADMIN" ||
    session.role === "ADMIN" ||
    session.role === "EDITOR";
  const canViewMedia = hasPermission(session.role, "media.view");
  const canViewSettings = hasPermission(session.role, "settings.view");
  const canViewSecurity = hasPermission(session.role, "audit.view");

  const [
    serviceSummary,
    timeline,
    distribution,
    workload,
    recentRequests,
    assignedWork,
    contentHealth,
    mediaHealth,
    siteReadiness,
    securitySummary,
    recentActivity,
  ] = await Promise.all([
    canViewRequests
      ? repository.getServiceRequestSummary(range)
      : Promise.resolve(null),
    canViewRequests
      ? repository.getServiceRequestTimeline(range)
      : Promise.resolve(null),
    canViewRequests
      ? repository.getServiceRequestStatusDistribution()
      : Promise.resolve(null),
    canViewRequests
      ? repository.getOpenWorkload({ userId: session.userId, role: session.role })
      : Promise.resolve(null),
    canViewRequests ? repository.getRecentServiceRequests(8) : Promise.resolve(null),
    canViewRequests ? repository.getAssignedWork(session.userId) : Promise.resolve(null),
    canViewContentHealth ? repository.getContentHealth() : Promise.resolve(null),
    canViewMedia ? repository.getMediaHealth() : Promise.resolve(null),
    canViewSettings
      ? new SiteSettingsRepository(prisma)
          .getSettings()
          .then((settings) => repository.getSiteReadiness(settings))
      : Promise.resolve(null),
    canViewSecurity ? repository.getSecuritySummary(range) : Promise.resolve(null),
    repository.getRecentActivity({ permissions, limit: 15 }),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Yönetim Paneli"
        description="Servis talepleri, içerik sağlığı, medya durumu ve güvenlik aktivitelerini gerçek verilerle takip edin."
        eyebrow="Operasyon Merkezi"
      />

      <RangeSelector selectedRange={selectedRange} />

      {serviceSummary ? (
        <section
          aria-labelledby="service-summary-title"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <h2 id="service-summary-title" className="sr-only">
            Servis talebi operasyon özetleri
          </h2>
          {serviceSummary.map((item) => (
            <MetricCard
              key={item.key}
              icon={ClipboardList}
              label={item.label}
              value={item.trend.current}
              href={item.href}
              helper={formatTrend(item.trend)}
            />
          ))}
        </section>
      ) : null}

      {canViewRequests && timeline && distribution && workload ? (
        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <Panel
            title="Talep Yoğunluğu"
            description={`${range.label} için ${range.bucket === "day" ? "günlük" : range.bucket === "week" ? "haftalık" : "aylık"} talep sayıları.`}
            icon={BarChart3}
          >
            <TimelineBars items={timeline} />
          </Panel>
          <Panel
            title="Durum Dağılımı"
            description="Arşiv dışındaki taleplerin mevcut durumları."
            icon={Activity}
          >
            <StatusDistribution items={distribution} />
          </Panel>
          <Panel
            title="Açık İş Yükü"
            description="SLA iddiası değildir; dikkat gerektiren operasyon sinyalleridir."
            icon={AlertTriangle}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {workload.map((item) => (
                <CompactStat key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
          </Panel>
          {assignedWork?.length ? (
            <Panel
              title="Bana Atananlar"
              description="Açık ve aktif atamalarınız."
              icon={ClipboardList}
            >
              <div className="space-y-3">
                {assignedWork.map((item) => (
                  <RequestListItem
                    key={item.id}
                    id={item.id}
                    title={item.company || item.fullName}
                    status={item.status}
                    date={item.updatedAt}
                  />
                ))}
              </div>
            </Panel>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        {recentRequests ? (
          <Panel
            title="Son Servis Talepleri"
            description="Telefon, e-posta, mesaj ve dosya adı gösterilmez."
            icon={ClipboardList}
            action={{ href: "/admin/service-requests", label: "Tümünü Gör" }}
          >
            <div className="space-y-3">
              {recentRequests.length ? (
                recentRequests.map((item) => (
                  <RequestListItem
                    key={item.id}
                    id={item.id}
                    title={item.company || `Talep ${shortId(item.id)}`}
                    status={item.status}
                    date={item.createdAt}
                    meta={[
                      item.assignedUser?.name
                        ? `Atanan: ${item.assignedUser.name}`
                        : "Atanmamış",
                      item.attachments.length ? "Dosyalı" : "Dosyasız",
                    ].join(" · ")}
                  />
                ))
              ) : (
                <EmptyState text="Henüz servis talebi bulunmuyor." />
              )}
            </div>
          </Panel>
        ) : null}

        <Panel
          title="Hızlı Aksiyonlar"
          description="Yetkiniz olan güvenli admin rotaları."
          icon={LayoutDashboard}
        >
          <div className="grid gap-3">
            {adminQuickActionItems
              .filter((item) => {
                return hasPermission(session.role, item.requiredPermission);
              })
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="size-4 text-sky-700" aria-hidden="true" />
                      {item.title}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-500 shadow-sm">
                      Aç
                    </span>
                  </Link>
                );
              })}
          </div>
        </Panel>
      </section>

      {contentHealth ? <ContentHealthSection data={contentHealth} /> : null}

      <section className="grid gap-6 xl:grid-cols-3">
        {mediaHealth ? (
          <Panel
            title="Medya Sağlığı"
            description="Genel medya kayıtları; servis talebi ekleri hariçtir."
            icon={ImageIcon}
            action={{ href: "/admin/media", label: "Medya" }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <CompactStat label="Aktif medya" value={mediaHealth.active} />
              <CompactStat label="Arşivli medya" value={mediaHealth.archived} />
              <CompactStat label="Kullanılmayan" value={mediaHealth.unused} />
              <CompactStat label="Alt metin eksik" value={mediaHealth.missingAlt} />
              <CompactStat
                label="Variant depolama"
                value={formatBytes(mediaHealth.totalVariantSize)}
              />
            </div>
          </Panel>
        ) : null}

        {siteReadiness ? (
          <Panel
            title="Site Hazırlık Durumu"
            description="Production garantisi değildir; yapılandırma sinyalleridir."
            icon={Settings}
            action={{ href: "/admin/settings", label: "Ayarlar" }}
          >
            <div className="space-y-2">
              {siteReadiness.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex min-h-10 items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm transition hover:bg-orange-50"
                >
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <span
                    className={
                      item.ok
                        ? "text-emerald-700"
                        : item.severity === "informational"
                          ? "text-sky-700"
                          : item.severity === "development"
                            ? "text-amber-700"
                            : "text-red-700"
                    }
                  >
                    {item.ok ? "Tamam" : item.severity === "development" ? "Development" : "Eksik"}
                  </span>
                </Link>
              ))}
            </div>
          </Panel>
        ) : null}

        {securitySummary ? (
          <Panel
            title="Güvenlik Özeti"
            description="IP, token ve raw user-agent gösterilmez."
            icon={LockKeyhole}
            action={{ href: "/admin/users", label: "Kullanıcılar" }}
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <CompactStat label="Başarılı giriş" value={securitySummary.successfulLogins} />
              <CompactStat label="Başarısız giriş" value={securitySummary.failedLogins} />
              <CompactStat label="Aktif oturum" value={securitySummary.activeSessions} />
              <CompactStat label="Reset talebi" value={securitySummary.passwordResetRequests} />
              <CompactStat label="MFA aktif kullanıcı" value={securitySummary.mfaEnabledUsers} />
              <CompactStat label="Kilitli hesap" value={securitySummary.lockedAccounts} />
              <CompactStat label="Aktif kullanıcı" value={securitySummary.activeUsers} />
              <CompactStat label="Pasif kullanıcı" value={securitySummary.inactiveUsers} />
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Role göre kullanıcı
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {securitySummary.usersByRole.map((item) => (
                  <span key={item.role} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    {item.role}: {item.count}
                  </span>
                ))}
              </div>
            </div>
          </Panel>
        ) : null}
      </section>

      <Panel
        title="Son Yönetim Aktiviteleri"
        description="Raw audit metadata gösterilmez; hassas alanlar özetlenmez."
        icon={ShieldCheck}
      >
        <div className="space-y-3">
          {recentActivity.length ? (
            recentActivity.map((item) => (
              <ActivityItem key={item.id} item={item} />
            ))
          ) : (
            <EmptyState text="Henüz yönetim paneli aktivitesi bulunmuyor." />
          )}
        </div>
      </Panel>
    </div>
  );
}

function RangeSelector({ selectedRange }: { selectedRange: DashboardRange }) {
  const ranges: Array<{ value: DashboardRange; label: string }> = [
    { value: "7d", label: "Son 7 Gün" },
    { value: "30d", label: "Son 30 Gün" },
    { value: "90d", label: "Son 90 Gün" },
    { value: "year", label: "Bu Yıl" },
  ];

  return (
    <nav
      aria-label="Dashboard zaman aralığı"
      className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm"
    >
      {ranges.map((range) => (
        <Link
          key={range.value}
          href={`/admin/dashboard?range=${range.value}`}
          aria-current={selectedRange === range.value ? "page" : undefined}
          className={`inline-flex min-h-10 items-center rounded-2xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
            selectedRange === range.value
              ? "bg-orange-500 text-white"
              : "bg-slate-50 text-slate-700 hover:bg-orange-50 hover:text-orange-700"
          }`}
        >
          {range.label}
        </Link>
      ))}
    </nav>
  );
}

function ContentHealthSection({
  data,
}: {
  data: Awaited<ReturnType<AdminDashboardRepository["getContentHealth"]>>;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <Panel
        title="İçerik Sağlığı"
        description="Yayın hazırlığı için öneri niteliğindeki gerçek sinyaller."
        icon={FileText}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <HealthCard title="Blog" href="/admin/blog" items={[
            ["Taslak", data.blog.draft],
            ["Yayında", data.blog.published],
            ["Planlı", data.blog.scheduled],
            ["SEO eksik", data.blog.missingSeo],
            ["Kapak eksik", data.blog.missingCover],
          ]} />
          <HealthCard title="Cihaz Grupları" href="/admin/devices" items={[
            ["Aktif", data.devices.active],
            ["Pasif", data.devices.inactive],
            ["Ana sayfa", data.devices.featured],
            ["SEO eksik", data.devices.missingSeo],
            ["Görsel yok", data.devices.withoutImage],
          ]} />
          <HealthCard title="Hizmetler" href="/admin/services" items={[
            ["Aktif", data.services.active],
            ["Pasif", data.services.inactive],
            ["Ana sayfa", data.services.featured],
            ["SEO eksik", data.services.missingSeo],
          ]} />
          <HealthCard title="Ana Sayfa / Hero" href="/admin/homepage" items={[
            ["Görünür section", data.homepage.visible],
            ["Gizli section", data.homepage.hidden],
            ["Aktif slayt", data.hero.active],
            ["Autoplay slayt", data.hero.autoplay],
            ["Pasif slayt", data.hero.inactive],
          ]} />
        </div>
      </Panel>
    </section>
  );
}

function Panel({
  title,
  description,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-700">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        {action ? (
          <Link
            href={action.href}
            className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            {action.label}
          </Link>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  helper: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 transition hover:border-orange-200 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
    >
      <div className="flex size-11 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-medium text-slate-500">{label}</h3>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-xs font-semibold text-slate-500">{helper}</p>
    </Link>
  );
}

function TimelineBars({
  items,
}: {
  items: Array<{ key: string; label: string; count: number }>;
}) {
  const max = Math.max(...items.map((item) => item.count), 1);
  return (
    <div>
      <div className="flex h-48 items-end gap-1 overflow-hidden rounded-2xl bg-slate-50 p-3">
        {items.map((item) => (
          <div key={item.key} className="flex min-w-2 flex-1 flex-col items-center justify-end gap-2">
            <div
              className="w-full rounded-t bg-orange-500"
              style={{ height: `${Math.max(4, (item.count / max) * 100)}%` }}
              title={`${item.label}: ${item.count}`}
              aria-label={`${item.label}: ${item.count} talep`}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 max-h-40 overflow-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Dönem</th>
              <th className="px-3 py-2">Talep</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.key} className="border-t border-slate-100">
                <td className="px-3 py-2">{item.label}</td>
                <td className="px-3 py-2 font-semibold">{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusDistribution({
  items,
}: {
  items: Array<{ status: string; count: number }>;
}) {
  const max = Math.max(...items.map((item) => item.count), 1);
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.status}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-slate-700">
              {getServiceRequestStatusMeta(item.status as ServiceRequestStatus).label}
            </span>
            <span className="font-semibold text-slate-950">{item.count}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-sky-600"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CompactStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function RequestListItem({
  id,
  title,
  status,
  date,
  meta,
}: {
  id: string;
  title: string;
  status: string;
  date: Date;
  meta?: string;
}) {
  return (
    <Link
      href={`/admin/service-requests/${id}`}
      className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-orange-200 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-950">{title}</p>
        <span className="text-xs font-semibold text-orange-700">
          {getServiceRequestStatusMeta(status as ServiceRequestStatus).label}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {shortId(id)} · {formatDate(date)}
        {meta ? ` · ${meta}` : ""}
      </p>
    </Link>
  );
}

function HealthCard({
  title,
  href,
  items,
}: {
  title: string;
  href: string;
  items: Array<[string, number]>;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-orange-200 hover:bg-orange-50"
    >
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <dl className="mt-3 grid gap-2 text-sm">
        {items.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <dt className="text-slate-500">{label}</dt>
            <dd className="font-semibold text-slate-950">{value}</dd>
          </div>
        ))}
      </dl>
    </Link>
  );
}

function ActivityItem({
  item,
}: {
  item: {
    id: string;
    label: string;
    actorName: string;
    createdAt: Date;
    href: string | null;
  };
}) {
  const content = (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-950">{item.label}</p>
        <p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p>
      </div>
      <p className="mt-1 text-sm text-slate-500">Aktör: {item.actorName}</p>
    </div>
  );

  return item.href ? (
    <Link href={item.href} className="block transition hover:opacity-90">
      {content}
    </Link>
  ) : (
    content
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
      {text}
    </p>
  );
}

function formatTrend(trend: { previous: number; delta: number; percent: number | null }) {
  if (trend.percent === null) {
    return trend.previous === 0
      ? "Önceki dönemde kayıt yok"
      : `${trend.delta >= 0 ? "+" : ""}${trend.delta} kayıt`;
  }

  return `${trend.delta >= 0 ? "+" : ""}${trend.delta} · ${trend.percent >= 0 ? "+" : ""}${trend.percent}%`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function shortId(id: string) {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
