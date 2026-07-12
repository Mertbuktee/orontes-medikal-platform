import {
  ArrowLeft,
  Building2,
  CalendarClock,
  FileText,
  Mail,
  Paperclip,
  Phone,
  Save,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  formatFileSize,
  getServiceRequestStatusClassName,
  getServiceRequestStatusMeta,
  serviceRequestStatusOptions,
} from "@/components/admin/service-request-status";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaServiceRequestRepository } from "@/lib/database/repositories/service-requests";
import { hasPermission } from "@/lib/rbac/permissions";

import {
  addServiceRequestNote,
  updateServiceRequestStatus,
} from "../actions";

type ServiceRequestDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ServiceRequestDetailPage({
  params,
}: ServiceRequestDetailPageProps) {
  const session = await requirePermission("serviceRequests.view");
  const { id } = await params;
  const repository = new PrismaServiceRequestRepository(prisma);
  const request = await repository.findById(id);

  if (!request) {
    notFound();
  }

  const canUpdate = hasPermission(session.role, "serviceRequests.update");
  const statusMeta = getServiceRequestStatusMeta(request.status);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/service-requests"
        className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Servis taleplerine dön
      </Link>

      <AdminPageHeader
        eyebrow="Servis Talebi"
        title={request.fullName}
        description={`${request.company} tarafından iletilen servis başvurusu. Talep detayları, durum geçmişi ve ekip içi notlar bu ekranda takip edilir.`}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Başvuru Detayları
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Talebin müşteri, cihaz ve arıza açıklaması.
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${getServiceRequestStatusClassName(request.status)}`}
              >
                {statusMeta.label}
              </span>
            </div>

            <dl className="mt-6 grid gap-4 md:grid-cols-2">
              <InfoItem icon={Building2} label="Firma/Hastane" value={request.company} />
              <InfoItem icon={Phone} label="Telefon" value={request.phone} />
              <InfoItem icon={Mail} label="E-posta" value={request.email} />
              <InfoItem
                icon={CalendarClock}
                label="Oluşturulma"
                value={formatDate(request.createdAt)}
              />
              <InfoItem
                icon={FileText}
                label="Cihaz Markası"
                value={request.deviceBrand || "Belirtilmedi"}
              />
              <InfoItem
                icon={FileText}
                label="Cihaz Modeli"
                value={request.deviceModel || "Belirtilmedi"}
              />
              <InfoItem
                icon={FileText}
                label="Seri No"
                value={request.deviceSerialNumber || "Belirtilmedi"}
              />
            </dl>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-sm font-semibold text-slate-950">
                Mesaj
              </h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {request.message}
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
            <h2 className="text-lg font-semibold text-slate-950">
              Ekip İçi Notlar
            </h2>
            {canUpdate ? (
              <form action={addServiceRequestNote} className="mt-5 space-y-3">
                <input type="hidden" name="serviceRequestId" value={request.id} />
                <label className="sr-only" htmlFor="service-request-note">
                  Not ekle
                </label>
                <textarea
                  id="service-request-note"
                  name="content"
                  required
                  minLength={2}
                  maxLength={2000}
                  placeholder="Teknik değerlendirme, müşteri görüşmesi veya işlem notu ekleyin."
                  className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                />
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                >
                  Not Ekle
                  <Save className="size-4" aria-hidden="true" />
                </button>
              </form>
            ) : null}

            <div className="mt-6 space-y-3">
              {request.internalNotes.length ? (
                request.internalNotes.map((note) => (
                  <article
                    key={note.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-950">
                        {note.author.name}
                      </p>
                      <time className="text-xs font-medium text-slate-500">
                        {formatDate(note.createdAt)}
                      </time>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {note.content}
                    </p>
                  </article>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                  Henüz ekip içi not bulunmuyor.
                </p>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
            <h2 className="text-lg font-semibold text-slate-950">
              Durum Yönetimi
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {statusMeta.description}
            </p>

            {canUpdate ? (
              <form action={updateServiceRequestStatus} className="mt-5 space-y-3">
                <input type="hidden" name="id" value={request.id} />
                <label className="sr-only" htmlFor="service-request-status">
                  Talep durumu
                </label>
                <select
                  id="service-request-status"
                  name="status"
                  defaultValue={request.status}
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                >
                  {serviceRequestStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                >
                  Durumu Güncelle
                  <Save className="size-4" aria-hidden="true" />
                </button>
              </form>
            ) : (
              <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Bu talebin durumunu değiştirmek için güncelleme yetkisi gerekir.
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
            <h2 className="text-lg font-semibold text-slate-950">
              Ekler
            </h2>
            <div className="mt-4 space-y-3">
              {request.attachments.length ? (
                request.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                      <Paperclip className="size-4 text-orange-500" aria-hidden="true" />
                      {attachment.mimeType}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {formatFileSize(attachment.size)}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      Dosya private storage alanında saklanır.
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  Bu başvuruya dosya eklenmemiş.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
            <h2 className="text-lg font-semibold text-slate-950">
              Durum Geçmişi
            </h2>
            <div className="mt-4 space-y-3">
              {request.statusHistory.length ? (
                request.statusHistory.map((history) => (
                  <div
                    key={history.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-sm font-semibold text-slate-950">
                      {getServiceRequestStatusMeta(history.toStatus).label}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {history.changedBy.name} - {formatDate(history.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  Henüz durum geçmişi yok.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        <Icon className="size-4 text-sky-600" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm font-semibold text-slate-950">
        {value}
      </dd>
    </div>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
