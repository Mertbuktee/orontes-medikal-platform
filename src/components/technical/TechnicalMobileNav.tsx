"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { TechnicalNavList } from "@/components/technical/TechnicalNavList";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type TechnicalMobileNavProps = {
  currentPath: string;
};

export function TechnicalMobileNav({ currentPath }: TechnicalMobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Teknik menüyü aç"
        className="inline-flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="left" className="bg-[#07131f] text-white">
        <SheetTitle className="sr-only">Teknik operasyon menüsü</SheetTitle>
        <SheetDescription className="sr-only">
          Orontes teknik operasyon paneli bağlantıları
        </SheetDescription>
        <div className="pr-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
            Orontes
          </p>
          <p className="mt-1 text-lg font-semibold text-white">
            Teknik Operasyon
          </p>
        </div>
        <nav aria-label="Mobil teknik menü" className="mt-6">
          <TechnicalNavList
            currentPath={currentPath}
            onNavigate={() => setOpen(false)}
          />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
