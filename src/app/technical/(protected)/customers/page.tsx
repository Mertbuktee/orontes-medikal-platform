import { ArrowUpRight, Building2, Mail, MapPin, Phone, Search, Users } from "lucide-react";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaCustomerRegistryRepository } from "@/lib/database/repositories/customer-registry";
import { hasPermission } from "@/lib/rbac/permissions";

type TechnicalCustomersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export default async function TechnicalCustomersPage({
  searchParams,
}: TechnicalCustomersPageProps) {
  const session = await requirePermission("technicalCustomers.view");
  const canCreate = hasPermission(session.role, "technicalCustomers.create");
  const params = await searchParams;
  const query = getParam(params.q)?.slice(0, 120);
  const includeArchived = getParam(params.archived) === "all";
  const repository = new PrismaCustomerRegistryRepository(prisma);
  const customers = await repository.listCompanies({ query, includeArchived });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <AdminPageHeader
          eyebrow="Teknik Operasyon"
          title="Müşteriler"
          description="Teknik servis kayıtları için müşteri, lokasyon ve yetkili kayıtlarını yönetin."
        />
        {canCreate ? (
          <Link
            href="/technical/customers/new"
            className="inline-flex min-h-11 items-center rounded-2xl bg-cyan-500 px-4 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
          >
            Yeni Müşteri
          </Link>
        ) : null}
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
        <form
          action="/technical/customers"
          className="grid gap-3 md:grid-cols-[1fr_180px_auto]"
        >
          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
            <Search className="size-4 text-slate-400" aria-hidden="true" />
            <span className="sr-only">Müşteri ara</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Firma, vergi no, telefon veya e-posta"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </label>
          <label className="block">
            <span className="sr-only">Arşiv</span>
            <select
              name="archived"
              defaultValue={includeArchived ? "all" : "active"}
              className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
            >
              <option value="active">Aktif kayıtlar</option>
              <option value="all">Arşiv dahil</option>
            </select>
          </label>
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
          <h2 className="text-lg font-semibold text-slate-950">Müşteri Kayıtları</h2>
          <p className="mt-1 text-sm text-slate-500">{customers.length} kayıt gösteriliyor.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {customers.length ? (
            customers.map((customer) => (
              <article
                key={customer.id}
                className="grid gap-4 px-5 py-5 transition hover:bg-slate-50 xl:grid-cols-[1fr_220px_180px_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Building2 className="size-4 text-cyan-600" aria-hidden="true" />
                    <h3 className="text-base font-semibold text-slate-950">
                      {customer.displayName}
                    </h3>
                    {customer.archivedAt ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                        Arşiv
                      </span>
                    ) : customer.isActive ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        Aktif
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                        Pasif
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{customer.legalName}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Phone className="size-4" aria-hidden="true" />
                      {customer.phone}
                    </span>
                    <span className="inline-flex min-w-0 items-center gap-1">
                      <Mail className="size-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{customer.email}</span>
                    </span>
                  </div>
                </div>
                <Metric icon={MapPin} label="Lokasyon" value={customer._count.locations} />
                <Metric icon={Users} label="Yetkili" value={customer._count.contacts} />
                <div className="flex items-center xl:justify-end">
                  <Link
                    href={`/technical/customers/${customer.id}`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  >
                    Detay
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <p className="px-5 py-10 text-sm text-slate-500">Müşteri kaydı bulunmuyor.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: number;
}) {
  return (
    <div className="text-sm text-slate-600">
      <p className="flex items-center gap-2 font-medium text-slate-500">
        <Icon className="size-4 text-cyan-600" aria-hidden="true" />
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
