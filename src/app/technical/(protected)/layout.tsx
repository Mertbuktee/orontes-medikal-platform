import { redirect } from "next/navigation";

import { TechnicalShell } from "@/components/technical/TechnicalShell";
import { requireAdminSession } from "@/lib/auth/admin-session";
import { NotificationService } from "@/lib/notifications/notification-service";
import { canAccessTechnicalPanel } from "@/lib/rbac/permissions";

export const dynamic = "force-dynamic";

export default async function ProtectedTechnicalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireAdminSession();

  if (!canAccessTechnicalPanel(session.role)) {
    redirect("/admin/forbidden");
  }

  const unreadNotificationCount = await new NotificationService().getUnreadCount(
    session.userId
  );

  return (
    <TechnicalShell
      sessionMode={session.mode}
      unreadNotificationCount={unreadNotificationCount}
    >
      {children}
    </TechnicalShell>
  );
}
