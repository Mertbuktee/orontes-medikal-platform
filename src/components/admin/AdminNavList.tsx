"use client";

import Link from "next/link";

import { adminNavItems } from "@/components/admin/admin-navigation";
import { cn } from "@/lib/utils";

type AdminNavListProps = {
  currentPath: string;
  onNavigate?: () => void;
};

export function AdminNavList({ currentPath, onNavigate }: AdminNavListProps) {
  return (
    <ul className="space-y-1.5">
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        const active = isActiveAdminPath(currentPath, item.href);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={cn(
                "group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061423]",
                active &&
                  "bg-orange-500 text-white shadow-lg shadow-orange-950/20 hover:bg-orange-500"
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0 text-sky-200 transition group-hover:text-orange-200",
                  active && "text-white"
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

export function isActiveAdminPath(currentPath: string, href: string) {
  if (href === "/admin/dashboard") {
    return currentPath === "/admin" || currentPath === href;
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
}
