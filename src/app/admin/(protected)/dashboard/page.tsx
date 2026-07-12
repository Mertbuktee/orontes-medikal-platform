import Link from "next/link";
import {
  ClipboardList,
  Database,
  FileText,
  ImageIcon,
  Settings,
  Wrench,
} from "lucide-react";

import {
  adminQuickActionItems,
  type AdminNavItem,
} from "@/components/admin/admin-navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

const readinessCards = [
  {
    title: "Servis Talepleri",
    description:
      "Web formundan gelen başvurular veritabanına kaydedilir; listeleme, detay, durum ve not akışı aktiftir.",
    state: "Aktif modül",
    icon: ClipboardList,
  },
  {
    title: "İçerik Yönetimi",
    description: "Cihaz, hizmet, blog ve sayfa içerikleri typed model ile ayrıştırıldı.",
    state: "CRUD sonraki aşamada",
    icon: FileText,
  },
  {
    title: "Medya Kütüphanesi",
    description: "Görsel referans mimarisi hazır; admin upload ve optimizasyon sonraki aşamada.",
    state: "Altyapı hazır",
    icon: ImageIcon,
  },
  {
    title: "Sistem Ayarları",
    description: "SEO, site ayarları, roller ve güvenlik sözleşmeleri için temel hazırlandı.",
    state: "Altyapı hazır",
    icon: Settings,
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Yönetim Paneli"
        description="Site içeriği, servis talepleri ve sistem ayarlarını merkezi olarak yönetin."
        eyebrow="Dashboard"
      />

      <section
        aria-labelledby="admin-readiness-title"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        <h2 id="admin-readiness-title" className="sr-only">
          Yönetim paneli hazırlık durumları
        </h2>
        {readinessCards.map(({ icon: Icon, ...card }) => (
          <article
            key={card.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60"
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-950">
              {card.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {card.description}
            </p>
            <p className="mt-4 inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
              {card.state}
            </p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section
          aria-labelledby="recent-activity-title"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Database className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="recent-activity-title" className="text-lg font-semibold text-slate-950">
                Son Aktivite
              </h2>
              <p className="text-sm text-slate-500">
                Audit kayıtları veritabanına yazılır; raporlama ekranı sonraki aşamada açılacak.
              </p>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <Wrench className="mx-auto size-8 text-slate-400" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-slate-700">
              Henüz gösterilecek yönetim paneli aktivitesi bulunmuyor.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="quick-actions-title"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60"
        >
          <h2 id="quick-actions-title" className="text-lg font-semibold text-slate-950">
            Hızlı Aksiyonlar
          </h2>
          <div className="mt-5 grid gap-3">
            {adminQuickActionItems.map((item: AdminNavItem) => {
              const Icon = item.icon;
              const isActive = item.href === "/admin/service-requests";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="size-4 text-sky-700" aria-hidden="true" />
                    {item.title}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-500 shadow-sm">
                    {isActive ? "Aç" : "Yakında"}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
