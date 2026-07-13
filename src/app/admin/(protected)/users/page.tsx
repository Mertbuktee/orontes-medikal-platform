import type { Role } from "@prisma/client";
import { KeyRound, Plus, ShieldCheck, UserCog } from "lucide-react";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaAdminUserRepository } from "@/lib/database/repositories/admin-users";
import { hasPermission } from "@/lib/rbac/permissions";
import { getRoleLabel } from "@/lib/users/user-management-policy";
import { userListSearchParamsSchema } from "@/lib/users/user-management-validation";

export const dynamic = "force-dynamic";

type UsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const session = await requirePermission("users.view");
  const params = await searchParams;
  const parsed = userListSearchParamsSchema.parse({
    page: firstParam(params.page),
    pageSize: firstParam(params.pageSize),
    query: firstParam(params.query),
    role: firstParam(params.role),
    active: firstParam(params.active),
    mfa: firstParam(params.mfa),
    locked: firstParam(params.locked),
    sort: firstParam(params.sort),
  });
  const repository = new PrismaAdminUserRepository(prisma);
  const result = await repository.listAdminUsers(parsed);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Kullanıcılar"
        description="Yönetim paneli kullanıcılarını, rollerini ve hesap durumlarını yönetin."
        eyebrow="Kullanıcı Yönetimi"
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <form className="grid gap-3 md:grid-cols-6" action="/admin/users">
          <input
            name="query"
            defaultValue={parsed.query}
            placeholder="Ad veya e-posta ara"
            className="min-h-11 rounded-2xl border border-slate-200 px-4 text-sm md:col-span-2"
          />
          <select name="role" defaultValue={parsed.role ?? ""} className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm">
            <option value="">Tüm roller</option>
            {(["SUPER_ADMIN", "ADMIN", "EDITOR", "SERVICE_STAFF", "VIEWER"] as Role[]).map((role) => (
              <option key={role} value={role}>{getRoleLabel(role)}</option>
            ))}
          </select>
          <select name="active" defaultValue={parsed.active} className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm">
            <option value="all">Tüm durumlar</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
          </select>
          <select name="locked" defaultValue={parsed.locked} className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm">
            <option value="all">Kilit fark etmez</option>
            <option value="locked">Kilitli</option>
            <option value="unlocked">Kilitli değil</option>
          </select>
          <button className="min-h-11 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
            Filtrele
          </button>
        </form>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {result.total} kullanıcı, sayfa {result.page}/{result.pageCount}
        </p>
        {hasPermission(session.role, "users.create") ? (
          <Link
            href="/admin/users/new"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-orange-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <Plus className="size-4" aria-hidden="true" />
            Yeni Kullanıcı Ekle
          </Link>
        ) : null}
      </div>

      {result.items.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <UserCog className="mx-auto size-10 text-slate-400" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold text-slate-950">
            Henüz yönetim paneli kullanıcısı bulunmuyor.
          </h2>
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-5 py-4">Kullanıcı</th>
                  <th className="px-5 py-4">Rol</th>
                  <th className="px-5 py-4">Durum</th>
                  <th className="px-5 py-4">MFA</th>
                  <th className="px-5 py-4">Oturum</th>
                  <th className="px-5 py-4">Son giriş</th>
                  <th className="px-5 py-4">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.items.map((user) => (
                  <tr key={user.id} className="align-top">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-950">{user.name}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </td>
                    <td className="px-5 py-4">{getRoleLabel(user.role)}</td>
                    <td className="px-5 py-4"><StatusBadge active={user.isActive} locked={Boolean(user.lockedUntil)} /></td>
                    <td className="px-5 py-4">{user.mfaEnabled ? "Aktif" : "Kapalı"}</td>
                    <td className="px-5 py-4">{user.activeSessionCount}</td>
                    <td className="px-5 py-4">{formatDate(user.lastLoginAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50" href={`/admin/users/${user.id}`}>Aç</Link>
                        <Link className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50" href={`/admin/users/${user.id}/edit`}>Düzenle</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-4 lg:hidden">
            {result.items.map((user) => (
              <article key={user.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-950">{user.name}</h2>
                    <p className="break-all text-xs text-slate-500">{user.email}</p>
                  </div>
                  <StatusBadge active={user.isActive} locked={Boolean(user.lockedUntil)} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600">
                  <div><dt className="font-semibold text-slate-950">Rol</dt><dd>{getRoleLabel(user.role)}</dd></div>
                  <div><dt className="font-semibold text-slate-950">Oturum</dt><dd>{user.activeSessionCount}</dd></div>
                  <div><dt className="font-semibold text-slate-950">MFA</dt><dd>{user.mfaEnabled ? "Aktif" : "Kapalı"}</dd></div>
                  <div><dt className="font-semibold text-slate-950">Son giriş</dt><dd>{formatDate(user.lastLoginAt)}</dd></div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold" href={`/admin/users/${user.id}`}>Aç</Link>
                  <Link className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold" href={`/admin/users/${user.id}/edit`}>Düzenle</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatusBadge({ active, locked }: { active: boolean; locked: boolean }) {
  if (locked) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
        <KeyRound className="size-3" aria-hidden="true" /> Kilitli
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
      <ShieldCheck className="size-3" aria-hidden="true" /> {active ? "Aktif" : "Pasif"}
    </span>
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(value)
    : "-";
}
