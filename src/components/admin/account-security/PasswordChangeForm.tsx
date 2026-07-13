"use client";

import { useActionState } from "react";

import {
  changeOwnPassword,
  type AccountSecurityActionState,
} from "@/app/admin/account-security-actions";

const initialState: AccountSecurityActionState = { success: false, message: "" };

export function PasswordChangeForm() {
  const [state, formAction, pending] = useActionState(
    changeOwnPassword,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <PasswordField
        id="currentPassword"
        label="Mevcut Şifre"
        error={state.fieldErrors?.currentPassword?.[0]}
      />
      <PasswordField
        id="newPassword"
        label="Yeni Şifre"
        error={state.fieldErrors?.newPassword?.[0]}
      />
      <PasswordField
        id="confirmPassword"
        label="Yeni Şifre Tekrarı"
        error={state.fieldErrors?.confirmPassword?.[0]}
      />
      <p
        role="status"
        aria-live="polite"
        className={state.success ? "text-sm text-emerald-700" : "text-sm text-red-600"}
      >
        {state.message}
      </p>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-60"
      >
        {pending ? "Güncelleniyor..." : "Şifreyi Güncelle"}
      </button>
    </form>
  );
}

function PasswordField({
  id,
  label,
  error,
}: {
  id: string;
  label: string;
  error?: string;
}) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-slate-800">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="password"
        autoComplete={id === "currentPassword" ? "current-password" : "new-password"}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 shadow-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
      />
      {error ? (
        <p id={errorId} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
