import { LogOut } from "lucide-react";

import type { AdminSessionMode } from "@/lib/auth/admin-session";
import { PanelSwitcher } from "@/components/technical/PanelSwitcher";
import { TechnicalBreadcrumbs } from "@/components/technical/TechnicalBreadcrumbs";
import { TechnicalMobileNav } from "@/components/technical/TechnicalMobileNav";

type TechnicalTopbarProps = {
  currentPath: string;
  sessionMode: AdminSessionMode;
};

export function TechnicalTopbar({
  currentPath,
  sessionMode,
}: TechnicalTopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <TechnicalMobileNav currentPath={currentPath} />
          <div className="min-w-0">
            <TechnicalBreadcrumbs currentPath={currentPath} />
            <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.16em] text-slate-400 lg:hidden">
              Orontes Teknik
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <PanelSwitcher active="technical" />
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900">
              Teknik oturum
            </p>
            <p className="text-xs text-slate-500">
              {sessionMode === "authenticated"
                ? "Güvenli oturum aktif"
                : "Oturum durumu bilinmiyor"}
            </p>
          </div>
          <form action="/admin/auth/logout" method="post">
            <button
              type="submit"
              aria-label="Teknik oturumdan çıkış yap"
              className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
