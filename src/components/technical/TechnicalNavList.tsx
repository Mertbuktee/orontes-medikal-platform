"use client";

import Link from "next/link";

import { technicalNavItems } from "@/components/technical/technical-navigation";
import { cn } from "@/lib/utils";

type TechnicalNavListProps = {
  currentPath: string;
  onNavigate?: () => void;
};

export function TechnicalNavList({
  currentPath,
  onNavigate,
}: TechnicalNavListProps) {
  return (
    <ul className="space-y-1.5">
      {technicalNavItems.map((item) => {
        const Icon = item.icon;
        const active = isActiveTechnicalPath(currentPath, item.href);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={cn(
                "group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07131f]",
                active &&
                  "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-950/20 hover:bg-cyan-500"
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0 text-cyan-200 transition group-hover:text-white",
                  active && "text-slate-950"
                )}
                aria-hidden="true"
              />
              <span>{item.title}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function isActiveTechnicalPath(currentPath: string, href: string) {
  if (href === "/technical/dashboard") {
    return currentPath === "/technical" || currentPath === href;
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
}
