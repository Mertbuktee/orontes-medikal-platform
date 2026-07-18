import { updateNotificationPreference } from "@/app/admin/notification-actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaNotificationRepository, isMandatorySecurityCategory } from "@/lib/database/repositories/notifications";

export const dynamic = "force-dynamic";

export default async function AccountNotificationPreferencesPage() {
  const session = await requirePermission("notifications.preferences.manage.own");
  const preferences = await new PrismaNotificationRepository(prisma).getUserPreferences(
    session.userId
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Bildirim Tercihleri"
        description="Kendi admin bildirimlerinizi yönetin. Kritik güvenlik e-postaları kapatılamaz."
        eyebrow="Hesap"
      />

      <section className="grid gap-4">
        {preferences.map((preference) => {
          const mandatory = isMandatorySecurityCategory(preference.category);
          return (
            <form
              key={preference.id}
              action={updateNotificationPreference}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <input type="hidden" name="category" value={preference.category} />
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    {getCategoryLabel(preference.category)}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {mandatory
                      ? "Kritik güvenlik e-postaları zorunludur."
                      : "E-posta ve panel içi bildirim ayrı ayrı yönetilir."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      name="emailEnabled"
                      defaultChecked={preference.emailEnabled}
                      disabled={mandatory}
                    />
                    E-posta
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      name="inAppEnabled"
                      defaultChecked={preference.inAppEnabled}
                    />
                    Panel içi
                  </label>
                  <button className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                    Kaydet
                  </button>
                </div>
              </div>
            </form>
          );
        })}
      </section>
    </div>
  );
}

function getCategoryLabel(category: string) {
  return category
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
