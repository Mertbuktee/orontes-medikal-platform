"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import type { AdminNotificationPreviewItem } from "@/components/admin/AdminTopbar";
import type { AdminSessionMode } from "@/lib/auth/admin-session";

type AdminShellProps = {
  children: ReactNode;
  sessionMode: AdminSessionMode;
  unreadNotificationCount?: number;
  unreadNotifications?: AdminNotificationPreviewItem[];
};

export function AdminShell({
  children,
  sessionMode,
  unreadNotificationCount = 0,
  unreadNotifications = [],
}: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">
        <AdminSidebar currentPath={pathname} />
        <div className="min-w-0 flex-1">
          <AdminTopbar
            currentPath={pathname}
            sessionMode={sessionMode}
            unreadNotificationCount={unreadNotificationCount}
            unreadNotifications={unreadNotifications}
          />
          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
