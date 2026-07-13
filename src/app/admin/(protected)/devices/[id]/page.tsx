import {
  Archive,
  ArrowLeft,
  Eye,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createElement, type ReactNode } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  archiveDeviceGroup,
  deleteArchivedDeviceGroup,
  restoreDeviceGroup,
  toggleDeviceActive,
  toggleDeviceFeatured,
} from "@/app/admin/(protected)/devices/actions";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaDeviceGroupRepository } from "@/lib/database/repositories/device-groups";
import { getDeviceIcon } from "@/lib/devices/device-registry";
import { hasPermission } from "@/lib/rbac/permissions";

type DeviceDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DeviceDetailPage({ params }: DeviceDetailPageProps) {
  const session = await requirePermission("devices.view");
  const { id } = await params;
  const repository = new PrismaDeviceGroupRepository(prisma);
  const device = await repository.getAdminDeviceGroupById(id);

  if (!device) notFound();

  const canUpdate = hasPermission(session.role, "devices.update");
  const canPublish = hasPermission(session.role, "devices.publish");
  const canDelete = hasPermission(session.role, "devices.delete");

  return (
    <div className="space-y-6">
      <Link
        href="/admin/devices"
        className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-orange-600"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Cihaz gruplarına dön
      </Link>

      <AdminPageHeader
        eyebrow="Cihaz Önizleme"
        title={device.title}
        description={device.shortDescription}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
              {createElement(getDeviceIcon(device.iconKey), {
                className: "size-6",
                "aria-hidden": true,
              })}
            </div>
            <div>
              <p className="text-sm font-semibold text-sky-700">
                /cihazlar/{device.slug}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
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
            </div>
          </div>

          <h2 className="mt-8 text-lg font-semibold text-slate-950">
            Detaylı Açıklama
          </h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
            {device.fullDescription}
          </p>

          <h2 className="mt-8 text-lg font-semibold text-slate-950">
            Yetenekler
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {device.capabilities.map((capability) => (
              <span
                key={capability}
                className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
              >
                {capability}
              </span>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <h2 className="text-lg font-semibold text-slate-950">Aksiyonlar</h2>
            <div className="mt-4 grid gap-2">
              {canUpdate ? (
                <Link
                  href={`/admin/devices/${device.id}/edit`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Düzenle
                </Link>
              ) : null}
              <Link
                href={`/cihazlar#${device.slug}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-orange-50"
              >
                <Eye className="size-4" aria-hidden="true" />
                Public önizle
              </Link>
              {canPublish && !device.archivedAt ? (
                <>
                  <ActionButton
                    action={toggleDeviceActive}
                    id={device.id}
                    name="isActive"
                    value={String(!device.isActive)}
                  >
                    {device.isActive ? "Pasifleştir" : "Aktifleştir"}
                  </ActionButton>
                  <ActionButton
                    action={toggleDeviceFeatured}
                    id={device.id}
                    name="isFeatured"
                    value={String(!device.isFeatured)}
                  >
                    {device.isFeatured ? "Ana sayfadan çıkar" : "Ana sayfada göster"}
                  </ActionButton>
                </>
              ) : null}
              {canDelete ? (
                device.archivedAt ? (
                  <>
                    <ActionButton action={restoreDeviceGroup} id={device.id}>
                      <RotateCcw className="size-4" aria-hidden="true" />
                      Arşivden çıkar
                    </ActionButton>
                    <ActionButton action={deleteArchivedDeviceGroup} id={device.id}>
                      <Trash2 className="size-4" aria-hidden="true" />
                      Kalıcı sil
                    </ActionButton>
                  </>
                ) : (
                  <ActionButton action={archiveDeviceGroup} id={device.id}>
                    <Archive className="size-4" aria-hidden="true" />
                    Arşivle
                  </ActionButton>
                )
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <h2 className="text-lg font-semibold text-slate-950">SEO</h2>
            <p className="mt-3 text-sm font-semibold text-slate-900">
              {device.seoTitle}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {device.seoDescription}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Sıra: {device.order} · Güncelleyen: {device.updatedBy?.name ?? "-"}
            </p>
          </section>
        </aside>
      </div>
    </div>
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

function ActionButton({
  action,
  id,
  name,
  value,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  name?: string;
  value?: string;
  children: ReactNode;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      {name && value ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="submit"
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-orange-50"
      >
        {children}
      </button>
    </form>
  );
}
