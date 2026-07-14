import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  getAuditCategoryLabel,
  getAuditSeverityLabel,
} from "@/lib/audit/audit-presentation";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaAuditLogRepository } from "@/lib/database/repositories/audit-logs";

export const dynamic = "force-dynamic";

type AuditDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminAuditDetailPage({
  params,
}: AuditDetailPageProps) {
  await requirePermission("audit.view");
  const { id } = await params;
  const repository = new PrismaAuditLogRepository(prisma);
  const event = await repository.getAuditEventById(id);
  if (!event) notFound();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={event.presentation.label}
        description="Bu kayit salt okunurdur. Ham metadata, token, parola, cookie, IP ve dosya yolu gibi hassas alanlar gosterilmez."
        eyebrow="Audit Detay"
      />

      <section className="grid gap-4 lg:grid-cols-4">
        <InfoCard label="Kategori" value={getAuditCategoryLabel(event.presentation.category)} />
        <InfoCard label="Seviye" value={getAuditSeverityLabel(event.presentation.severity)} />
        <InfoCard label="Sonuc" value={event.presentation.success} />
        <InfoCard label="Zaman" value={formatDate(event.createdAt)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Olay Ozeti</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <Detail label="Actor" value={event.actor?.name ?? "System"} />
            <Detail label="Actor rolu" value={event.actor?.role ?? "-"} />
            <Detail label="Entity" value={event.entityType} />
            <Detail label="Entity ID" value={event.entityId ?? "-"} />
            <Detail label="IP" value={event.ipAddressLabel} />
            <Detail label="Istemci" value={event.userAgentLabel} />
          </dl>
          <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            {event.presentation.summary}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Guvenli Metadata</h2>
          {event.safeMetadata.length ? (
            <dl className="mt-5 space-y-3">
              {event.safeMetadata.map((item) => (
                <div key={`${item.label}-${item.value}`} className="rounded-2xl bg-slate-50 p-3">
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-950">{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-4 text-sm text-slate-600">
              Bu kayit icin gosterilebilir metadata yok.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-950">Iliskili Olaylar</h2>
          <Link href="/admin/audit" className="text-sm font-semibold text-sky-700 hover:text-orange-700">
            Tum loglar
          </Link>
        </div>
        {event.relatedEvents.length ? (
          <div className="mt-4 divide-y divide-slate-100">
            {event.relatedEvents.map((item) => (
              <Link
                key={item.id}
                href={`/admin/audit/${item.id}`}
                className="block py-3 text-sm transition hover:bg-slate-50"
              >
                <span className="font-semibold text-slate-950">{item.presentation.label}</span>
                <span className="ml-2 text-slate-500">{formatDate(item.createdAt)}</span>
                <span className="mt-1 block text-slate-600">{item.presentation.summary}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">Iliskili ek olay bulunmuyor.</p>
        )}
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(date);
}
