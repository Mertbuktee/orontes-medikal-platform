import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";

import { ForgotPasswordForm } from "@/components/admin/account-security/ForgotPasswordForm";
import { getCurrentAdminSession } from "@/lib/auth/admin-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Şifremi Unuttum | Orontes Admin",
  description: "Orontes Admin parola sıfırlama isteği.",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage() {
  const session = await getCurrentAdminSession();
  if (session) redirect("/admin/dashboard");

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
        <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <KeyRound className="size-6" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          Şifre sıfırlama
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          E-posta adresinizi girin. Hesap aktifse tek kullanımlık sıfırlama
          bağlantısı hazırlanır.
        </p>
        <ForgotPasswordForm />
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
