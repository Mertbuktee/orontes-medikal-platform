import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaCustomerRegistryRepository } from "@/lib/database/repositories/customer-registry";

import { archiveCustomerCompany, updateCustomerCompany } from "../../actions";

type EditCustomerPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  await requirePermission("technicalCustomers.update");
  const { id } = await params;
  const repository = new PrismaCustomerRegistryRepository(prisma);
  const customer = await repository.findCompanyById(id);

  if (!customer) notFound();

  const suggestions = await repository.findDuplicateSuggestions({
    legalName: customer.legalName,
    displayName: customer.displayName,
    taxNumber: customer.taxNumber,
    phone: customer.phone,
    email: customer.email,
    excludeId: customer.id,
  });

  return (
    <div className="space-y-6">
      <Link
        href={`/technical/customers/${customer.id}`}
        className="inline-flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50"
      >
        Detaya dön
      </Link>
      <AdminPageHeader
        eyebrow="Teknik Operasyon"
        title="Müşteri Düzenle"
        description={`${customer.displayName} müşteri kartını güncelleyin.`}
      />
      <DuplicateSuggestions suggestions={suggestions} />
      <form action={updateCustomerCompany} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <input type="hidden" name="id" value={customer.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field name="legalName" label="Resmi Ünvan" defaultValue={customer.legalName} required />
          <Field name="displayName" label="Görünen Ad" defaultValue={customer.displayName} required />
          <Field name="phone" label="Telefon" defaultValue={customer.phone} required />
          <Field name="email" label="E-posta" type="email" defaultValue={customer.email} required />
          <Field name="taxNumber" label="Vergi No" defaultValue={customer.taxNumber} />
          <Field name="taxOffice" label="Vergi Dairesi" defaultValue={customer.taxOffice} />
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-800">Notlar</span>
          <textarea
            name="notes"
            defaultValue={customer.notes ?? ""}
            maxLength={4000}
            className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
          />
        </label>
        <label className="mt-4 flex items-center gap-3 text-sm font-semibold text-slate-800">
          <input
            type="checkbox"
            name="isActive"
            value="true"
            defaultChecked={customer.isActive}
            className="size-4 rounded border-slate-300 text-cyan-600"
          />
          Aktif kayıt
        </label>
        <button
          type="submit"
          className="mt-6 inline-flex min-h-11 items-center rounded-2xl bg-cyan-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          Kaydet
        </button>
      </form>

      {!customer.archivedAt ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
          <h2 className="text-base font-semibold text-rose-950">Arşivle</h2>
          <p className="mt-1 text-sm text-rose-800">
            Kayıt silinmez; arşive alınır ve geçmiş servis talepleri korunur.
          </p>
          <form action={archiveCustomerCompany} className="mt-4">
            <input type="hidden" name="id" value={customer.id} />
            <button
              type="submit"
              className="inline-flex min-h-10 items-center rounded-xl border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              Müşteriyi Arşivle
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
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
        defaultValue={defaultValue ?? ""}
        className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
      />
    </label>
  );
}

function DuplicateSuggestions({
  suggestions,
}: {
  suggestions: Array<{
    id: string;
    displayName: string;
    legalName: string;
    phone: string;
    email: string;
    taxNumber: string | null;
  }>;
}) {
  if (!suggestions.length) return null;

  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
      <h2 className="text-base font-semibold">Olası mükerrer kayıtlar</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {suggestions.map((suggestion) => (
          <Link
            key={suggestion.id}
            href={`/technical/customers/${suggestion.id}`}
            className="rounded-2xl border border-amber-200 bg-white/70 p-4 text-sm transition hover:bg-white"
          >
            <span className="font-semibold">{suggestion.displayName}</span>
            <span className="mt-1 block text-amber-800">
              {suggestion.legalName} · {suggestion.phone} · {suggestion.email}
              {suggestion.taxNumber ? ` · ${suggestion.taxNumber}` : ""}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
