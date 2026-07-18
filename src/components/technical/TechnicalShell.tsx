"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import type { AdminSessionMode } from "@/lib/auth/admin-session";
import { TechnicalSidebar } from "@/components/technical/TechnicalSidebar";
import { TechnicalTopbar } from "@/components/technical/TechnicalTopbar";
import type { NotificationPreviewItem } from "@/components/panel/NotificationPreviewMenu";

type TechnicalShellProps = {
  children: ReactNode;
  sessionMode: AdminSessionMode;
  unreadNotificationCount?: number;
  unreadNotifications?: NotificationPreviewItem[];
};

export function TechnicalShell({
  children,
  sessionMode,
  unreadNotificationCount = 0,
  unreadNotifications = [],
}: TechnicalShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">
        <TechnicalSidebar currentPath={pathname} />
        <div className="min-w-0 flex-1">
          <TechnicalTopbar
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
