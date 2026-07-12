"use client";

import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { FormEvent, useState } from "react";

export function AdminLoginForm() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("Kimlik doğrulama altyapısı henüz aktif değil.");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-5"
      aria-describedby="admin-login-note admin-login-status"
      noValidate
    >
      <div>
        <label htmlFor="admin-email" className="text-sm font-semibold text-slate-800">
          E-posta
        </label>
        <div className="mt-2 flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100">
          <Mail className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="email"
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
          <LockKeyhole className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
          <input
            id="admin-password"
            name="password"
            type={passwordVisible ? "text" : "password"}
            autoComplete="current-password"
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

      <div
        id="admin-login-status"
        role="status"
        aria-live="polite"
        className="min-h-6 text-sm text-slate-600"
      >
        {message}
      </div>

      <button
        type="submit"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
      >
        Giriş Yap
      </button>

      <button
        type="button"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
      >
        Şifremi Unuttum
      </button>

      <p id="admin-login-note" className="text-sm leading-6 text-slate-500">
        Kimlik doğrulama altyapısı sonraki aşamada etkinleştirilecektir.
      </p>
    </form>
  );
}
