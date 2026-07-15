import Link from "next/link";

import { TechnicalNavList } from "@/components/technical/TechnicalNavList";

type TechnicalSidebarProps = {
  currentPath: string;
};

export function TechnicalSidebar({ currentPath }: TechnicalSidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/10 bg-[#07131f] text-white lg:flex lg:flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <Link
          href="/technical/dashboard"
          className="flex min-h-11 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07131f]"
          aria-label="Orontes teknik operasyon ana sayfası"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-cyan-400 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20">
            T
          </span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
              Orontes
            </span>
            <span className="block text-base font-semibold text-white">
              Teknik Operasyon
            </span>
          </span>
        </Link>
      </div>

      <nav
        aria-label="Teknik operasyon menüsü"
        className="flex-1 overflow-y-auto px-4 py-5"
      >
        <TechnicalNavList currentPath={currentPath} />
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
            Operasyon
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Servis talepleri, müşteri kayıtları, cihazlar ve tamamlanan servis
            geçmişi tek teknik akışta izlenir.
          </p>
        </div>
      </div>
    </aside>
  );
}
