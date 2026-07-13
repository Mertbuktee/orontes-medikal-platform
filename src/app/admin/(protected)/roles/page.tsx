import type { Permission, Role } from "@/lib/rbac/permissions";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaAdminUserRepository } from "@/lib/database/repositories/admin-users";
import { permissions, rolePermissions, roles } from "@/lib/rbac/permissions";
import { getRoleDescription, getRoleLabel } from "@/lib/users/user-management-policy";

export const dynamic = "force-dynamic";

const permissionGroups: Array<{
  title: string;
  permissions: Permission[];
}> = [
  { title: "Dashboard", permissions: ["dashboard.view"] },
  {
    title: "Servis Talepleri",
    permissions: [
      "serviceRequests.view",
      "serviceRequests.update",
      "serviceRequests.assign",
      "serviceRequests.notes.create",
      "serviceRequests.attachments.view",
      "serviceRequests.archive",
      "serviceRequests.delete",
    ],
  },
  { title: "Medya", permissions: ["media.view", "media.upload", "media.update", "media.delete"] },
  {
    title: "Hero Slider",
    permissions: ["heroSlides.view", "heroSlides.create", "heroSlides.update", "heroSlides.reorder", "heroSlides.publish", "heroSlides.delete"],
  },
  {
    title: "Cihazlar",
    permissions: ["devices.view", "devices.create", "devices.update", "devices.reorder", "devices.publish", "devices.seo.manage", "devices.delete"],
  },
  {
    title: "Hizmetler",
    permissions: ["services.view", "services.create", "services.update", "services.reorder", "services.publish", "services.seo.manage", "services.delete"],
  },
  {
    title: "Ana Sayfa",
    permissions: ["homepage.view", "homepage.update", "homepage.reorder", "homepage.publish", "homepage.seo.manage"],
  },
  {
    title: "Blog",
    permissions: ["blog.view", "blog.create", "blog.update", "blog.publish", "blog.schedule", "blog.categories.manage", "blog.seo.manage", "blog.delete"],
  },
  {
    title: "Site Ayarları",
    permissions: ["settings.view", "settings.update", "settings.seo.manage", "seo.manage"],
  },
  {
    title: "Kullanıcılar",
    permissions: [
      "users.view",
      "users.create",
      "users.update",
      "users.activate",
      "users.deactivate",
      "users.assignRole",
      "users.sessions.revoke",
      "users.password.forceReset",
      "users.manage",
    ],
  },
  { title: "Audit / Güvenlik", permissions: ["audit.view", "roles.view", "roles.manage"] },
  { title: "Hesap Güvenliği", permissions: ["account.security.manage", "sessions.manage.own", "mfa.manage.own"] },
];

const sensitivePermissions = new Set<Permission>([
  "users.create",
  "users.deactivate",
  "users.assignRole",
  "users.sessions.revoke",
  "users.password.forceReset",
  "roles.manage",
  "settings.update",
  "settings.seo.manage",
  "audit.view",
]);

export default async function AdminRolesPage() {
  await requirePermission("roles.view");
  const repository = new PrismaAdminUserRepository(prisma);
  const counts = await repository.getRoleUserCounts();
  const countByRole = new Map<Role, number>(
    counts.map((count) => [count.role as Role, count._count.role])
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Roller ve Yetkiler"
        description="Sabit sistem rollerinin etkili izinlerini ve aktif kullanıcı sayılarını inceleyin."
        eyebrow="RBAC"
      />

      <section className="rounded-3xl border border-orange-100 bg-orange-50 p-5 text-sm leading-6 text-orange-950">
        Bu aşamada roller kod tanımlıdır ve admin panelinden düzenlenmez. Custom role, permission override veya database-backed permission editing ayrı bir enterprise identity tasarımı gerektirir.
      </section>

      <div className="grid gap-4">
        {roles.map((role) => {
          const effective = new Set(rolePermissions[role]);
          return (
            <section key={role} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">{getRoleLabel(role)}</h2>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{getRoleDescription(role)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <span className="font-semibold text-slate-950">{effective.size}</span> izin ·{" "}
                  <span className="font-semibold text-slate-950">{countByRole.get(role) ?? 0}</span> aktif kullanıcı
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {permissionGroups.map((group) => {
                  const groupPermissions = group.permissions.filter((permission) =>
                    permissions.includes(permission)
                  );
                  const granted = groupPermissions.filter((permission) => effective.has(permission));
                  if (granted.length === 0) return null;
                  return (
                    <div key={group.title} className="rounded-2xl border border-slate-200 p-4">
                      <h3 className="text-sm font-semibold text-slate-950">{group.title}</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {granted.map((permission) => (
                          <span
                            key={permission}
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              sensitivePermissions.has(permission)
                                ? "bg-rose-50 text-rose-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
