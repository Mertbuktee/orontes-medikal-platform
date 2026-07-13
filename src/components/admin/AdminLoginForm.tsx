"use client";

import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

type LoginResponse = {
  success: boolean;
  message?: string;
  redirectTo?: string;
};

const defaultErrorMessage = "E-posta veya şifre hatalı.";

export function AdminLoginForm() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
          rememberMe: formData.get("rememberMe") === "on",
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | LoginResponse
        | null;

      if (response.ok && payload?.success && payload.redirectTo) {
        window.location.assign(payload.redirectTo);
        return;
      }

      setMessage(payload?.message ?? defaultErrorMessage);
    } catch {
      setMessage("Giriş yapılamadı. Lütfen bağlantınızı kontrol edin.");
    } finally {
      setSubmitting(false);
    }
  };

  const hasError = Boolean(message);

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-5"
      aria-describedby="admin-login-status"
      noValidate
    >
      <div>
        <label
          htmlFor="admin-email"
          className="text-sm font-semibold text-slate-800"
        >
          E-posta
        </label>
        <div className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100">
          <Mail className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={hasError}
            aria-describedby="admin-login-status"
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
            placeholder="admin@orontes..."
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="admin-password"
          className="text-sm font-semibold text-slate-800"
        >
          Şifre
        </label>
        <div className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100">
          <LockKeyhole
            className="size-4 shrink-0 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="admin-password"
            name="password"
            type={passwordVisible ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-invalid={hasError}
            aria-describedby="admin-login-status"
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
            placeholder="Şifreniz"
          />
          <button
            type="button"
            aria-label={passwordVisible ? "Şifreyi gizle" : "Şifreyi göster"}
            onClick={() => setPasswordVisible((current) => !current)}
            className="inline-flex size-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            {passwordVisible ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <label className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700">
        <input
          type="checkbox"
          name="rememberMe"
          className="size-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
        />
        <span>Beni hatırla</span>
      </label>

      <div
        id="admin-login-status"
        role="status"
        aria-live="polite"
        className="min-h-6 text-sm font-medium text-red-600"
      >
        {message}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Giriş yapılıyor..." : "Giriş Yap"}
      </button>

      <Link
        href="/admin/forgot-password"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
      >
        Şifremi Unuttum
      </Link>
    </form>
  );
}
