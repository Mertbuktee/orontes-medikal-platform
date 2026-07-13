import {
  ClipboardList,
  Database,
  FileText,
  ImageIcon,
  Settings,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  adminQuickActionItems,
  type AdminNavItem,
} from "@/components/admin/admin-navigation";
import { getServiceRequestStatusMeta } from "@/components/admin/service-request-status";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaDeviceGroupRepository } from "@/lib/database/repositories/device-groups";
import { PrismaHeroSlideRepository } from "@/lib/database/repositories/hero-slides";
import { PrismaMediaRepository } from "@/lib/database/repositories/media";
import { PrismaServiceRepository } from "@/lib/database/repositories/services";
import { PrismaServiceRequestRepository } from "@/lib/database/repositories/service-requests";
import { hasPermission } from "@/lib/rbac/permissions";

type ServiceRequestSummary = Awaited<
  ReturnType<PrismaServiceRequestRepository["getDashboardSummary"]>
>;
type ServiceRequestStatusCount = ServiceRequestSummary["statusCounts"][number];
type ServiceRequestLatestItem = ServiceRequestSummary["latest"][number];
type MediaSummary = Awaited<
  ReturnType<PrismaMediaRepository["getDashboardSummary"]>
>;
type MediaLatestItem = MediaSummary["latest"][number];
type DeviceSummary = Awaited<
  ReturnType<PrismaDeviceGroupRepository["getDashboardSummary"]>
>;
type ServiceSummary = Awaited<
  ReturnType<PrismaServiceRepository["getDashboardSummary"]>
>;

const readinessCards = [
  {
    title: "İçerik Yönetimi",
    description:
      "Cihaz, hizmet, blog ve sayfa içerikleri typed model ile ayrıştırıldı.",
    state: "CRUD sonraki aşamada",
    icon: FileText,
  },
  {
    title: "Medya Kütüphanesi",
    description:
      "Görsel varyant, güvenli upload ve public delivery altyapısı devrede.",
    state: "Aktif modül",
    icon: ImageIcon,
  },
  {
    title: "Sistem Ayarları",
    description:
      "SEO, site ayarları, roller ve güvenlik sözleşmeleri için temel hazırlandı.",
    state: "Altyapı hazır",
    icon: Settings,
  },
];

export default async function AdminDashboardPage() {
  const session = await requirePermission("dashboard.view");
  const canViewRequests = hasPermission(session.role, "serviceRequests.view");
  const canViewMedia = hasPermission(session.role, "media.view");
  const canViewHero = hasPermission(session.role, "heroSlides.view");
  const canViewDevices = hasPermission(session.role, "devices.view");
  const canViewServices = hasPermission(session.role, "services.view");
  const [
    serviceRequestSummary,
    mediaSummary,
    heroSummary,
    deviceSummary,
    serviceSummary,
  ] =
    await Promise.all([
    canViewRequests
      ? new PrismaServiceRequestRepository(prisma).getDashboardSummary()
      : Promise.resolve(null),
    canViewMedia
      ? new PrismaMediaRepository(prisma).getDashboardSummary()
      : Promise.resolve(null),
    canViewHero
      ? new PrismaHeroSlideRepository(prisma).getDashboardSummary()
      : Promise.resolve(null),
    canViewDevices
      ? new PrismaDeviceGroupRepository(prisma).getDashboardSummary()
      : Promise.resolve(null),
    canViewServices
      ? new PrismaServiceRepository(prisma).getDashboardSummary()
      : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Yönetim Paneli"
        description="Site içeriği, servis talepleri ve sistem ayarlarını merkezi olarak yönetin."
        eyebrow="Dashboard"
      />

      {serviceRequestSummary ? (
        <section
          aria-labelledby="service-request-summary-title"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <h2 id="service-request-summary-title" className="sr-only">
            Servis talebi özetleri
          </h2>
          {(["NEW", "REVIEWING", "IN_REPAIR", "COMPLETED"] as const).map(
            (status) => (
              <SummaryCard
                key={status}
                icon={ClipboardList}
                label={getServiceRequestStatusMeta(status).label}
                value={
                  serviceRequestSummary.statusCounts.find(
                    (item: ServiceRequestStatusCount) =>
                      item.status === status
                  )?._count.status ?? 0
                }
              />
            )
          )}
        </section>
      ) : null}

      <section
        aria-labelledby="admin-readiness-title"
        className="grid gap-4 md:grid-cols-3"
      >
        <h2 id="admin-readiness-title" className="sr-only">
          Yönetim paneli hazırlık durumları
        </h2>
        {readinessCards.map(({ icon: Icon, ...card }) => (
          <article
            key={card.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60"
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-950">
              {card.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {card.description}
            </p>
            <p className="mt-4 inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
              {card.state}
            </p>
          </article>
        ))}
      </section>

      {mediaSummary || heroSummary || deviceSummary || serviceSummary ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {mediaSummary ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Son Yüklenen Medyalar
                  </h2>
                  <p className="text-sm text-slate-500">
                    Aktif medya: {mediaSummary.totalActive}
                  </p>
                </div>
                <Link
                  href="/admin/media"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-orange-50"
                >
                  Aç
                </Link>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {mediaSummary.latest.length ? (
                  mediaSummary.latest
                    .slice(0, 4)
                    .map((item: MediaLatestItem) => (
                      <Link
                        key={item.id}
                        href={`/admin/media/${item.id}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-800 transition hover:border-orange-200 hover:bg-orange-50"
                      >
                        <span className="line-clamp-1">{item.title}</span>
                        <span className="mt-1 block text-xs text-slate-500">
                          {item.mimeType}
                        </span>
                      </Link>
                    ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 md:col-span-2">
                    Henüz medya dosyası yok.
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {heroSummary ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Hero Slider
                  </h2>
                  <p className="text-sm text-slate-500">
                    Autoplay:{" "}
                    {heroSummary.settings.autoplayEnabled ? "Aktif" : "Pasif"}
                  </p>
                </div>
                <Link
                  href="/admin/hero-slides"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-orange-50"
                >
                  Yönet
                </Link>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <SummaryCard
                  icon={ImageIcon}
                  label="Aktif Slayt"
                  value={heroSummary.activeCount}
                />
                <SummaryCard
                  icon={ImageIcon}
                  label="Pasif Slayt"
                  value={heroSummary.inactiveCount}
                />
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Son güncelleme: {heroSummary.latest?.title ?? "Henüz kayıt yok"}
              </p>
            </div>
          ) : null}

          {deviceSummary ? (
            <DeviceSummaryPanel summary={deviceSummary} />
          ) : null}

          {serviceSummary ? (
            <ServiceSummaryPanel summary={serviceSummary} />
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section
          aria-labelledby="recent-activity-title"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Database className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="recent-activity-title"
                className="text-lg font-semibold text-slate-950"
              >
                Son Servis Talepleri
              </h2>
              <p className="text-sm text-slate-500">
                Web formundan gelen son başvurular.
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {serviceRequestSummary?.latest.length ? (
              serviceRequestSummary.latest.map(
                (request: ServiceRequestLatestItem) => (
                  <Link
                    key={request.id}
                    href={`/admin/service-requests/${request.id}`}
                    className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-orange-200 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-950">
                        {request.fullName}
                      </p>
                      <span className="text-xs font-semibold text-orange-700">
                        {getServiceRequestStatusMeta(request.status).label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {request.company || "Firma bilgisi yok"}
                    </p>
                  </Link>
                )
              )
            ) : (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                Henüz gösterilecek servis talebi bulunmuyor.
              </p>
            )}
          </div>
        </section>

        <section
          aria-labelledby="quick-actions-title"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
        >
          <h2
            id="quick-actions-title"
            className="text-lg font-semibold text-slate-950"
          >
            Hızlı Aksiyonlar
          </h2>
          <div className="mt-5 grid gap-3">
            {adminQuickActionItems.map((item: AdminNavItem) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin/service-requests" ||
                item.href === "/admin/media" ||
                item.href === "/admin/hero-slides" ||
                item.href === "/admin/devices" ||
                item.href === "/admin/services";

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
                    {isActive ? "Aç" : "Yakında"}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function ServiceSummaryPanel({ summary }: { summary: ServiceSummary }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Hizmetler</h2>
          <p className="text-sm text-slate-500">
            Son güncelleme: {summary.latest?.title ?? "Henüz kayıt yok"}
          </p>
        </div>
        <Link
          href="/admin/services"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-orange-50"
        >
          Yönet
        </Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <SummaryCard icon={ClipboardList} label="Aktif" value={summary.activeCount} />
        <SummaryCard
          icon={ClipboardList}
          label="Ana Sayfa"
          value={summary.featuredCount}
        />
        <SummaryCard icon={ClipboardList} label="Pasif" value={summary.inactiveCount} />
      </div>
    </div>
  );
}

function DeviceSummaryPanel({ summary }: { summary: DeviceSummary }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Cihaz Grupları
          </h2>
          <p className="text-sm text-slate-500">
            Son güncelleme: {summary.latest?.title ?? "Henüz kayıt yok"}
          </p>
        </div>
        <Link
          href="/admin/devices"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-orange-50"
        >
          Yönet
        </Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={ClipboardList}
          label="Aktif"
          value={summary.activeCount}
        />
        <SummaryCard
          icon={ClipboardList}
          label="Ana Sayfa"
          value={summary.featuredCount}
        />
        <SummaryCard
          icon={ClipboardList}
          label="Pasif"
          value={summary.inactiveCount}
        />
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <div className="flex size-11 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-medium text-slate-500">{label}</h3>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
    </article>
  );
}
