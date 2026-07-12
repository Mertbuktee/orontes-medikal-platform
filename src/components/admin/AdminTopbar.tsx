import { LogOut } from "lucide-react";

import { AdminBreadcrumbs } from "@/components/admin/AdminBreadcrumbs";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import type { AdminSessionMode } from "@/lib/auth/admin-session";

type AdminTopbarProps = {
  currentPath: string;
  sessionMode: AdminSessionMode;
};

export function AdminTopbar({ currentPath, sessionMode }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <AdminMobileNav currentPath={currentPath} />
          <div className="min-w-0">
            <AdminBreadcrumbs currentPath={currentPath} />
            <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.16em] text-slate-400 lg:hidden">
              Orontes Admin
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {sessionMode === "development-bypass" ? (
            <span className="hidden rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 sm:inline-flex">
              Dev bypass aktif
            </span>
          ) : null}
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900">
              Admin oturumu
            </p>
            <p className="text-xs text-slate-500">
              Gerçek kimlik doğrulama bekleniyor
            </p>
          </div>
          <button
            type="button"
            disabled
            aria-label="Çıkış özelliği sonraki aşamada etkinleşecek"
            className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-400"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
