import { Mail, Phone, UserRound } from "lucide-react";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaServiceRequestRepository } from "@/lib/database/repositories/service-requests";

export const dynamic = "force-dynamic";

export default async function TechnicalCustomersPage() {
  await requirePermission("serviceRequests.view");

  const repository = new PrismaServiceRequestRepository(prisma);
  const customers = await repository.listTechnicalCustomers();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Teknik Operasyon"
        title="Müşteriler"
        description="Servis taleplerinden türetilen müşteri kayıtlarını inceleyin."
      />

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Müşteri Kayıtları</h2>
          <p className="mt-1 text-sm text-slate-500">{customers.length} kayıt gösteriliyor.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {customers.length ? (
            customers.map((customer) => (
              <article key={`${customer.email}-${customer.phone}-${customer.company}`} className="grid gap-4 px-5 py-5 md:grid-cols-[1fr_220px_180px]">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold text-slate-950">
                    <UserRound className="size-4 text-cyan-600" aria-hidden="true" />
                    {customer.fullName}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{customer.company || "Firma bilgisi yok"}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1"><Phone className="size-4" aria-hidden="true" />{customer.phone}</span>
                    <span className="inline-flex min-w-0 items-center gap-1"><Mail className="size-4 shrink-0" aria-hidden="true" /><span className="truncate">{customer.email}</span></span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Servis Talebi</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-950">{customer._count.id}</p>
                </div>
                <div className="md:text-right">
                  <p className="text-sm font-medium text-slate-500">Son Güncelleme</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(customer._max.updatedAt ?? customer._max.createdAt)}</p>
                  <Link href={`/technical/service-requests?q=${encodeURIComponent(customer.email)}`} className="mt-3 inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50">
                    Talepleri Gör
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <p className="px-5 py-10 text-sm text-slate-500">Henüz müşteri kaydı bulunmuyor.</p>
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
