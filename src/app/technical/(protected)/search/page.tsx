import { Search } from "lucide-react";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { searchTechnicalPanel, type PanelSearchSection } from "@/lib/search/panel-search";

type TechnicalSearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export default async function TechnicalSearchPage({
  searchParams,
}: TechnicalSearchPageProps) {
  const session = await requirePermission("dashboard.view");
  const params = await searchParams;
  const query = getParam(params.q)?.trim().slice(0, 120) ?? "";
  const sections = query ? await searchTechnicalPanel(prisma, session.role, query) : [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Teknik Arama"
        title="Teknik Panel Araması"
        description="Servis talepleri, müşteriler, cihazlar ve servis geçmişinde hızlı arama yapın."
      />

      <SearchForm query={query} />
      <SearchResults query={query} sections={sections} />
    </div>
  );
}

function SearchForm({ query }: { query: string }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <form action="/technical/search" className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="technical-panel-search-query">
          Arama
        </label>
        <div className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
          <Search className="size-4 text-slate-400" aria-hidden="true" />
          <input
            id="technical-panel-search-query"
            name="q"
            defaultValue={query}
            maxLength={120}
            placeholder="Talep no, müşteri, cihaz, telefon veya servis geçmişi ara"
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
          />
        </div>
        <button
          type="submit"
          className="min-h-12 rounded-2xl bg-cyan-500 px-5 text-sm font-semibold text-slate-950 shadow-sm shadow-cyan-500/20 transition hover:bg-cyan-400"
        >
          Ara
        </button>
      </form>
    </section>
  );
}

function SearchResults({
  query,
  sections,
}: {
  query: string;
  sections: PanelSearchSection[];
}) {
  if (!query) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <Search className="mx-auto size-10 text-slate-400" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-semibold text-slate-950">
          Aramak için bir kelime yazın.
        </h2>
      </section>
    );
  }

  if (!sections.length) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h2 className="text-lg font-semibold text-slate-950">
          Teknik panelde sonuç bulunamadı.
        </h2>
        <p className="mt-2 text-sm text-slate-500">Arama: {query}</p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <section
          key={section.key}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-950">{section.title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {section.results.length} sonuç
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {section.results.map((result) => (
              <Link
                key={`${section.key}-${result.id}`}
                href={result.href}
                className="block px-5 py-4 transition hover:bg-slate-50"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800">
                    {result.type}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-950">
                    {result.title}
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {result.description || "Ek açıklama yok"}
                </p>
                {result.updatedAt ? (
                  <p className="mt-1 text-xs text-slate-400">
                    Güncelleme: {formatDate(result.updatedAt)}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
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
