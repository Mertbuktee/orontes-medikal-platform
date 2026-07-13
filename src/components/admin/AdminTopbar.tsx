import { LogOut, UserCog } from "lucide-react";
import Link from "next/link";

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
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900">
              Admin oturumu
            </p>
            <p className="text-xs text-slate-500">
              {sessionMode === "authenticated"
                ? "Guvenli oturum aktif"
                : "Oturum durumu bilinmiyor"}
            </p>
          </div>
          <Link
            href="/admin/account/security"
            aria-label="Hesap güvenliği"
            className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <UserCog className="size-4" aria-hidden="true" />
          </Link>
          <form action="/admin/auth/logout" method="post">
            <button
              type="submit"
              aria-label="Admin oturumundan cikis yap"
              className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
