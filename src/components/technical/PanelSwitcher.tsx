import { ArrowLeftRight } from "lucide-react";
import Link from "next/link";

type PanelSwitcherProps = {
  active: "admin" | "technical";
};

export function PanelSwitcher({ active }: PanelSwitcherProps) {
  const target =
    active === "technical"
      ? { href: "/admin/dashboard", label: "Admin Panel" }
      : { href: "/technical/service-requests", label: "Teknik Panel" };

  return (
    <Link
      href={target.href}
      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
    >
      <ArrowLeftRight className="size-4" aria-hidden="true" />
      <span className="hidden sm:inline">{target.label}</span>
    </Link>
  );
}
