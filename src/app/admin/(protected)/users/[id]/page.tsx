import { KeyRound, Pencil, RotateCcw, ShieldCheck, UserX, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  activateAdminUser,
  assignAdminUserRole,
  clearAdminUserLock,
  deactivateAdminUser,
  forceAdminUserPasswordReset,
  revokeAdminUserSession,
  revokeAllAdminUserSessions,
} from "../actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaAdminUserRepository } from "@/lib/database/repositories/admin-users";
import { hasPermission } from "@/lib/rbac/permissions";
import {
  canManageUser,
  getAssignableRolesForActor,
  getRoleDescription,
  getRoleLabel,
} from "@/lib/users/user-management-policy";

export const dynamic = "force-dynamic";

type UserDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminUserDetailPage({ params }: UserDetailPageProps) {
  const session = await requirePermission("users.view");
  const { id } = await params;
  const repository = new PrismaAdminUserRepository(prisma);
  const user = await repository.getAdminUserById(id);
  if (!user) notFound();

  const activeSuperAdminCount = await repository.countActiveSuperAdmins();
  const auditEvents = await repository.listRecentUserAuditEvents(user.id);
  const canUpdate = hasPermission(session.role, "users.update") && canManageUser(session, user, "update");
  const canDeactivate =
    hasPermission(session.role, "users.deactivate") &&
    canManageUser(session, user, "deactivate", { activeSuperAdminCount });
  const canActivate =
    hasPermission(session.role, "users.activate") &&
    canManageUser(session, user, "activate");
  const canForceReset =
    hasPermission(session.role, "users.password.forceReset") &&
    canManageUser(session, user, "forcePasswordReset");
  const canRevokeSessions =
    hasPermission(session.role, "users.sessions.revoke") &&
    canManageUser(session, user, "revokeSessions");
  const assignableRoles = getAssignableRolesForActor(session);
  const canAssignRole =
    hasPermission(session.role, "users.assignRole") &&
    assignableRoles.some((role) =>
      canManageUser(session, user, "assignRole", {
        nextRole: role,
        activeSuperAdminCount,
      })
    );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={user.name}
        description={`${getRoleLabel(user.role)} rolündeki yönetim paneli kullanıcısı.`}
        eyebrow="Kullanıcı Detayı"
      />

      <div className="flex flex-wrap gap-3">
        {canUpdate ? <ActionLink href={`/admin/users/${user.id}/edit`} icon={Pencil} label="Düzenle" /> : null}
        {canForceReset ? (
          <form action={forceAdminUserPasswordReset}>
            <input type="hidden" name="id" value={user.id} />
            <ActionButton icon={RotateCcw} label="Parola Sıfırlamayı Zorla" />
          </form>
        ) : null}
        {canRevokeSessions ? (
          <form action={revokeAllAdminUserSessions}>
            <input type="hidden" name="id" value={user.id} />
            <ActionButton icon={KeyRound} label="Tüm Oturumları İptal Et" />
          </form>
        ) : null}
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <InfoCard title="Hesap" items={[
          ["E-posta", user.email],
          ["Rol", getRoleLabel(user.role)],
          ["Rol açıklaması", getRoleDescription(user.role)],
          ["Durum", user.isActive ? "Aktif" : "Pasif"],
          ["Son giriş", formatDate(user.lastLoginAt)],
        ]} />
        <InfoCard title="Güvenlik" items={[
          ["MFA", user.mfaEnabled ? "Aktif" : "Kapalı"],
          ["MFA doğrulama", formatDate(user.mfaVerifiedAt)],
          ["Başarısız giriş", String(user.failedLoginCount)],
          ["Kilit", user.lockedUntil ? formatDate(user.lockedUntil) : "Yok"],
          ["Security version", String(user.securityVersion)],
        ]} />
        <InfoCard title="Operasyon" items={[
          ["Aktif oturum", String(user.activeSessionCount)],
          ["Açık atama", String(user.activeAssignedRequestCount)],
          ["Oluşturulma", formatDate(user.createdAt)],
          ["Güncellenme", formatDate(user.updatedAt)],
          ["Şifre değişimi", formatDate(user.passwordChangedAt)],
        ]} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Aktif Oturumlar</h2>
          <div className="mt-4 grid gap-3">
            {user.adminSessions.length === 0 ? (
              <p className="text-sm text-slate-500">Aktif oturum bulunmuyor.</p>
            ) : (
              user.adminSessions.map((adminSession) => (
                <article key={adminSession.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{adminSession.clientSummary}</p>
                      <p className="text-xs text-slate-500">
                        Oluşturuldu: {formatDate(adminSession.createdAt)} · Son görülme: {formatDate(adminSession.lastSeenAt)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Bitiş: {formatDate(adminSession.expiresAt)} · {adminSession.remembered ? "Remember Me" : "Standart"}
                      </p>
                    </div>
                    {canRevokeSessions ? (
                      <form action={revokeAdminUserSession}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="sessionId" value={adminSession.id} />
                        <button className="min-h-10 rounded-xl border border-rose-200 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                          İptal Et
                        </button>
                      </form>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Hesap Durumu</h2>
            {user.isActive ? (
              canDeactivate ? (
                <form action={deactivateAdminUser} className="mt-4 grid gap-3">
                  <input type="hidden" name="id" value={user.id} />
                  <textarea name="reason" required minLength={5} maxLength={1000} placeholder="Pasife alma nedeni" className="min-h-24 rounded-2xl border border-slate-200 p-3 text-sm" />
                  <ActionButton icon={UserX} label="Kullanıcıyı Pasife Al" danger />
                </form>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Bu hesabı pasife alma yetkiniz yok.</p>
              )
            ) : canActivate ? (
              <form action={activateAdminUser} className="mt-4">
                <input type="hidden" name="id" value={user.id} />
                <ActionButton icon={ShieldCheck} label="Kullanıcıyı Aktifleştir" />
              </form>
            ) : null}
          </div>

          {user.lockedUntil && canUpdate ? (
            <form action={clearAdminUserLock} className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <input type="hidden" name="id" value={user.id} />
              <h2 className="text-sm font-semibold text-amber-950">Hesap kilitli</h2>
              <p className="mt-2 text-sm text-amber-800">Kilit durumunu sadece yetkili kullanıcı temizleyebilir.</p>
              <button className="mt-4 min-h-10 rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white">
                Kilidi Temizle
              </button>
            </form>
          ) : null}

          {canAssignRole ? (
            <form action={assignAdminUserRole} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <input type="hidden" name="id" value={user.id} />
              <h2 className="text-lg font-semibold text-slate-950">Rol Ata</h2>
              <select name="role" defaultValue={user.role} className="mt-4 min-h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm">
                {assignableRoles.map((role) => (
                  <option key={role} value={role}>
                    {getRoleLabel(role)}
                  </option>
                ))}
              </select>
              <button className="mt-3 min-h-10 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white">
                Rolü Güncelle
              </button>
            </form>
          ) : null}
        </aside>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Etkili Yetkiler</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {user.effectivePermissions.map((permission) => (
            <span key={permission} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {permission}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Son Aktivite</h2>
        <div className="mt-4 grid gap-3">
          {auditEvents.length === 0 ? (
            <p className="text-sm text-slate-500">Bu kullanıcıyla ilişkili audit kaydı bulunmuyor.</p>
          ) : (
            auditEvents.map((event) => (
              <div key={event.id} className="rounded-2xl border border-slate-200 p-4 text-sm">
                <p className="font-semibold text-slate-950">{event.action} · {event.entityType}</p>
                <p className="text-slate-500">
                  {formatDate(event.createdAt)} · Aktör: {event.actor?.name ?? "Sistem"}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function InfoCard({ title, items }: { title: string; items: Array<[string, string]> }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <dl className="mt-4 grid gap-3 text-sm">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</dt>
            <dd className="mt-1 break-words text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ActionLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50">
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

function ActionButton({ icon: Icon, label, danger }: { icon: LucideIcon; label: string; danger?: boolean }) {
  return (
    <button className={`inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold shadow-sm ${danger ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-orange-500 text-white hover:bg-orange-600"}`}>
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(value)
    : "-";
}
