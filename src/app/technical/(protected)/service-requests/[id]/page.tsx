import {
  ArrowDownToLine,
  ArrowLeft,
  Building2,
  CalendarClock,
  FileText,
  Mail,
  MonitorCog,
  Paperclip,
  Phone,
  Save,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ServiceRequestAttachmentViewer } from "@/components/admin/service-requests/ServiceRequestAttachmentViewer";
import {
  formatFileSize,
  getAllowedNextStatuses,
  getServiceRequestStatusClassName,
  getServiceRequestStatusMeta,
} from "@/components/admin/service-request-status";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaCustomerDeviceRepository } from "@/lib/database/repositories/customer-devices";
import { PrismaCustomerRegistryRepository } from "@/lib/database/repositories/customer-registry";
import { PrismaServiceRequestRepository } from "@/lib/database/repositories/service-requests";
import { hasPermission } from "@/lib/rbac/permissions";

import {
  addServiceRequestNote,
  archiveServiceRequest,
  assignServiceRequest,
  updateServiceRequestStatus,
} from "@/app/admin/(protected)/service-requests/actions";
import {
  createCustomerFromServiceRequest,
  linkServiceRequestToCustomer,
} from "@/app/technical/(protected)/customers/actions";
import {
  createDeviceFromServiceRequest,
  linkServiceRequestToDevice,
} from "@/app/technical/(protected)/devices/actions";

type TechnicalServiceRequestDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function TechnicalServiceRequestDetailPage({
  params,
}: TechnicalServiceRequestDetailPageProps) {
  const session = await requirePermission("serviceRequests.view");
  const { id } = await params;
  const repository = new PrismaServiceRequestRepository(prisma);
  const customerRepository = new PrismaCustomerRegistryRepository(prisma);
  const deviceRepository = new PrismaCustomerDeviceRepository(prisma);
  const [request, assignableUsers, deviceHistory, customerOptions, deviceOptions] = await Promise.all([
    repository.findById(id),
    repository.listAssignableUsers(),
    repository.findDeviceServiceHistoryByRequestId(id),
    customerRepository.listCompanyOptions(),
    deviceRepository.listDeviceOptions(),
  ]);

  if (!request) {
    notFound();
  }

  const canUpdate = hasPermission(session.role, "serviceRequests.update");
  const canAssign = hasPermission(session.role, "serviceRequests.assign");
  const canArchive = hasPermission(session.role, "serviceRequests.archive");
  const canAddNote = hasPermission(session.role, "serviceRequests.notes.create");
  const canManageCustomerLink = hasPermission(
    session.role,
    "technicalCustomers.create",
  );
  const canManageDeviceLink =
    canUpdate && hasPermission(session.role, "technicalDevices.create");
  const canCreateDeviceFromRequest = Boolean(
    request.customerCompanyId &&
      request.customerLocationId &&
      request.deviceSerialNumber,
  );
  const canViewAttachment = hasPermission(
    session.role,
    "serviceRequests.attachments.view",
  );
  const statusMeta = getServiceRequestStatusMeta(request.status);
  const allowedNextStatuses = getAllowedNextStatuses(request.status);
  const imageAttachments = canViewAttachment
    ? request.attachments
        .filter((attachment) =>
          ["image/jpeg", "image/png", "image/webp"].includes(
            attachment.mimeType,
          ),
        )
        .map((attachment) => ({
          id: attachment.id,
          mimeType: attachment.mimeType,
          sizeLabel: formatFileSize(attachment.size),
          previewUrl: `/technical/service-requests/${request.id}/attachments/${attachment.id}?preview=1`,
        }))
    : [];

  return (
    <div className="space-y-6">
      <Link
        href="/technical/service-requests"
        className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Servis taleplerine dön
      </Link>

      <AdminPageHeader
        eyebrow={`Talep ${shortId(request.id)}`}
        title={request.fullName}
        description={`${request.company || "Firma bilgisi yok"} tarafından iletilen teknik servis başvurusu. Talep detayları, durum geçmişi, ekler ve ekip içi notlar bu ekranda takip edilir.`}
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
                  Müşteri, cihaz ve arıza açıklaması.
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
                <input
                  type="hidden"
                  name="serviceRequestId"
                  value={request.id}
                />
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
                  className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
                />
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
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
              <form
                action={updateServiceRequestStatus}
                className="mt-5 space-y-3"
              >
                <input type="hidden" name="id" value={request.id} />
                <label className="sr-only" htmlFor="service-request-status">
                  Talep durumu
                </label>
                <select
                  id="service-request-status"
                  name="status"
                  defaultValue={allowedNextStatuses[0]}
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
                >
                  {allowedNextStatuses.map((status) => (
                    <option key={status} value={status}>
                      {getServiceRequestStatusMeta(status).label}
                    </option>
                  ))}
                </select>
                <label
                  className="sr-only"
                  htmlFor="service-request-status-reason"
                >
                  Durum değişikliği gerekçesi
                </label>
                <textarea
                  id="service-request-status-reason"
                  name="reason"
                  maxLength={500}
                  placeholder="İsteğe bağlı iç gerekçe ekleyin."
                  className="min-h-20 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
                />
                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
                >
                  Durumu Güncelle
                  <Save className="size-4" aria-hidden="true" />
                </button>
              </form>
            ) : (
              <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Bu talep için uygun durum geçişi veya güncelleme yetkisi
                bulunmuyor.
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
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
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
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
                >
                  Atamayı Kaydet
                  <Save className="size-4" aria-hidden="true" />
                </button>
              </form>
            ) : (
              <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Atama yapmak için yetki gerekir.
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
            <h2 className="text-lg font-semibold text-slate-950">
              Müşteri Kaydı
            </h2>
            {request.customerCompany ? (
              <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                <p className="text-sm font-semibold text-cyan-950">
                  {request.customerCompany.displayName}
                </p>
                <p className="mt-1 text-sm text-cyan-900">
                  {request.customerCompany.phone} · {request.customerCompany.email}
                </p>
                <Link
                  href={`/technical/customers/${request.customerCompany.id}`}
                  className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-cyan-500 px-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                >
                  Müşteri Detayı
                </Link>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                Bu talep henüz müşteri kartına bağlı değil.
              </p>
            )}

            {canManageCustomerLink ? (
              <div className="mt-5 space-y-3">
                <form action={linkServiceRequestToCustomer} className="space-y-3">
                  <input type="hidden" name="serviceRequestId" value={request.id} />
                  <label className="block">
                    <span className="sr-only">Mevcut müşteri</span>
                    <select
                      name="customerCompanyId"
                      required
                      defaultValue={request.customerCompanyId ?? ""}
                      className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
                    >
                      <option value="">Mevcut müşteri seç</option>
                      {customerOptions.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.displayName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="submit"
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 px-4 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
                  >
                    Mevcut Müşteriye Bağla
                  </button>
                </form>
                <form action={createCustomerFromServiceRequest}>
                  <input type="hidden" name="serviceRequestId" value={request.id} />
                  <button
                    type="submit"
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                  >
                    Yeni Müşteri Oluştur
                  </button>
                </form>
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
            <h2 className="text-lg font-semibold text-slate-950">
              Cihaz Kaydı
            </h2>
            {request.customerDevice ? (
              <div className="mt-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-cyan-950">
                  <MonitorCog className="size-4" aria-hidden="true" />
                  {request.customerDevice.publicCode} ·{" "}
                  {getDeviceLabel(request.customerDevice)}
                </p>
                <p className="mt-1 text-sm text-cyan-900">
                  Seri No: {request.customerDevice.serialNumber}
                </p>
                <Link
                  href={`/technical/devices/${request.customerDevice.id}`}
                  className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-cyan-500 px-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                >
                  Cihaz Detayı
                </Link>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                Bu talep henüz fiziksel cihaz kartına bağlı değil.
              </p>
            )}

            {canManageDeviceLink ? (
              <div className="mt-5 space-y-3">
                <form action={linkServiceRequestToDevice} className="space-y-3">
                  <input type="hidden" name="serviceRequestId" value={request.id} />
                  <label className="block">
                    <span className="sr-only">Mevcut cihaz</span>
                    <select
                      name="customerDeviceId"
                      required
                      defaultValue={request.customerDeviceId ?? ""}
                      className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
                    >
                      <option value="">Mevcut cihaz seç</option>
                      {deviceOptions.map((device) => (
                        <option key={device.id} value={device.id}>
                          {device.publicCode} - {getDeviceLabel(device)} - {device.serialNumber}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="submit"
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 px-4 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
                  >
                    Mevcut Cihaza Bağla
                  </button>
                </form>
                <form action={createDeviceFromServiceRequest}>
                  <input type="hidden" name="serviceRequestId" value={request.id} />
                  <button
                    type="submit"
                    disabled={!canCreateDeviceFromRequest}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    Talepten Cihaz Oluştur
                  </button>
                </form>
                {!canCreateDeviceFromRequest ? (
                  <p className="text-xs leading-5 text-slate-500">
                    Otomatik cihaz oluşturmak için talep önce müşteri, lokasyon ve seri no bilgisi taşımalı.
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
            <h2 className="text-lg font-semibold text-slate-950">Ekler</h2>
            {imageAttachments.length ? (
              <ServiceRequestAttachmentViewer attachments={imageAttachments} />
            ) : null}
            <div className="mt-4 space-y-3">
              {request.attachments.length ? (
                request.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                      <Paperclip
                        className="size-4 text-cyan-600"
                        aria-hidden="true"
                      />
                      {attachment.mimeType}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {formatFileSize(attachment.size)}
                    </p>
                    {canViewAttachment ? (
                      <Link
                        href={`/technical/service-requests/${request.id}/attachments/${attachment.id}`}
                        className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                      >
                        Dosyayı İndir
                        <ArrowDownToLine
                          className="size-4"
                          aria-hidden="true"
                        />
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

          {deviceHistory ? (
            <section className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6 shadow-sm shadow-cyan-100/70">
              <h2 className="text-lg font-semibold text-cyan-950">
                Cihaz Servis Geçmişi
              </h2>
              <p className="mt-2 text-sm leading-6 text-cyan-900">
                Bu talep tamamlandığında cihaz geçmişi otomatik oluşturuldu.
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                Tamamlanma
              </p>
              <p className="mt-1 text-sm font-semibold text-cyan-950">
                {formatDate(deviceHistory.completedAt)}
              </p>
              <Link
                href={`/technical/service-requests/new?historyId=${deviceHistory.id}`}
                className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-cyan-500 px-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
              >
                Kopyala ve Yeni Servis Oluştur
              </Link>
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
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        <Icon className="size-4" aria-hidden="true" />
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
        className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-cyan-200 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
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
