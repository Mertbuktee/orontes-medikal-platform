import {
  ArrowDown,
  ArrowUp,
  ChevronsDown,
  ChevronsUp,
  Eye,
  EyeOff,
  Pencil,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import {
  moveHomepageSection,
  toggleHomepageSectionVisibility,
} from "@/app/admin/(protected)/homepage/actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { HomepageContentRepository } from "@/lib/database/repositories/homepage-content";
import { homepageSectionLabels } from "@/lib/homepage/homepage-types";
import { hasPermission } from "@/lib/rbac/permissions";

export default async function AdminHomepageSectionsPage() {
  const session = await requirePermission("homepage.view");
  const sections = await new HomepageContentRepository(prisma).listAdminSections();
  const canUpdate = hasPermission(session.role, "homepage.update");
  const canReorder = hasPermission(session.role, "homepage.reorder");
  const canPublish = hasPermission(session.role, "homepage.publish");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Ana Sayfa Yönetimi"
        title="Bölümler"
        description="Ana sayfa bölümlerini sıralayın, gizleyin veya içeriklerini düzenleyin."
      />

      <section className="grid gap-4">
        {sections.map((section, index) => (
          <article
            key={section.key}
            className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto]"
          >
            <div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-orange-700">
                  #{section.order}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 ${
                    section.isVisible
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {section.isVisible ? "Görünür" : "Gizli"}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-slate-950">
                {homepageSectionLabels[section.key as keyof typeof homepageSectionLabels]}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{section.title}</p>
              <p className="mt-2 text-xs text-slate-500">
                Son güncelleme: {section.updatedAt.toLocaleDateString("tr-TR")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {canUpdate ? (
                <Link
                  href={`/admin/homepage/sections/${section.key}`}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition hover:bg-orange-50"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Düzenle
                </Link>
              ) : null}
              {canReorder ? (
                <>
                  <MoveButton
                    sectionKey={section.key}
                    direction="first"
                    label="İlk sıraya taşı"
                    icon={ChevronsUp}
                    disabled={index === 0}
                  />
                  <MoveButton
                    sectionKey={section.key}
                    direction="up"
                    label="Yukarı taşı"
                    icon={ArrowUp}
                    disabled={index === 0}
                  />
                  <MoveButton
                    sectionKey={section.key}
                    direction="down"
                    label="Aşağı taşı"
                    icon={ArrowDown}
                    disabled={index === sections.length - 1}
                  />
                  <MoveButton
                    sectionKey={section.key}
                    direction="last"
                    label="Son sıraya taşı"
                    icon={ChevronsDown}
                    disabled={index === sections.length - 1}
                  />
                </>
              ) : null}
              {canPublish ? (
                <form action={toggleHomepageSectionVisibility}>
                  <input type="hidden" name="key" value={section.key} />
                  <input
                    type="hidden"
                    name="isVisible"
                    value={String(!section.isVisible)}
                  />
                  <button
                    type="submit"
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition hover:bg-orange-50"
                  >
                    {section.isVisible ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                    {section.isVisible ? "Gizle" : "Göster"}
                  </button>
                </form>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function MoveButton({
  sectionKey,
  direction,
  label,
  icon: Icon,
  disabled,
}: {
  sectionKey: string;
  direction: "up" | "down" | "first" | "last";
  label: string;
  icon: LucideIcon;
  disabled: boolean;
}) {
  return (
    <form action={moveHomepageSection}>
      <input type="hidden" name="key" value={sectionKey} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={disabled}
        aria-label={label}
        className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-orange-50 disabled:opacity-40"
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}
