import {
  ArrowDownToLine,
  ArrowLeft,
  Building2,
  CalendarClock,
  FileText,
  Mail,
  Paperclip,
  Phone,
  Save,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  formatFileSize,
  getAllowedNextStatuses,
  getServiceRequestStatusClassName,
  getServiceRequestStatusMeta,
} from "@/components/admin/service-request-status";
import { requirePermission } from "@/lib/auth/admin-session";
import { AdminAuthRepository } from "@/lib/auth/admin-auth-repository";
import { prisma } from "@/lib/database/prisma";
import { PrismaServiceRequestRepository } from "@/lib/database/repositories/service-requests";
import { hasPermission } from "@/lib/rbac/permissions";

import {
  addServiceRequestNote,
  archiveServiceRequest,
  assignServiceRequest,
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
  const auditRepository = new AdminAuthRepository(prisma);
  const [request, assignableUsers] = await Promise.all([
    repository.findById(id),
    repository.listAssignableUsers(),
  ]);

  if (!request) {
    notFound();
  }

  const canUpdate = hasPermission(session.role, "serviceRequests.update");
  const canAssign = hasPermission(session.role, "serviceRequests.assign");
  const canArchive = hasPermission(session.role, "serviceRequests.archive");
  const canAddNote = hasPermission(session.role, "serviceRequests.notes.create");
  const canViewAudit = hasPermission(session.role, "audit.view");
  const canViewAttachment = hasPermission(
    session.role,
    "serviceRequests.attachments.view"
  );
  const statusMeta = getServiceRequestStatusMeta(request.status);
  const allowedNextStatuses = getAllowedNextStatuses(request.status);
  const auditEvents = canViewAudit
    ? await auditRepository.listServiceRequestAuditEvents(request.id)
    : [];

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
        eyebrow={`Talep ${shortId(request.id)}`}
        title={request.fullName}
        description={`${request.company || "Firma bilgisi yok"} tarafından iletilen servis başvurusu. Talep detayları, durum geçmişi ve ekip içi notlar bu ekranda takip edilir.`}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
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
              <InfoItem
                icon={Building2}
                label="Firma/Hastane"
                value={request.company || "Belirtilmedi"}
              />
              <InfoItem
                icon={Phone}
                label="Telefon"
                value={request.phone}
                href={`tel:${request.phone.replace(/\s+/g, "")}`}
              />
              <InfoItem
                icon={Mail}
                label="E-posta"
                value={request.email}
                href={`mailto:${request.email}`}
              />
              <InfoItem
                icon={CalendarClock}
                label="Oluşturulma"
                value={formatDate(request.createdAt)}
              />
              <InfoItem
                icon={CalendarClock}
                label="Güncellenme"
                value={formatDate(request.updatedAt)}
              />
              <InfoItem
                icon={UserRoundCheck}
                label="Atanan Personel"
                value={request.assignedUser?.name ?? "Atanmadı"}
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
              <h3 className="text-sm font-semibold text-slate-950">Mesaj</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {request.message}
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
            <h2 className="text-lg font-semibold text-slate-950">
              Ekip İçi Notlar
            </h2>
            {canAddNote ? (
              <form action={addServiceRequestNote} className="mt-5 space-y-3">
                <input type="hidden" name="serviceRequestId" value={request.id} />
                <label className="sr-only" htmlFor="service-request-note">
                  Not ekle
                </label>
                <textarea
                  id="service-request-note"
                  name="content"
                  required
                  minLength={1}
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

            {canUpdate && allowedNextStatuses.length ? (
              <form action={updateServiceRequestStatus} className="mt-5 space-y-3">
                <input type="hidden" name="id" value={request.id} />
                <label className="sr-only" htmlFor="service-request-status">
                  Talep durumu
                </label>
                <select
                  id="service-request-status"
                  name="status"
                  defaultValue={allowedNextStatuses[0]}
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                >
                  {allowedNextStatuses.map((status) => (
                    <option key={status} value={status}>
                      {getServiceRequestStatusMeta(status).label}
                    </option>
                  ))}
                </select>
                <label className="sr-only" htmlFor="service-request-status-reason">
                  Durum değişikliği gerekçesi
                </label>
                <textarea
                  id="service-request-status-reason"
                  name="reason"
                  maxLength={500}
                  placeholder="İsteğe bağlı iç gerekçe ekleyin."
                  className="min-h-20 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                />
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
                Bu talep için uygun durum geçişi veya güncelleme yetkisi bulunmuyor.
              </p>
            )}

            {canArchive && allowedNextStatuses.includes("ARCHIVED") ? (
              <form action={archiveServiceRequest} className="mt-3 space-y-3">
                <input type="hidden" name="id" value={request.id} />
                <label className="sr-only" htmlFor="archive-reason">
                  Arşiv gerekçesi
                </label>
                <textarea
                  id="archive-reason"
                  name="reason"
                  maxLength={500}
                  placeholder="Arşiv gerekçesi ekleyin."
                  className="min-h-20 w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-950 outline-none placeholder:text-rose-400 focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                />
                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                >
                  Talebi Arşivle
                </button>
              </form>
            ) : null}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
            <h2 className="text-lg font-semibold text-slate-950">Atama</h2>
            {canAssign ? (
              <form action={assignServiceRequest} className="mt-5 space-y-3">
                <input type="hidden" name="id" value={request.id} />
                <label className="sr-only" htmlFor="assigned-user">
                  Atanan personel
                </label>
                <select
                  id="assigned-user"
                  name="assignedUserId"
                  defaultValue={request.assignedUserId ?? ""}
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                >
                  <option value="">Atamayı kaldır</option>
                  {assignableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                >
                  Atamayı Kaydet
                  <Save className="size-4" aria-hidden="true" />
                </button>
              </form>
            ) : (
              <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Atama yapmak için admin yetkisi gerekir.
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
            <h2 className="text-lg font-semibold text-slate-950">Ekler</h2>
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
                    {canViewAttachment ? (
                      <Link
                        href={`/admin/service-requests/${request.id}/attachments/${attachment.id}`}
                        className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                      >
                        Dosyayı İndir
                        <ArrowDownToLine className="size-4" aria-hidden="true" />
                      </Link>
                    ) : null}
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
                      {history.fromStatus
                        ? `${getServiceRequestStatusMeta(history.fromStatus).label} -> `
                        : ""}
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

          {canViewAudit ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
              <h2 className="text-lg font-semibold text-slate-950">
                Audit Özeti
              </h2>
              <div className="mt-4 space-y-3">
                {auditEvents.length ? (
                  auditEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="text-sm font-semibold text-slate-950">
                        {event.action} - {event.entityType}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {event.actor?.name ?? "Sistem"} -{" "}
                        {formatDate(event.createdAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    Bu talep için audit kaydı bulunmuyor.
                  </p>
                )}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        <Icon className="size-4 text-sky-600" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm font-semibold text-slate-950">
        {value}
      </dd>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-orange-200 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      {content}
    </div>
  );
}

function shortId(id: string) {
  return `#${id.slice(-6).toUpperCase()}`;
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
