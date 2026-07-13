import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";

import { ResetPasswordForm } from "@/components/admin/account-security/ResetPasswordForm";
import { resetTokenSchema } from "@/lib/auth/account-security-validation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Yeni Şifre Belirle | Orontes Admin",
  description: "Orontes Admin parola sıfırlama ekranı.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const tokenParam = (await searchParams).token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
  const parsed = resetTokenSchema.safeParse(token);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
        <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <KeyRound className="size-6" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          Yeni şifre belirle
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Bağlantı tek kullanımlıktır ve kısa süre içinde geçerliliğini
          kaybeder.
        </p>
        {parsed.success ? (
          <ResetPasswordForm token={parsed.data} />
        ) : (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            Parola sıfırlama bağlantısı geçersiz veya eksik.
          </div>
        )}
        <Link
          href="/admin/login"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          Giriş ekranına dön
        </Link>
      </section>
    </main>
  );
}
