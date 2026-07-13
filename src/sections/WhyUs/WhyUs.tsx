import { createElement } from "react";

import { getHomepageIcon } from "@/lib/homepage/homepage-icons";
import type { WhyUsContent } from "@/lib/homepage/homepage-types";

const defaultItems: WhyUsContent["items"] = [
  {
    title: "Arızaya Bütüncül Bakış",
    description:
      "Sorunu yalnızca görünen parçayla sınırlamayız; elektronik kart, mekanik aksam ve kullanım koşullarını birlikte değerlendiririz.",
    iconKey: "Cpu",
    order: 1,
    isActive: true,
  },
  {
    title: "Şeffaf Servis İletişimi",
    description:
      "Tespit edilen arıza, uygulanacak işlem ve servis kapsamı anlaşılır şekilde paylaşılır.",
    iconKey: "ClipboardCheck",
    order: 2,
    isActive: true,
  },
  {
    title: "Kontrollü Teslim Hazırlığı",
    description:
      "Cihaz veya kart, teslim öncesi son teknik kontrollerden geçirilir.",
    iconKey: "ShieldCheck",
    order: 3,
    isActive: true,
  },
  {
    title: "Kurumsal Servis Disiplini",
    description:
      "Her işi planlı ve izlenebilir bir teknik servis yaklaşımıyla ele alırız.",
    iconKey: "FileCheck2",
    order: 4,
    isActive: true,
  },
];

type WhyUsProps = {
  content?: WhyUsContent;
};

export default function WhyUs({
  content = {
    title: "Neden Orontes?",
    description:
      "Teknik servis sürecini yalnızca onarım olarak değil; doğru tespit, açık iletişim, kontrollü uygulama ve güvenli teslimden oluşan uçtan uca bir hizmet deneyimi olarak ele alıyoruz.",
    items: defaultItems,
  },
}: WhyUsProps) {
  const items = [...content.items]
    .filter((item) => item.isActive)
    .sort((first, second) => first.order - second.order);

  return (
    <section id="neden-biz" className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_18%,rgba(14,165,233,0.13),transparent_30%),radial-gradient(circle_at_86%_8%,rgba(249,115,22,0.12),transparent_26%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {content.title}
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg">
            {content.description}
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ title, description, iconKey }) => {
            const Icon = getHomepageIcon(iconKey);

            return (
              <div
                key={title}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-900/10 sm:p-6 lg:min-h-64"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-sky-500 via-orange-400 to-orange-500 opacity-80" />
                <div className="flex size-12 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100 transition-colors group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:ring-orange-100">
                  {createElement(Icon, { className: "size-6", "aria-hidden": true })}
                </div>
                <h3 className="mt-6 text-lg font-semibold text-slate-950">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
