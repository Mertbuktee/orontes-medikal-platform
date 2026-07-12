type AdminPageHeaderProps = {
  title: string;
  description: string;
  eyebrow?: string;
};

export function AdminPageHeader({
  title,
  description,
  eyebrow = "Yönetim",
}: AdminPageHeaderProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
        {description}
      </p>
    </div>
  );
}
