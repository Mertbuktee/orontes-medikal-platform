import { ShieldAlert } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default function AdminForbiddenPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Yetkisiz İşlem"
        description="Bu yönetim alanını görüntülemek için gerekli yetkiye sahip değilsiniz."
      />

      <section className="rounded-3xl border border-orange-100 bg-white p-8 shadow-sm">
        <div className="flex max-w-2xl items-start gap-4">
          <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
            <ShieldAlert className="size-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Erişim izni bulunmuyor
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Hesabınız aktif olsa bile bu modül için ayrıca rol veya izin
              tanımı gerekir. Yetki değişikliği için sistem yöneticisiyle
              görüşün.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
