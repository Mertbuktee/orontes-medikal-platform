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

  const unreadNotificationCount = await new NotificationService().getUnreadCount(
    session.userId
  );

  return (
    <AdminShell
      sessionMode={session.mode}
      unreadNotificationCount={unreadNotificationCount}
    >
      {children}
    </AdminShell>
  );
}
