import { redirect } from "next/navigation";

import { TechnicalLoginForm } from "@/components/technical/TechnicalLoginForm";
import { getCurrentAdminSession } from "@/lib/auth/admin-session";
import { canAccessTechnicalPanel } from "@/lib/rbac/permissions";

export const dynamic = "force-dynamic";

export default async function TechnicalLoginPage() {
  const session = await getCurrentAdminSession();

  if (session && canAccessTechnicalPanel(session.role)) {
    redirect("/technical/dashboard");
  }

  if (session) {
    redirect("/technical/forbidden");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 text-slate-950">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-cyan-400 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20">
            T
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Orontes
            </p>
            <h1 className="text-xl font-semibold text-slate-950">
              Teknik Servis Paneli
            </h1>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Teknik servis talepleri, cihaz geçmişi ve müşteri cihaz kayıtları için
          ayrı operasyon girişi.
        </p>
        <TechnicalLoginForm />
      </section>
    </main>
  );
}
