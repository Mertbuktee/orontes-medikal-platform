export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-label="Dashboard yükleniyor">
      <div className="h-40 animate-pulse rounded-3xl bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-3xl bg-slate-200"
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-3xl bg-slate-200" />
        <div className="h-80 animate-pulse rounded-3xl bg-slate-200" />
      </div>
    </div>
  );
}
