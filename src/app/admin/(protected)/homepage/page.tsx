import { Eye, EyeOff, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { HomepageContentRepository } from "@/lib/database/repositories/homepage-content";

export default async function AdminHomepagePage() {
  await requirePermission("homepage.view");
  const repository = new HomepageContentRepository(prisma);
  const [sections, summary] = await Promise.all([
    repository.listAdminSections(),
    repository.getDashboardSummary(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="İçerik Yönetimi"
        title="Ana Sayfa Yönetimi"
        description="Ana sayfa bölümlerinin görünürlüğünü, sıralamasını, metinlerini ve SEO ayarlarını merkezi olarak yönetin."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Görünür Bölüm" value={summary.visibleCount} icon={Eye} />
        <SummaryCard label="Gizli Bölüm" value={summary.hiddenCount} icon={EyeOff} />
        <SummaryCard
          label="SEO Durumu"
          value={summary.seoConfigured ? "Hazır" : "Eksik"}
          icon={Search}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Link
          href="/admin/homepage/sections"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <SlidersHorizontal className="size-8 text-orange-500" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold text-slate-950">
            Bölümleri Yönet
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Sıralama, görünürlük ve section içeriklerini düzenleyin.
          </p>
        </Link>
        <Link
          href="/admin/homepage/seo"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <Search className="size-8 text-sky-600" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold text-slate-950">
            Ana Sayfa SEO
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Meta başlık, açıklama ve Open Graph görsel ayarlarını yönetin.
          </p>
        </Link>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">
          Bölüm Durumu
        </h2>
        <div className="mt-4 grid gap-3">
          {sections.map((section) => (
            <div
              key={section.key}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div>
                <p className="font-semibold text-slate-950">{section.title}</p>
                <p className="text-xs text-slate-500">
                  #{section.order} · {section.key}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  section.isVisible
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {section.isVisible ? "Görünür" : "Gizli"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof Eye;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="size-7 text-orange-500" aria-hidden="true" />
      <p className="mt-4 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}
