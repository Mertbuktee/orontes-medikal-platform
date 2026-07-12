import { Settings } from "lucide-react";

import { adminNavItems } from "@/components/admin/admin-navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

type AdminModulePageProps = {
  params: Promise<{
    module?: string[];
  }>;
};

export default async function AdminModulePlaceholderPage({
  params,
}: AdminModulePageProps) {
  const { module = [] } = await params;
  const href = `/admin/${module.join("/")}`;
  const navItem = adminNavItems.find((item) => item.href === href);
  const title = navItem?.title ?? "Admin Modülü";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={title}
        description="Bu modül sonraki aşamada gerçek veritabanı, yetki kontrolü ve CRUD akışlarıyla etkinleştirilecektir."
        eyebrow="Yakında"
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <div className="flex max-w-2xl flex-col gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-700">
            <Settings className="size-6" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Modül altyapısı hazır
          </h2>
          <p className="text-sm leading-7 text-slate-600">
            Sayfa kırık link üretmemek için bilinçli olarak placeholder halinde
            tutuluyor. Gerçek veri modeli, form validasyonu, server-side yetki
            kontrolü ve audit kayıtları admin CRUD aşamasında eklenecek.
          </p>
        </div>
      </section>
    </div>
  );
}
