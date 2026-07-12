"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { AdminNavList } from "@/components/admin/AdminNavList";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type AdminMobileNavProps = {
  currentPath: string;
};

export function AdminMobileNav({ currentPath }: AdminMobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Admin menüsünü aç"
        className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="left" className="bg-[#061423] text-white">
        <SheetTitle className="sr-only">Admin menüsü</SheetTitle>
        <SheetDescription className="sr-only">
          Orontes yönetim paneli modül bağlantıları
        </SheetDescription>
        <div className="pr-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-200">
            Orontes
          </p>
          <p className="mt-1 text-lg font-semibold text-white">
            Yönetim Paneli
          </p>
        </div>
        <nav aria-label="Mobil admin menüsü" className="mt-6">
          <AdminNavList
            currentPath={currentPath}
            onNavigate={() => setOpen(false)}
          />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
