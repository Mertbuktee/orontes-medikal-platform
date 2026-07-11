import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: LegalSection[];
};

export default function LegalPage({
  eyebrow,
  title,
  description,
  sections,
}: LegalPageProps) {
  return (
    <section className="relative overflow-hidden bg-slate-50 px-6 py-16 sm:px-8 lg:px-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-0 top-0 size-80 rounded-full bg-sky-200/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-200 hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Ana Sayfaya Dön
        </Link>

        <header className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">
            <FileText className="size-4" aria-hidden="true" />
            {eyebrow}
          </div>
          <h1 className="mt-5 text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-600">{description}</p>
          <p className="mt-5 text-sm font-medium text-slate-500">
            Son güncelleme: 10 Temmuz 2026
          </p>
        </header>

        <div className="mt-6 space-y-4">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold text-slate-950">{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-sm leading-7 text-slate-600">
                  {paragraph}
                </p>
              ))}
              {section.items ? (
                <ul className="mt-4 space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-7 text-slate-600">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-orange-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
