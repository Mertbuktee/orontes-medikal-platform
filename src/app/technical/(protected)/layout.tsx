import { redirect } from "next/navigation";

import { TechnicalShell } from "@/components/technical/TechnicalShell";
import { getCurrentAdminSession } from "@/lib/auth/admin-session";
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

  return (
    <TechnicalShell sessionMode={session.mode}>
      {children}
    </TechnicalShell>
  );
}
