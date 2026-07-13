"use client";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-600">
        Dashboard
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-slate-950">
        Dashboard geçici olarak yüklenemedi
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
        Operasyon özetleri alınırken güvenli olmayan detay göstermeden durduk.
        Birazdan tekrar deneyebilirsiniz.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
      >
        Tekrar Dene
      </button>
    </div>
  );
}
