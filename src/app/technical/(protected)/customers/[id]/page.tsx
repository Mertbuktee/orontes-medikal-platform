import { ArrowUpRight, Building2, Mail, Phone, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  getServiceRequestStatusClassName,
  getServiceRequestStatusMeta,
} from "@/components/admin/service-request-status";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaCustomerRegistryRepository } from "@/lib/database/repositories/customer-registry";
import { hasPermission } from "@/lib/rbac/permissions";

import {
  archiveCustomerContact,
  archiveCustomerLocation,
  createCustomerContact,
  createCustomerLocation,
} from "../actions";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const session = await requirePermission("technicalCustomers.view");
  const canUpdate = hasPermission(session.role, "technicalCustomers.update");
  const canArchive = hasPermission(session.role, "technicalCustomers.archive");
  const { id } = await params;
  const customer = await new PrismaCustomerRegistryRepository(prisma).findCompanyById(id);

  if (!customer) notFound();

  const completedRequests = customer.serviceRequests.filter(
    (request) => request.status === "COMPLETED"
  );

  return (
    <div className="space-y-6">
      <Link
        href="/technical/customers"
        className="inline-flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50"
      >
        Müşterilere dön
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <AdminPageHeader
          eyebrow="Müşteri Kaydı"
          title={customer.displayName}
          description={`${customer.legalName} teknik servis müşteri kartı.`}
        />
        {canUpdate ? (
          <Link
            href={`/technical/customers/${customer.id}/edit`}
            className="inline-flex min-h-11 items-center rounded-2xl bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Düzenle
          </Link>
        ) : null}
      </div>

      <nav className="flex gap-2 overflow-x-auto rounded-3xl border border-slate-200 bg-white p-2 shadow-sm shadow-slate-200/60">
        {["Genel", "Lokasyonlar", "Yetkililer", "Cihazlar", "Servis Talepleri", "Servis Geçmişi"].map((item) => (
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
        <h2 className="text-lg font-semibold text-slate-950">Genel</h2>
        <dl className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Info icon={Building2} label="Resmi Ünvan" value={customer.legalName} />
          <Info icon={Phone} label="Telefon" value={customer.phone} />
          <Info icon={Mail} label="E-posta" value={customer.email} />
          <Info icon={UserRound} label="Durum" value={customer.archivedAt ? "Arşiv" : customer.isActive ? "Aktif" : "Pasif"} />
        </dl>
        {customer.taxNumber || customer.taxOffice || customer.notes ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {customer.taxNumber ? <p><strong>Vergi No:</strong> {customer.taxNumber}</p> : null}
            {customer.taxOffice ? <p><strong>Vergi Dairesi:</strong> {customer.taxOffice}</p> : null}
            {customer.notes ? <p className="mt-2 whitespace-pre-wrap">{customer.notes}</p> : null}
          </div>
        ) : null}
      </section>

      <section id="lokasyonlar" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <h2 className="text-lg font-semibold text-slate-950">Lokasyonlar</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {customer.locations.length ? (
            customer.locations.map((location) => (
              <article key={location.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">{location.name}</p>
                <p className="mt-1 text-sm text-slate-600">{location.city} / {location.district}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{location.addressLine}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {[location.department, location.building, location.floor].filter(Boolean).join(" · ") || "Ek bilgi yok"}
                </p>
                {canArchive ? (
                  <form action={archiveCustomerLocation} className="mt-3">
                    <input type="hidden" name="id" value={location.id} />
                    <input type="hidden" name="customerCompanyId" value={customer.id} />
                    <button type="submit" className="text-sm font-semibold text-rose-700">Arşivle</button>
                  </form>
                ) : null}
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-500">Lokasyon kaydı yok.</p>
          )}
        </div>
        {canUpdate ? <LocationForm customerId={customer.id} /> : null}
      </section>

      <section id="yetkililer" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <h2 className="text-lg font-semibold text-slate-950">Yetkililer</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {customer.contacts.length ? (
            customer.contacts.map((contact) => (
              <article key={contact.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-950">{contact.fullName}</p>
                <p className="mt-1 text-sm text-slate-600">{[contact.title, contact.department].filter(Boolean).join(" · ") || "Ünvan belirtilmedi"}</p>
                <p className="mt-2 text-sm text-slate-600">{contact.phone}{contact.email ? ` · ${contact.email}` : ""}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {contact.customerLocation?.name ?? "Genel yetkili"}
                </p>
                {canArchive ? (
                  <form action={archiveCustomerContact} className="mt-3">
                    <input type="hidden" name="id" value={contact.id} />
                    <input type="hidden" name="customerCompanyId" value={customer.id} />
                    <button type="submit" className="text-sm font-semibold text-rose-700">Arşivle</button>
                  </form>
                ) : null}
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-500">Yetkili kaydı yok.</p>
          )}
        </div>
        {canUpdate ? <ContactForm customerId={customer.id} locations={customer.locations} /> : null}
      </section>

      <section id="cihazlar" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <h2 className="text-lg font-semibold text-slate-950">Cihazlar</h2>
        <p className="mt-2 text-sm text-slate-500">
          Cihaz kartları TASK-044 ile ayrı CustomerDevice registry olarak eklenecek. Bu müşteri kartı o modele hazır.
        </p>
      </section>

      <RequestList
        id="servis-talepleri"
        title="Servis Talepleri"
        requests={customer.serviceRequests}
      />
      <RequestList
        id="servis-gecmisi"
        title="Servis Geçmişi"
        requests={completedRequests}
      />
    </div>
  );
}

function LocationForm({ customerId }: { customerId: string }) {
  return (
    <form action={createCustomerLocation} className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <input type="hidden" name="customerCompanyId" value={customerId} />
      <h3 className="font-semibold text-slate-950">Lokasyon Ekle</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Input name="name" label="Lokasyon Adı" required />
        <Input name="phone" label="Telefon" />
        <Input name="city" label="İl" required />
        <Input name="district" label="İlçe" required />
        <Input name="department" label="Departman" />
        <Input name="building" label="Bina" />
        <Input name="floor" label="Kat" />
      </div>
      <label className="mt-3 block">
        <span className="text-sm font-semibold text-slate-800">Adres</span>
        <textarea name="addressLine" required className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-300" />
      </label>
      <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <input type="checkbox" name="isPrimary" value="true" className="size-4" /> Birincil lokasyon
      </label>
      <button type="submit" className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-slate-950">Lokasyon Ekle</button>
    </form>
  );
}

function ContactForm({
  customerId,
  locations,
}: {
  customerId: string;
  locations: Array<{ id: string; name: string }>;
}) {
  return (
    <form action={createCustomerContact} className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <input type="hidden" name="customerCompanyId" value={customerId} />
      <h3 className="font-semibold text-slate-950">Yetkili Ekle</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Input name="fullName" label="Ad Soyad" required />
        <Input name="phone" label="Telefon" required />
        <Input name="email" label="E-posta" type="email" />
        <Input name="title" label="Ünvan" />
        <Input name="department" label="Departman" />
        <label className="block">
          <span className="text-sm font-semibold text-slate-800">Lokasyon</span>
          <select name="customerLocationId" className="mt-2 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-300">
            <option value="">Genel yetkili</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>{location.name}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <input type="checkbox" name="isPrimary" value="true" className="size-4" /> Birincil yetkili
      </label>
      <button type="submit" className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-slate-950">Yetkili Ekle</button>
    </form>
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
    status: string;
    company: string;
    fullName: string;
    message: string;
    updatedAt: Date;
    attachments: Array<unknown>;
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
            const status = getServiceRequestStatusMeta(request.status as never);
            return (
              <article key={request.id} className="grid gap-4 px-5 py-5 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">#{request.id.slice(-6).toUpperCase()}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getServiceRequestStatusClassName(request.status as never)}`}>{status.label}</span>
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
  icon: typeof Building2;
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

function Input({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <input
        type={type}
        name={name}
        required={required}
        className="mt-2 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-cyan-300"
      />
    </label>
  );
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
