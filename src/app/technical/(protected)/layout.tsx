import { redirect } from "next/navigation";

import { TechnicalShell } from "@/components/technical/TechnicalShell";
import { getCurrentAdminSession } from "@/lib/auth/admin-session";
import { NotificationService } from "@/lib/notifications/notification-service";
import { canAccessTechnicalPanel } from "@/lib/rbac/permissions";

export const dynamic = "force-dynamic";

export default async function ProtectedTechnicalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentAdminSession();

  if (!session) {
    redirect("/technical/login");
  }

  if (!canAccessTechnicalPanel(session.role)) {
    redirect("/technical/forbidden");
  }

  const notificationService = new NotificationService();
  const [unreadNotificationCount, unreadNotifications] = await Promise.all([
    notificationService.getUnreadCount(session.userId),
    notificationService.getUnreadPreview(session.userId, 5),
  ]);

  return (
    <TechnicalShell
      sessionMode={session.mode}
      unreadNotificationCount={unreadNotificationCount}
      unreadNotifications={unreadNotifications.map((item) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        linkUrl: item.linkUrl,
        createdAt: item.createdAt.toISOString(),
      }))}
    >
      {children}
    </TechnicalShell>
  );
}
