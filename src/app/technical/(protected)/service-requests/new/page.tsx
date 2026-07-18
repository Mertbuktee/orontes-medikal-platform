import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaServiceRequestRepository } from "@/lib/database/repositories/service-requests";

import { createTechnicalServiceRequest } from "../actions";

type NewTechnicalServiceRequestPageProps = {
  searchParams: Promise<{ historyId?: string | string[]; status?: string | string[] }>;
};

export const dynamic = "force-dynamic";

export default async function NewTechnicalServiceRequestPage({
  searchParams,
}: NewTechnicalServiceRequestPageProps) {
  await requirePermission("serviceRequests.create");

  const historyId = getParam((await searchParams).historyId);
  const repository = new PrismaServiceRequestRepository(prisma);
  const history = historyId
    ? await repository.findDeviceServiceHistoryById(historyId)
    : null;

  if (historyId && !history) notFound();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Servis Talebi"
        title="Yeni Servis Oluştur"
        description="Servis geçmişinden kopyalanan müşteri ve cihaz bilgileriyle yeni servis talebi açın."
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        {history ? (
          <div className="mb-5 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-950">
            Bu form servis geçmişinden kopyalandı. Marka, model, seri, müşteri
            ve iletişim bilgileri otomatik dolduruldu.
          </div>
        ) : null}

        <form action={createTechnicalServiceRequest} className="grid gap-4 md:grid-cols-2">
          <TextField name="fullName" label="Ad Soyad" defaultValue={history?.fullName} required />
          <TextField name="company" label="Firma/Hastane" defaultValue={history?.company} required />
          <TextField name="phone" label="Telefon" defaultValue={history?.phone} required />
          <TextField name="email" label="E-posta" type="email" defaultValue={history?.email} required />
          <TextField name="deviceBrand" label="Cihaz Markası" defaultValue={history?.deviceBrand ?? undefined} />
          <TextField name="deviceModel" label="Cihaz Modeli" defaultValue={history?.deviceModel ?? undefined} />
          <TextField name="deviceSerialNumber" label="Seri No" defaultValue={history?.deviceSerialNumber ?? undefined} />
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            Servis Açıklaması
            <textarea
              name="message"
              required
              minLength={10}
              maxLength={3000}
              defaultValue={
                history
                  ? `Tekrar servis kaydı. Önceki servis özeti:\n${history.serviceSummary}`
                  : undefined
              }
              className="min-h-36 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-2xl bg-cyan-500 px-5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
            >
              Servis Talebi Aç
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function TextField({
  name,
  label,
  type = "text",
  defaultValue,
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
      />
    </label>
  );
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
