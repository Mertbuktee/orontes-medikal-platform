import { Search } from "lucide-react";

import { updateHomepageSeo } from "@/app/admin/(protected)/homepage/actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { HomepageContentRepository } from "@/lib/database/repositories/homepage-content";

export default async function AdminHomepageSeoPage() {
  await requirePermission("homepage.seo.manage");
  const repository = new HomepageContentRepository(prisma);
  const [seo, mediaItems] = await Promise.all([
    repository.getHomepageSeo(),
    repository.listSelectableMedia(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Ana Sayfa Yönetimi"
        title="Ana Sayfa SEO"
        description="Ana sayfa meta başlığı, açıklaması ve Open Graph görselini yönetin."
      />

      <form
        action={updateHomepageSeo}
        className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <label className="block">
          <span className="text-sm font-semibold text-slate-900">
            Meta Başlık
          </span>
          <input
            name="title"
            defaultValue={seo.title}
            required
            maxLength={90}
            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          />
          <span className="mt-2 block text-xs text-slate-500">
            Önerilen uzunluk 60-70 karakterdir.
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-900">
            Meta Açıklama
          </span>
          <textarea
            name="description"
            defaultValue={seo.description}
            required
            maxLength={220}
            rows={4}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          />
          <span className="mt-2 block text-xs text-slate-500">
            Önerilen uzunluk 155-170 karakterdir.
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-900">
            Open Graph Görseli
          </span>
          <select
            name="openGraphImageId"
            defaultValue={seo.openGraphImageId ?? ""}
            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          >
            <option value="">Görsel seçilmedi</option>
            {mediaItems.map((media) => (
              <option key={media.id} value={media.id}>
                {media.title} · {media.category}
                {media.width && media.height ? ` · ${media.width}x${media.height}` : ""}
              </option>
            ))}
          </select>
          <span className="mt-2 block text-xs text-slate-500">
            Yalnızca aktif görsel medya kabul edilir.
          </span>
        </label>

        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-sky-800">
            <Search className="size-4" aria-hidden="true" />
            SEO Önizleme
          </div>
          <p className="mt-3 text-base font-semibold text-slate-950">
            {seo.title}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {seo.description}
          </p>
        </div>

        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 sm:w-auto"
        >
          SEO Ayarlarını Kaydet
        </button>
      </form>
    </div>
  );
}
