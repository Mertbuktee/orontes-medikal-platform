import { Archive, ArrowLeft, Eye, Pencil, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createElement, type ReactNode } from "react";

import {
  archiveService,
  deleteArchivedService,
  restoreService,
  toggleServiceActive,
  toggleServiceFeatured,
} from "@/app/admin/(protected)/services/actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaServiceRepository } from "@/lib/database/repositories/services";
import { getServiceIcon } from "@/lib/services/service-registry";
import { hasPermission } from "@/lib/rbac/permissions";

type ServiceDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const session = await requirePermission("services.view");
  const { id } = await params;
  const repository = new PrismaServiceRepository(prisma);
  const service = await repository.getAdminServiceById(id);

  if (!service) notFound();

  const canUpdate = hasPermission(session.role, "services.update");
  const canPublish = hasPermission(session.role, "services.publish");
  const canDelete = hasPermission(session.role, "services.delete");
  const publicHref =
    service.slug === "elektronik-kart-tamiri"
      ? "/elektronik-kart-tamiri"
      : `/hizmetler#${service.slug}`;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/services"
        className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-orange-600"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Hizmetlere dön
      </Link>

      <AdminPageHeader
        eyebrow="Hizmet Önizleme"
        title={service.title}
        description={service.shortDescription}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
              {createElement(getServiceIcon(service.iconKey), {
                className: "size-6",
                "aria-hidden": true,
              })}
            </div>
            <div>
              <p className="text-sm font-semibold text-sky-700">
                /hizmetler/{service.slug}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                <StateBadge active={service.isActive}>
                  {service.isActive ? "Aktif" : "Pasif"}
                </StateBadge>
                <StateBadge active={service.isFeatured}>
                  {service.isFeatured ? "Ana sayfada" : "Öne çıkmıyor"}
                </StateBadge>
                {service.archivedAt ? (
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
            {service.fullDescription}
          </p>
        </section>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
            <h2 className="text-lg font-semibold text-slate-950">Aksiyonlar</h2>
            <div className="mt-4 grid gap-2">
              {canUpdate ? (
                <Link
                  href={`/admin/services/${service.id}/edit`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Düzenle
                </Link>
              ) : null}
              <Link
                href={publicHref}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-orange-50"
              >
                <Eye className="size-4" aria-hidden="true" />
                Public önizle
              </Link>
              {canPublish && !service.archivedAt ? (
                <>
                  <ActionButton
                    action={toggleServiceActive}
                    id={service.id}
                    name="isActive"
                    value={String(!service.isActive)}
                  >
                    {service.isActive ? "Pasifleştir" : "Aktifleştir"}
                  </ActionButton>
                  <ActionButton
                    action={toggleServiceFeatured}
                    id={service.id}
                    name="isFeatured"
                    value={String(!service.isFeatured)}
                  >
                    {service.isFeatured ? "Ana sayfadan çıkar" : "Ana sayfada göster"}
                  </ActionButton>
                </>
              ) : null}
              {canDelete ? (
                service.archivedAt ? (
                  <>
                    <ActionButton action={restoreService} id={service.id}>
                      <RotateCcw className="size-4" aria-hidden="true" />
                      Arşivden çıkar
                    </ActionButton>
                    <ActionButton action={deleteArchivedService} id={service.id}>
                      <Trash2 className="size-4" aria-hidden="true" />
                      Kalıcı sil
                    </ActionButton>
                  </>
                ) : (
                  <ActionButton action={archiveService} id={service.id}>
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
              {service.seoTitle}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {service.seoDescription}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              Sıra: {service.order} · Güncelleyen: {service.updatedBy?.name ?? "-"}
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
