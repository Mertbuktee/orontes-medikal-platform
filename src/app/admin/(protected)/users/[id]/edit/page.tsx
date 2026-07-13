import { notFound, redirect } from "next/navigation";

import { updateAdminUser } from "../../actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaAdminUserRepository } from "@/lib/database/repositories/admin-users";
import { canManageUser, getAssignableRolesForActor, getRoleDescription, getRoleLabel } from "@/lib/users/user-management-policy";

export const dynamic = "force-dynamic";

type EditUserPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditAdminUserPage({ params }: EditUserPageProps) {
  const session = await requirePermission("users.update");
  const { id } = await params;
  const repository = new PrismaAdminUserRepository(prisma);
  const user = await repository.getAdminUserById(id);
  if (!user) notFound();
  const activeSuperAdminCount = await repository.countActiveSuperAdmins();
  if (!canManageUser(session, user, "update", { activeSuperAdminCount })) {
    redirect("/admin/forbidden");
  }

  const roles = getAssignableRolesForActor(session);
  const canKeepCurrentRole = roles.includes(user.role);
  const visibleRoles = canKeepCurrentRole ? roles : [user.role, ...roles];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Kullanıcıyı Düzenle"
        description={`${user.name} hesabının profil ve rol bilgilerini güncelleyin.`}
        eyebrow="Kullanıcı Yönetimi"
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <form action={updateAdminUser} className="grid gap-5 lg:grid-cols-2">
          <input type="hidden" name="id" value={user.id} />
          <Field label="Ad Soyad" name="name" defaultValue={user.name} required />
          <Field label="E-posta" name="email" type="email" defaultValue={user.email} required />

          <label className="grid gap-2 text-sm font-semibold text-slate-950">
            Rol
            <select name="role" defaultValue={user.role} required className="min-h-11 rounded-2xl border border-slate-200 px-4 text-sm">
              {visibleRoles.map((role) => (
                <option key={role} value={role} disabled={!roles.includes(role)}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-950">Mevcut durum</p>
            <p>{user.isActive ? "Aktif" : "Pasif"} · {user.mfaEnabled ? "MFA aktif" : "MFA kapalı"}</p>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm leading-6 text-orange-950 lg:col-span-2">
            Rol değişikliği hedef kullanıcının aktif oturumlarını iptal eder. Kendi rolünüzü değiştiremezsiniz ve son aktif SUPER_ADMIN korunur.
          </div>

          <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 lg:col-span-2">
            <p className="font-semibold text-slate-950">Rol açıklamaları</p>
            {visibleRoles.map((role) => (
              <p key={role}>
                <span className="font-semibold text-slate-800">{getRoleLabel(role)}:</span>{" "}
                {getRoleDescription(role)}
              </p>
            ))}
          </div>

          <button className="min-h-11 rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 lg:col-span-2">
            Kaydet
          </button>
        </form>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-950">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="min-h-11 rounded-2xl border border-slate-200 px-4 text-sm"
      />
    </label>
  );
}
