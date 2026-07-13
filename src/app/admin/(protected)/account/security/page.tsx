import type { Metadata } from "next";
import { Clock, KeyRound, ShieldCheck, Smartphone } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PasswordChangeForm } from "@/components/admin/account-security/PasswordChangeForm";
import {
  revokeAllOwnSessions,
  revokeOtherOwnSessions,
  revokeOwnSession,
} from "@/app/admin/account-security-actions";
import { requireAdminSession } from "@/lib/auth/admin-session";
import { AccountSecurityRepository } from "@/lib/auth/account-security-repository";
import { prisma } from "@/lib/database/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hesap Güvenliği | Orontes Admin",
  robots: { index: false, follow: false },
};

export default async function AccountSecurityPage() {
  const session = await requireAdminSession();
  const repository = new AccountSecurityRepository(prisma);
  const [user, sessions] = await Promise.all([
    repository.getUserSecurityRecord(session.userId),
    repository.listOwnSessions(session.userId, session.id),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Hesap Güvenliği"
        description="Şifre, aktif oturumlar ve iki aşamalı doğrulama hazırlıklarını yönetin."
        eyebrow="Account Security"
      />

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              <KeyRound className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Şifre</h2>
              <p className="text-sm text-slate-500">
                En az 12, en fazla 128 karakter.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <PasswordChangeForm />
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <Clock className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Aktif Oturumlar
              </h2>
              <p className="text-sm text-slate-500">
                Yalnızca kendi oturumlarınızı yönetebilirsiniz.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {sessions.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {summarizeUserAgent(item.userAgent)}
                      {item.isCurrent ? (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                          Mevcut oturum
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.remembered ? "Beni hatırla" : "Standart oturum"} ·
                      Son aktivite: {formatDate(item.lastSeenAt ?? item.createdAt)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Bitiş: {formatDate(item.expiresAt)}
                      {item.ipAddress ? ` · IP: ${item.ipAddress}` : ""}
                    </p>
                  </div>
                  <form action={revokeOwnSession}>
                    <input type="hidden" name="sessionId" value={item.id} />
                    <button
                      type="submit"
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-red-200 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      İptal Et
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <form action={revokeOtherOwnSessions}>
              <button className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
                Diğer Oturumları İptal Et
              </button>
            </form>
            <form action={revokeAllOwnSessions}>
              <button className="min-h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                Tüm Oturumları İptal Et
              </button>
            </form>
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Smartphone className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                İki Aşamalı Doğrulama
              </h2>
              <p className="text-sm text-slate-500">
                Durum: {user?.mfaEnabled ? "Açık" : "Kapalı"}
              </p>
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
            MFA veritabanı, encryption ve recovery-code temeli hazırlandı.
            TOTP doğrulama/enforcement için güvenli kütüphane onayı ve production
            encryption key kurulumu sonraki hardening aşamasında etkinleştirilecek.
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Güvenlik Bilgileri
              </h2>
              <p className="text-sm text-slate-500">
                Hassas bilgiler client tarafına gönderilmez.
              </p>
            </div>
          </div>
          <dl className="mt-5 grid gap-3 text-sm">
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="font-semibold text-slate-900">Rol</dt>
              <dd className="mt-1 text-slate-600">{user?.role ?? session.role}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="font-semibold text-slate-900">Son şifre değişimi</dt>
              <dd className="mt-1 text-slate-600">
                {user?.passwordChangedAt ? formatDate(user.passwordChangedAt) : "Kayıt yok"}
              </dd>
            </div>
          </dl>
        </article>
      </section>
    </div>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function summarizeUserAgent(value: string | null) {
  if (!value) return "Bilinmeyen tarayıcı";
  if (value.includes("Chrome")) return "Chrome tabanlı tarayıcı";
  if (value.includes("Firefox")) return "Firefox";
  if (value.includes("Safari")) return "Safari";
  return "Admin oturumu";
}
