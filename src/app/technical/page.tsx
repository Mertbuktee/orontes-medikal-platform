import { redirect } from "next/navigation";

import { getCurrentAdminSession } from "@/lib/auth/admin-session";
import { canAccessTechnicalPanel } from "@/lib/rbac/permissions";

export default async function TechnicalIndexPage() {
  const session = await getCurrentAdminSession();

  if (!session) {
    redirect("/technical/login");
  }

  if (!canAccessTechnicalPanel(session.role)) {
    redirect("/technical/forbidden");
  }

  redirect("/technical/dashboard");
}
