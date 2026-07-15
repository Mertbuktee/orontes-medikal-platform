import { ChevronRight } from "lucide-react";
import Link from "next/link";

const segmentLabels: Record<string, string> = {
  dashboard: "Dashboard",
  "service-requests": "Servis Talepleri",
  customers: "Müşteriler",
  devices: "Cihazlar",
  history: "Servis Geçmişi",
};

type TechnicalBreadcrumbsProps = {
  currentPath: string;
};

export function TechnicalBreadcrumbs({ currentPath }: TechnicalBreadcrumbsProps) {
  const segments = currentPath.split("/").filter(Boolean).slice(1);
  const activeSegments = segments.length ? segments : ["dashboard"];

  return (
    <nav aria-label="Technical breadcrumb" className="hidden sm:block">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
        <li>
          <Link
            href="/technical/dashboard"
            className="rounded-md px-1.5 py-1 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            Teknik
          </Link>
        </li>
        {activeSegments.map((segment, index) => {
          const href = `/technical/${activeSegments.slice(0, index + 1).join("/")}`;
          const label = segmentLabels[segment] ?? "Kayıt";
          const current = index === activeSegments.length - 1;

          return (
            <li key={`${segment}-${index}`} className="flex items-center gap-1">
              <ChevronRight className="size-4" aria-hidden="true" />
              {current ? (
                <span className="font-medium text-slate-900">{label}</span>
              ) : (
                <Link
                  href={href}
                  className="rounded-md px-1.5 py-1 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
