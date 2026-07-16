import type { CustomerDeviceStatus } from "@prisma/client";
import type { ReactNode } from "react";
import { ArrowUpRight, Building2, MapPin, MonitorCog, Search } from "lucide-react";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  deviceStatusOptions,
  getDeviceStatusMeta,
} from "@/components/technical/customer-device-status";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaCustomerDeviceRepository } from "@/lib/database/repositories/customer-devices";
import { hasPermission } from "@/lib/rbac/permissions";

type TechnicalDevicesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export default async function TechnicalDevicesPage({
  searchParams,
}: TechnicalDevicesPageProps) {
  const session = await requirePermission("technicalDevices.view");
  const canCreate = hasPermission(session.role, "technicalDevices.create");
  const params = await searchParams;
  const filters = {
    query: getParam(params.q)?.slice(0, 120),
    status: parseStatus(getParam(params.status)),
    includeArchived: getParam(params.archived) === "all",
  };
  const devices = await new PrismaCustomerDeviceRepository(prisma).listDevices(
    filters
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <AdminPageHeader
          eyebrow="Teknik Operasyon"
          title="Cihazlar"
          description="Gerçek fiziksel müşteri cihazlarını, seri numarası ve lokasyon bilgisiyle yönetin."
        />
        {canCreate ? (
          <Link
            href="/technical/devices/new"
            className="inline-flex min-h-11 items-center rounded-2xl bg-cyan-500 px-4 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
          >
            Yeni Cihaz
          </Link>
        ) : null}
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
        <form
          action="/technical/devices"
          className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]"
        >
          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
            <Search className="size-4 text-slate-400" aria-hidden="true" />
            <span className="sr-only">Cihaz ara</span>
            <input
              name="q"
              defaultValue={filters.query}
              placeholder="Kod, seri, envanter, üretici, model, müşteri"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </label>
          <Select name="status" label="Durum" value={filters.status ?? ""}>
            <option value="">Tüm durumlar</option>
            {deviceStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            name="archived"
            label="Arşiv"
            value={filters.includeArchived ? "all" : "active"}
          >
            <option value="active">Aktif kayıtlar</option>
            <option value="all">Arşiv dahil</option>
          </Select>
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Filtrele
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Cihaz Kayıtları</h2>
          <p className="mt-1 text-sm text-slate-500">{devices.length} kayıt gösteriliyor.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {devices.length ? (
            devices.map((device) => {
              const label = getDeviceLabel(device);
              const status = getDeviceStatusMeta(device.status);

              return (
                <article
                  key={device.id}
                  className="grid gap-4 px-5 py-5 transition hover:bg-slate-50 xl:grid-cols-[1fr_240px_180px_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                        {device.publicCode}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-2 flex items-center gap-2 font-semibold text-slate-950">
                      <MonitorCog className="size-4 text-cyan-600" aria-hidden="true" />
                      {label}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Seri No: {device.serialNumber}
                    </p>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p className="flex items-center gap-2 font-semibold text-slate-900">
                      <Building2 className="size-4 text-cyan-600" aria-hidden="true" />
                      {device.customerCompany.displayName}
                    </p>
                    <p className="mt-2 flex items-center gap-2">
                      <MapPin className="size-4 text-cyan-600" aria-hidden="true" />
                      {device.customerLocation.name}
                    </p>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>Envanter: {device.hospitalInventoryNumber || "Yok"}</p>
                    <p className="mt-2">Demirbaş: {device.assetTag || "Yok"}</p>
                  </div>
                  <div className="flex items-center xl:justify-end">
                    <Link
                      href={`/technical/devices/${device.id}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    >
                      Detay
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="px-5 py-10 text-sm text-slate-500">Cihaz kaydı bulunmuyor.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Select({
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
        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
      >
        {children}
      </select>
    </label>
  );
}

function getDeviceLabel(device: {
  manufacturer: { name: string } | null;
  deviceModel: { name: string } | null;
  customManufacturer: string | null;
  customModel: string | null;
}) {
  return (
    [
      device.manufacturer?.name ?? device.customManufacturer,
      device.deviceModel?.name ?? device.customModel,
    ]
      .filter(Boolean)
      .join(" ") || "Cihaz bilgisi yok"
  );
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseStatus(value: string | undefined): CustomerDeviceStatus | undefined {
  return deviceStatusOptions.some((option) => option.value === value)
    ? (value as CustomerDeviceStatus)
    : undefined;
}
