import { redirect } from "next/navigation";

export default function LegacyAuditLogRedirectPage() {
  redirect("/admin/audit");
}
