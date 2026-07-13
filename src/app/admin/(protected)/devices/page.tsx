import {
  Archive,
  ArrowDown,
  ArrowUp,
  ChevronsDown,
  ChevronsUp,
  Eye,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { createElement, type ReactNode } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  archiveDeviceGroup,
  moveDeviceGroup,
  restoreDeviceGroup,
  toggleDeviceActive,
  toggleDeviceFeatured,
} from "@/app/admin/(protected)/devices/actions";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaDeviceGroupRepository } from "@/lib/database/repositories/device-groups";
import {
  deviceCapabilityLabels,
  getDeviceIcon,
} from "@/lib/devices/device-registry";
import { deviceListQuerySchema } from "@/lib/devices/device-validation";
import { hasPermission } from "@/lib/rbac/permissions";

type AdminDevicesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminDevicesPage({
  searchParams,
}: AdminDevicesPageProps) {
  const session = await requirePermission("devices.view");
  const params = await searchParams;
  const filters = parseFilters(params);
  const repository = new PrismaDeviceGroupRepository(prisma);
  const result = await repository.listAdminDeviceGroups(filters);
  const canCreate = hasPermission(session.role, "devices.create");
  const canUpdate = hasPermission(session.role, "devices.update");
  const canPublish = hasPermission(session.role, "devices.publish");
  const canReorder = hasPermission(session.role, "devices.reorder");
  const canArchive = hasPermission(session.role, "devices.delete");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="İçerik Yönetimi"
        title="Cihaz Grupları"
        description="Web sitesinde gösterilen medikal cihaz gruplarını yönetin."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {result.total} kayıt, sayfa {result.page}
        </p>
        {canCreate ? (
          <Link
            href="/admin/devices/new"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
          >
            <Plus className="size-4" aria-hidden="true" />
            Yeni Cihaz Grubu Ekle
          </Link>
        ) : null}
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
        <form
          action="/admin/devices"
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_repeat(6,minmax(0,1fr))_auto]"
        >
          <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 md:col-span-2 xl:col-span-1">
            <Search className="size-4 text-slate-400" aria-hidden="true" />
            <input
              name="query"
              defaultValue={filters.query}
              maxLength={120}
              placeholder="Başlık, slug veya açıklama ara"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
          <SelectFilter name="active" value={filters.active}>
            <option value="all">Aktiflik fark etmez</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
          </SelectFilter>
          <SelectFilter name="featured" value={filters.featured}>
            <option value="all">Öne çıkma fark etmez</option>
            <option value="featured">Öne çıkan</option>
            <option value="not-featured">Öne çıkmayan</option>
          </SelectFilter>
          <SelectFilter name="capability" value={filters.capability ?? ""}>
            <option value="">Tüm yetenekler</option>
            {deviceCapabilityLabels.map((capability) => (
              <option key={capability} value={capability}>
                {capability}
              </option>
            ))}
          </SelectFilter>
          <SelectFilter name="archived" value={filters.archived}>
            <option value="active">Aktif kayıtlar</option>
            <option value="archived">Arşiv</option>
            <option value="all">Tümü</option>
          </SelectFilter>
          <SelectFilter name="sort" value={filters.sort}>
            <option value="order">Sıralama</option>
            <option value="newest">Yeni güncellenen</option>
            <option value="oldest">Eski güncellenen</option>
          </SelectFilter>
          <SelectFilter name="pageSize" value={String(filters.pageSize)}>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </SelectFilter>
          <input type="hidden" name="page" value="1" />
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
          >
            Filtrele
          </button>
        </form>
      </section>

      <section className="grid gap-4">
        {result.items.length ? (
          result.items.map((device, index) => {
            return (
              <article
                key={device.id}
                className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 lg:grid-cols-[64px_1fr_auto]"
              >
                <div className="flex size-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                  {createElement(getDeviceIcon(device.iconKey), {
                    className: "size-6",
                    "aria-hidden": true,
                  })}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-orange-700">
                      #{device.order}
                    </span>
                    <StateBadge active={device.isActive}>
                      {device.isActive ? "Aktif" : "Pasif"}
                    </StateBadge>
                    <StateBadge active={device.isFeatured}>
                      {device.isFeatured ? "Ana sayfada" : "Öne çıkmıyor"}
                    </StateBadge>
                    {device.archivedAt ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">
                        Arşiv
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-slate-950">
                    {device.title}
                  </h2>
                  <p className="mt-1 text-sm text-sky-700">/{device.slug}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                    {device.shortDescription}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {device.capabilities.map((capability) => (
                      <span
                        key={capability}
                        className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    Güncelleyen: {device.updatedBy?.name ?? "-"} ·{" "}
                    {device.updatedAt.toLocaleDateString("tr-TR")}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:max-w-[270px] lg:justify-end">
                  <IconLink
                    href={`/admin/devices/${device.id}`}
                    label="Önizle"
                    icon={Eye}
                  />
                  {canUpdate ? (
                    <IconLink
                      href={`/admin/devices/${device.id}/edit`}
                      label="Düzenle"
                      icon={Pencil}
                    />
                  ) : null}
                  {canReorder ? (
                    <>
                      <MoveButton
                        id={device.id}
                        direction="first"
                        label="İlk sıraya taşı"
                        icon={ChevronsUp}
                        disabled={index === 0}
                      />
                      <MoveButton
                        id={device.id}
                        direction="up"
                        label="Yukarı taşı"
                        icon={ArrowUp}
                        disabled={index === 0}
                      />
                      <MoveButton
                        id={device.id}
                        direction="down"
                        label="Aşağı taşı"
                        icon={ArrowDown}
                        disabled={index === result.items.length - 1}
                      />
                      <MoveButton
                        id={device.id}
                        direction="last"
                        label="Son sıraya taşı"
                        icon={ChevronsDown}
                        disabled={index === result.items.length - 1}
                      />
                    </>
                  ) : null}
                  {canPublish && !device.archivedAt ? (
                    <>
                      <ToggleButton
                        action={toggleDeviceActive}
                        id={device.id}
                        name="isActive"
                        value={String(!device.isActive)}
                      >
                        {device.isActive ? "Pasifleştir" : "Aktifleştir"}
                      </ToggleButton>
                      <ToggleButton
                        action={toggleDeviceFeatured}
                        id={device.id}
                        name="isFeatured"
                        value={String(!device.isFeatured)}
                      >
                        {device.isFeatured ? "Öne çıkarma" : "Öne çıkar"}
                      </ToggleButton>
                    </>
                  ) : null}
                  {canArchive ? (
                    device.archivedAt ? (
                      <ToggleButton
                        action={restoreDeviceGroup}
                        id={device.id}
                        icon={RotateCcw}
                      >
                        Geri al
                      </ToggleButton>
                    ) : (
                      <ToggleButton
                        action={archiveDeviceGroup}
                        id={device.id}
                        icon={Archive}
                      >
                        Arşivle
                      </ToggleButton>
                    )
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-lg font-semibold text-slate-950">
              Henüz cihaz grubu bulunmuyor.
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              İlk cihaz grubunu ekleyerek public cihaz sayfasını besleyin.
            </p>
          </div>
        )}
      </section>

      <div className="flex justify-end gap-2">
        <PageLink
          disabled={result.page <= 1}
          href={buildListHref({ ...filters, page: result.page - 1 })}
        >
          Önceki
        </PageLink>
        <PageLink
          disabled={result.total <= result.page * result.pageSize}
          href={buildListHref({ ...filters, page: result.page + 1 })}
        >
          Sonraki
        </PageLink>
      </div>
    </div>
  );
}

function SelectFilter({
  name,
  value,
  children,
}: {
  name: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <select
      name={name}
      defaultValue={value}
      className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
    >
      {children}
    </select>
  );
}

function StateBadge({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {children}
    </span>
  );
}

function IconLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition hover:bg-orange-50"
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

function MoveButton({
  id,
  direction,
  label,
  icon: Icon,
  disabled,
}: {
  id: string;
  direction: "up" | "down" | "first" | "last";
  label: string;
  icon: LucideIcon;
  disabled: boolean;
}) {
  return (
    <form action={moveDeviceGroup}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={disabled}
        aria-label={label}
        className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-orange-50 disabled:opacity-40"
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}

function ToggleButton({
  action,
  id,
  name,
  value,
  icon: Icon,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  name?: string;
  value?: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      {name && value ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="submit"
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition hover:bg-orange-50"
      >
        {Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
        {children}
      </button>
    </form>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-disabled={disabled}
      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 aria-disabled:pointer-events-none aria-disabled:opacity-40"
    >
      {children}
    </Link>
  );
}

type DeviceFilters = ReturnType<typeof deviceListQuerySchema.parse>;

function parseFilters(
  params: Record<string, string | string[] | undefined>
): DeviceFilters {
  return deviceListQuerySchema.parse({
    query: getParam(params.query),
    page: getParam(params.page),
    pageSize: getParam(params.pageSize),
    active: getParam(params.active),
    featured: getParam(params.featured),
    archived: getParam(params.archived),
    capability: getParam(params.capability),
    sort: getParam(params.sort),
  });
}

function buildListHref(filters: DeviceFilters) {
  const params = new URLSearchParams();
  if (filters.query) params.set("query", filters.query);
  if (filters.active !== "all") params.set("active", filters.active);
  if (filters.featured !== "all") params.set("featured", filters.featured);
  if (filters.capability) params.set("capability", filters.capability);
  if (filters.archived !== "active") params.set("archived", filters.archived);
  if (filters.sort !== "order") params.set("sort", filters.sort);
  if (filters.pageSize !== 20) params.set("pageSize", String(filters.pageSize));
  if (filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `/admin/devices?${query}` : "/admin/devices";
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
