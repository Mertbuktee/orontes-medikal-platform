import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { publicRoutes } from "@/config/site";
import { createPageMetadata } from "@/lib/seo/metadata";
import Process from "@/sections/Process/Process";

const route = publicRoutes.find((item) => item.path === "/servis-sureci");

export const metadata: Metadata = createPageMetadata({
  title: route?.title ?? "Medikal Cihaz Servis Süreci | Orontes Teknoloji",
  description:
    route?.description ??
    "Medikal cihaz servis süreci ve teknik iş akışı.",
  path: "/servis-sureci",
});

export default function ServiceProcessPage() {
  return (
    <main>
      <section className="bg-white px-4 pt-16 sm:px-6 lg:px-8 lg:pt-20">
        <div className="mx-auto max-w-7xl">
          <Breadcrumbs
            items={[
              { name: "Ana Sayfa", path: "/" },
              { name: "Servis Süreci", path: "/servis-sureci" },
            ]}
          />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">
            Planlı teknik akış
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Medikal cihaz servis süreci nasıl ilerler?
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Cihazın tarafımıza ulaşmasından teslim hazırlığına kadar her adım
            kontrollü ve kayıtlı bir teknik servis akışı içinde değerlendirilir.
          </p>
        </div>
      </section>
      <Process />
    </main>
  );
}
