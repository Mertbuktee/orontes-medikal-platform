import type { ServiceRequestStatus } from "@prisma/client";
import { ArrowUpRight, Building2, CalendarClock, MapPin, MonitorCog } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  getServiceRequestStatusClassName,
  getServiceRequestStatusMeta,
} from "@/components/admin/service-request-status";
import { getDeviceStatusMeta } from "@/components/technical/customer-device-status";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaCustomerDeviceRepository } from "@/lib/database/repositories/customer-devices";
import { hasPermission } from "@/lib/rbac/permissions";

type DeviceDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function DeviceDetailPage({ params }: DeviceDetailPageProps) {
  const session = await requirePermission("technicalDevices.view");
  const canUpdate = hasPermission(session.role, "technicalDevices.update");
  const { id } = await params;
  const repository = new PrismaCustomerDeviceRepository(prisma);
  const device = await repository.findDeviceById(id);

  if (!device) notFound();

  const duplicateWarnings = await repository.findDuplicateWarnings({
    manufacturerId: device.manufacturerId,
    serialNumber: device.serialNumber,
    assetTag: device.assetTag,
    hospitalInventoryNumber: device.hospitalInventoryNumber,
    excludeId: device.id,
  });
  const status = getDeviceStatusMeta(device.status);
  const completedRequests = device.serviceRequests.filter(
    (request) => request.status === "COMPLETED"
  );

  return (
    <div className="space-y-6">
      <Link
        href="/technical/devices"
        className="inline-flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50"
      >
        Cihazlara dön
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <AdminPageHeader
          eyebrow={device.publicCode}
          title={getDeviceLabel(device)}
          description={`${device.customerCompany.displayName} / ${device.customerLocation.name} cihaz kartı.`}
        />
        {canUpdate ? (
          <Link
            href={`/technical/devices/${device.id}/edit`}
            className="inline-flex min-h-11 items-center rounded-2xl bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Düzenle
          </Link>
        ) : null}
      </div>

      <nav className="flex gap-2 overflow-x-auto rounded-3xl border border-slate-200 bg-white p-2 shadow-sm shadow-slate-200/60">
        {["Genel", "Servis Geçmişi", "Servis Talepleri", "Ekler", "Notlar"].map((item) => (
          <a
            key={item}
            href={`#${slugify(item)}`}
            className="inline-flex min-h-10 shrink-0 items-center rounded-2xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-cyan-50 hover:text-cyan-800"
          >
            {item}
          </a>
        ))}
      </nav>

      <section id="genel" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-950">Genel</h2>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${status.className}`}>
            {status.label}
          </span>
        </div>
        <dl className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Info icon={MonitorCog} label="Seri No" value={device.serialNumber} />
          <Info icon={Building2} label="Müşteri" value={device.customerCompany.displayName} />
          <Info icon={MapPin} label="Lokasyon" value={device.customerLocation.name} />
          <Info icon={CalendarClock} label="Son Servis" value={formatDate(device.lastServiceAt)} />
        </dl>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          <p><strong>Kritiklik:</strong> {formatCriticality(device.criticality)}</p>
          <p><strong>Envanter:</strong> {device.hospitalInventoryNumber || "Yok"}</p>
          <p><strong>Demirbaş:</strong> {device.assetTag || "Yok"}</p>
          <p><strong>Departman/Oda:</strong> {[device.department, device.room].filter(Boolean).join(" / ") || "Yok"}</p>
          {device.notes ? <p className="mt-2 whitespace-pre-wrap">{device.notes}</p> : null}
        </div>
      </section>

      {duplicateWarnings.length ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm shadow-amber-100/70">
          <h2 className="text-lg font-semibold text-amber-950">
            Olası Mükerrer Cihaz
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            Seri no, demirbaş veya envanter alanlarından biri başka cihaz kaydıyla eşleşiyor. Kayıtlar otomatik birleştirilmez.
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {duplicateWarnings.map((warning) => (
              <Link
                key={warning.id}
                href={`/technical/devices/${warning.id}`}
                className="rounded-2xl border border-amber-200 bg-white/70 p-4 text-sm transition hover:bg-white"
              >
                <p className="font-semibold text-amber-950">
                  {warning.publicCode} · {getDeviceLabel(warning)}
                </p>
                <p className="mt-1 text-amber-900">
                  Seri No: {warning.serialNumber}
                </p>
                <p className="mt-1 text-amber-900">
                  Envanter: {warning.hospitalInventoryNumber || "Yok"} · Demirbaş: {warning.assetTag || "Yok"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <RequestList
        id="servis-gecmisi"
        title="Servis Geçmişi"
        requests={completedRequests}
      />
      <RequestList
        id="servis-talepleri"
        title="Servis Talepleri"
        requests={device.serviceRequests}
      />

      <section id="ekler" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <h2 className="text-lg font-semibold text-slate-950">Ekler</h2>
        <p className="mt-2 text-sm text-slate-500">
          Cihaz bağımsız ekleri TASK-045 servis operasyon genişletmesiyle netleştirilecek; şimdilik servis talebi ekleri kullanılır.
        </p>
      </section>

      <section id="notlar" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <h2 className="text-lg font-semibold text-slate-950">Notlar</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {device.notes || "Cihaz notu yok."}
        </p>
      </section>
    </div>
  );
}

function RequestList({
  id,
  title,
  requests,
}: {
  id: string;
  title: string;
  requests: Array<{
    id: string;
    status: ServiceRequestStatus;
    company: string;
    fullName: string;
    message: string;
    updatedAt: Date;
  }>;
}) {
  return (
    <section id={id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{requests.length} kayıt gösteriliyor.</p>
      </div>
      <div className="divide-y divide-slate-100">
        {requests.length ? (
          requests.map((request) => {
            const status = getServiceRequestStatusMeta(request.status);
            return (
              <article key={request.id} className="grid gap-4 px-5 py-5 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">#{request.id.slice(-6).toUpperCase()}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getServiceRequestStatusClassName(request.status)}`}>{status.label}</span>
                  </div>
                  <p className="mt-2 font-semibold text-slate-950">{request.company || request.fullName}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{request.message}</p>
                </div>
                <Link href={`/technical/service-requests/${request.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50">
                  Talep Detayı <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </article>
            );
          })
        ) : (
          <p className="px-5 py-8 text-sm text-slate-500">Kayıt yok.</p>
        )}
      </div>
    </section>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MonitorCog;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        <Icon className="size-4" aria-hidden="true" /> {label}
      </dt>
      <dd className="mt-2 break-words text-sm font-semibold text-slate-950">{value}</dd>
    </div>
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

function formatDate(date: Date | null) {
  if (!date) return "Yok";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCriticality(value: string) {
  const labels: Record<string, string> = {
    LOW: "Düşük",
    MEDIUM: "Orta",
    HIGH: "Yüksek",
    CRITICAL: "Kritik",
  };
  return labels[value] ?? value;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace("ı", "i")
    .replace("ğ", "g")
    .replace("ü", "u")
    .replace("ş", "s")
    .replace("ö", "o")
    .replace("ç", "c")
    .replace(/\s+/g, "-");
}
