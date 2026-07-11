import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { publicRoutes } from "@/config/site";
import { createPageMetadata } from "@/lib/seo/metadata";
import WhyUs from "@/sections/WhyUs/WhyUs";

const route = publicRoutes.find((item) => item.path === "/hakkimizda");

export const metadata: Metadata = createPageMetadata({
  title: route?.title ?? "Hakkımızda | Orontes Teknoloji",
  description:
    route?.description ??
    "Orontes Teknoloji medikal cihaz teknik servis yaklaşımı.",
  path: "/hakkimizda",
});

export default function AboutPage() {
  return (
    <main>
      <section className="bg-white px-4 pt-16 sm:px-6 lg:px-8 lg:pt-20">
        <div className="mx-auto max-w-7xl">
          <Breadcrumbs
            items={[
              { name: "Ana Sayfa", path: "/" },
              { name: "Hakkımızda", path: "/hakkimizda" },
            ]}
          />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">
            Orontes yaklaşımı
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Sağlık teknolojilerinde planlı ve güvenilir teknik servis yaklaşımı
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Medikal cihazların servis süreçlerini yalnızca onarım olarak değil;
            doğru tespit, şeffaf iletişim, kontrollü uygulama ve güvenli teslim
            adımlarından oluşan kurumsal bir hizmet olarak ele alıyoruz.
          </p>
        </div>
      </section>
      <WhyUs />
    </main>
  );
}
