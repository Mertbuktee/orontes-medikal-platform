"use client";

import { useActionState } from "react";

import {
  requestPasswordReset,
  type AccountSecurityActionState,
} from "@/app/admin/account-security-actions";

const initialState: AccountSecurityActionState = { success: false, message: "" };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState
  );

  return (
    <form action={formAction} className="mt-8 space-y-5" noValidate>
      <div>
        <label htmlFor="forgot-email" className="text-sm font-semibold text-slate-800">
          E-posta
        </label>
        <input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 shadow-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
        />
      </div>
      <p
        role="status"
        aria-live="polite"
        className={state.success ? "text-sm text-slate-700" : "text-sm text-red-600"}
      >
        {state.message}
      </p>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-60"
      >
        {pending ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
      </button>
    </form>
  );
}
