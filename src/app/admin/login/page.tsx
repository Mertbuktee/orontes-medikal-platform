import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getCurrentAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = {
  title: "Admin Girişi | Orontes Teknoloji",
  description: "Orontes Teknoloji yönetim paneli giriş ekranı.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const session = await getCurrentAdminSession();

  if (session) {
    redirect("/admin/dashboard");
  }

  const resetStatus = (await searchParams).reset;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl bg-[#061423] p-8 text-white shadow-2xl shadow-slate-300/50 sm:p-10">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/25">
            <ShieldCheck className="size-7" aria-hidden="true" />
          </div>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-orange-200">
            Orontes Admin
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Yönetim paneli giriş alanı
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
            Site içeriği, servis talepleri, SEO ayarları ve medya yönetimi için
            hazırlanmış admin yönetim alanı.
          </p>
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm leading-7 text-slate-300">
            Giriş işlemleri güvenli oturum, rate limit ve audit log
            altyapısıyla korunur.
          </div>
          <Link
            href="/"
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            Public siteye dön
          </Link>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">
            Güvenli giriş
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Admin Girişi
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Yönetim paneline erişmek için yetkili e-posta ve şifrenizle giriş
            yapın.
          </p>
          {resetStatus === "success" ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.
            </div>
          ) : null}
          <AdminLoginForm />
        </section>
      </div>
    </main>
  );
}
