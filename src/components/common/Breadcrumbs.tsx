import Link from "next/link";

import { createBreadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo/structured-data";

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = createBreadcrumbJsonLd(items);

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <li key={item.path} className="flex items-center gap-2">
                {index > 0 && <span aria-hidden="true">/</span>}
                {isLast ? (
                  <span className="font-medium text-slate-700">{item.name}</span>
                ) : (
                  <Link
                    href={item.path}
                    className="inline-flex min-h-10 items-center transition hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
