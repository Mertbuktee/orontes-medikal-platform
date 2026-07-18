import Link from "next/link";

import { AdminNavList } from "@/components/admin/AdminNavList";

type AdminSidebarProps = {
  currentPath: string;
};

export function AdminSidebar({ currentPath }: AdminSidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/10 bg-[#061423] text-white lg:flex lg:flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <Link
          href="/admin/dashboard"
          className="flex min-h-11 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061423]"
          aria-label="Orontes yönetim paneli ana sayfası"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-orange-500 text-sm font-bold text-white shadow-lg shadow-orange-500/25">
            O
          </span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-[0.18em] text-orange-200">
              Orontes
            </span>
            <span className="block text-base font-semibold text-white">
              Yönetim Paneli
            </span>
          </span>
        </Link>
      </div>

      <nav
        aria-label="Admin yönetim menüsü"
        className="flex flex-1 overflow-y-auto px-4 py-3"
      >
        <div className="my-auto w-full">
          <AdminNavList currentPath={currentPath} />
        </div>
      </nav>
    </aside>
  );
}
