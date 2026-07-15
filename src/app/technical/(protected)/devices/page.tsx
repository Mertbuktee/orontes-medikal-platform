import { MonitorCog } from "lucide-react";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaServiceRequestRepository } from "@/lib/database/repositories/service-requests";

export const dynamic = "force-dynamic";

export default async function TechnicalDevicesPage() {
  await requirePermission("serviceRequests.view");

  const repository = new PrismaServiceRequestRepository(prisma);
  const devices = await repository.listTechnicalDevices();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Teknik Operasyon"
        title="Cihazlar"
        description="Servis taleplerinde bildirilen müşteri cihazlarını inceleyin."
      />

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Cihaz Kayıtları</h2>
          <p className="mt-1 text-sm text-slate-500">{devices.length} kayıt gösteriliyor.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {devices.length ? (
            devices.map((device) => {
              const label = [device.deviceBrand, device.deviceModel].filter(Boolean).join(" ") || "Cihaz bilgisi yok";
              const query = device.deviceSerialNumber || device.deviceModel || device.deviceBrand || "";
              return (
                <article key={`${device.deviceBrand}-${device.deviceModel}-${device.deviceSerialNumber}-${device.company}`} className="grid gap-4 px-5 py-5 md:grid-cols-[1fr_190px_180px]">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-semibold text-slate-950">
                      <MonitorCog className="size-4 text-cyan-600" aria-hidden="true" />
                      {label}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{device.company || "Firma bilgisi yok"}</p>
                    <p className="mt-2 text-sm text-slate-500">Seri No: {device.deviceSerialNumber || "Belirtilmedi"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Talep Sayısı</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">{device._count.id}</p>
                  </div>
                  <div className="md:text-right">
                    <p className="text-sm font-medium text-slate-500">Son Güncelleme</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(device._max.updatedAt ?? device._max.createdAt)}</p>
                    <Link href={`/technical/service-requests?q=${encodeURIComponent(query)}`} className="mt-3 inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50">
                      Talepleri Gör
                    </Link>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="px-5 py-10 text-sm text-slate-500">Henüz cihaz kaydı bulunmuyor.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function formatDate(date: Date | null) {
  if (!date) return "Yok";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
