import type { Role } from "@prisma/client";

import { createAdminUser } from "../actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { getAssignableRolesForActor, getRoleDescription, getRoleLabel } from "@/lib/users/user-management-policy";

export const dynamic = "force-dynamic";

export default async function NewAdminUserPage() {
  const session = await requirePermission("users.create");
  const roles = getAssignableRolesForActor(session);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Yeni Kullanıcı"
        description="Yönetim paneli için güvenli kurulum bağlantısıyla yeni kullanıcı oluşturun."
        eyebrow="Kullanıcı Yönetimi"
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <form action={createAdminUser} className="grid gap-5 lg:grid-cols-2">
          <Field label="Ad Soyad" name="name" required />
          <Field label="E-posta" name="email" type="email" autoComplete="email" required />

          <label className="grid gap-2 text-sm font-semibold text-slate-950">
            Rol
            <select name="role" required className="min-h-11 rounded-2xl border border-slate-200 px-4 text-sm">
              {roles.map((role) => (
                <option key={role} value={role}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-950">
            <input name="isActive" type="checkbox" defaultChecked className="size-4 accent-orange-500" />
            Aktif hesap oluştur
          </label>

          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm leading-6 text-orange-950 lg:col-span-2">
            Kullanıcıya kalıcı şifre verilmez. Sistem tek kullanımlık parola kurulum bağlantısı üretir ve mevcut e-posta altyapısı üzerinden gönderir. Production mail provider yoksa teslimat uyarısı admin detayında görünür.
          </div>

          <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 lg:col-span-2">
            <p className="font-semibold text-slate-950">Seçilebilir roller</p>
            {roles.map((role: Role) => (
              <p key={role}>
                <span className="font-semibold text-slate-800">{getRoleLabel(role)}:</span>{" "}
                {getRoleDescription(role)}
              </p>
            ))}
          </div>

          <button className="min-h-11 rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 lg:col-span-2">
            Kullanıcı Oluştur
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
  autoComplete,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-950">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="min-h-11 rounded-2xl border border-slate-200 px-4 text-sm"
      />
    </label>
  );
}
