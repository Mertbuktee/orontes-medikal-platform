export default function TechnicalForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-950">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
          Erişim Yok
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Teknik panele erişiminiz yok.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Bu alan yalnızca teknik servis personeli ve sistem sahibi için açıktır.
        </p>
        <form action="/admin/auth/logout" method="post">
          <button
            type="submit"
            className="mt-5 inline-flex min-h-11 items-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white"
          >
            Oturumu Kapat
          </button>
        </form>
      </section>
    </main>
  );
}
