import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminSession } from "@/lib/auth/admin-session";
import { NotificationService } from "@/lib/notifications/notification-service";
import { canAccessAdminPanel } from "@/lib/rbac/permissions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireAdminSession();

  if (!canAccessAdminPanel(session.role)) {
    redirect("/technical/dashboard");
  }

  const notificationService = new NotificationService();
  const [unreadNotificationCount, unreadNotifications] = await Promise.all([
    notificationService.getUnreadCount(session.userId),
    notificationService.getUnreadPreview(session.userId, 5),
  ]);

  return (
    <AdminShell
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
    </AdminShell>
  );
}
