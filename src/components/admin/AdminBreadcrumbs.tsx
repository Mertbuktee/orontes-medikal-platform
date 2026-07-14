import Link from "next/link";
import { ChevronRight } from "lucide-react";

const segmentLabels: Record<string, string> = {
  dashboard: "Dashboard",
  "service-requests": "Servis Talepleri",
  devices: "Cihaz Gruplari",
  services: "Hizmetler",
  blog: "Blog",
  media: "Medya",
  homepage: "Ana Sayfa Yonetimi",
  seo: "SEO",
  settings: "Site Ayarlari",
  users: "Kullanicilar",
  roles: "Roller ve Yetkiler",
  audit: "Audit Log",
  "audit-log": "Audit Log",
  security: "Guvenlik Merkezi",
};

type AdminBreadcrumbsProps = {
  currentPath: string;
};

export function AdminBreadcrumbs({ currentPath }: AdminBreadcrumbsProps) {
  const segments = currentPath.split("/").filter(Boolean).slice(1);
  const activeSegments = segments.length ? segments : ["dashboard"];

  return (
    <nav aria-label="Admin breadcrumb" className="hidden sm:block">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
        <li>
          <Link
            href="/admin/dashboard"
            className="rounded-md px-1.5 py-1 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            Admin
          </Link>
        </li>
        {activeSegments.map((segment, index) => {
          const href = `/admin/${activeSegments.slice(0, index + 1).join("/")}`;
          const label = segmentLabels[segment] ?? "Modul";
          const current = index === activeSegments.length - 1;

          return (
            <li key={`${segment}-${index}`} className="flex items-center gap-1">
              <ChevronRight className="size-4" aria-hidden="true" />
              {current ? (
                <span className="font-medium text-slate-900">{label}</span>
              ) : (
                <Link
                  href={href}
                  className="rounded-md px-1.5 py-1 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
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
