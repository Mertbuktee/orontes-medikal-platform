import { FileCheck2 } from "lucide-react";
import { createElement } from "react";

import { getHomepageIcon } from "@/lib/homepage/homepage-icons";
import type { ProcessContent } from "@/lib/homepage/homepage-types";

const defaultSteps: ProcessContent["steps"] = [
  {
    title: "Cihaz Kabul",
    description: "Cihaz kayıt altına alınır ve ilk fiziksel kontrol yapılır.",
    iconKey: "ClipboardCheck",
    order: 1,
    isActive: true,
  },
  {
    title: "Arıza Analizi",
    description: "Elektronik ve mekanik incelemeler gerçekleştirilir.",
    iconKey: "ScanSearch",
    order: 2,
    isActive: true,
  },
  {
    title: "Onarım",
    description: "Arızalı komponentler ve mekanik parçalar onarılır.",
    iconKey: "Wrench",
    order: 3,
    isActive: true,
  },
  {
    title: "Fonksiyon Testleri",
    description: "Kart ve cihaz gerçek çalışma koşullarında test edilir.",
    iconKey: "Settings",
    order: 4,
    isActive: true,
  },
  {
    title: "Teslim",
    description: "Cihaz müşteriye güvenli şekilde teslim edilir.",
    iconKey: "PackageCheck",
    order: 5,
    isActive: true,
  },
];

type ProcessProps = {
  content?: ProcessContent;
};

export default function Process({
  content = {
    title: "Cihazınız Güvenli ve Planlı Bir Süreçten Geçer",
    description:
      "Tarafımıza ulaşan her cihaz aynı teknik disiplin içinde değerlendirilir. Arıza tespiti, onarım, test ve teslim süreçleri kayıt altına alınarak uygulanır.",
    steps: defaultSteps,
  },
}: ProcessProps) {
  const steps = [...content.steps]
    .filter((step) => step.isActive)
    .sort((first, second) => first.order - second.order);

  return (
    <section id="surec" className="relative overflow-hidden bg-slate-50 py-16 sm:py-20 lg:py-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_16%,rgba(14,165,233,0.15),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(249,115,22,0.14),transparent_28%),linear-gradient(180deg,#f8fbff_0%,#ffffff_56%,#fff7ed_100%)]" />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.4fr_0.6fr] lg:px-8">
        <div className="min-w-0">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {content.title}
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            {content.description}
          </p>

          <div className="mt-8 rounded-2xl border border-orange-100 bg-white/85 p-5 shadow-xl shadow-orange-100/40">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500 text-white">
                <FileCheck2 className="size-5" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-slate-950">
                Servis Akışı
              </h3>
            </div>
            <div className="mt-5 grid gap-3">
              {steps.map((step) => (
                <div key={step.title} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <span className="flex size-6 items-center justify-center rounded-full bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                    ✓
                  </span>
                  <span>{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="relative space-y-4">
            <div className="absolute left-8 top-8 hidden h-[calc(100%-4rem)] w-px bg-linear-to-b from-sky-200 via-slate-200 to-orange-200 sm:block" />
            {steps.map(({ title, description, iconKey }) => {
              const Icon = getHomepageIcon(iconKey);

              return (
                <div
                  key={title}
                  className="group relative rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-900/10 sm:ml-16"
                >
                  <div className="absolute -left-16 top-5 hidden size-16 items-center justify-center rounded-2xl border border-white bg-slate-950 text-white shadow-lg shadow-slate-900/15 sm:flex">
                    {createElement(Icon, {
                      className: "size-6",
                      "aria-hidden": true,
                    })}
                  </div>
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100 transition-colors group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:ring-orange-100">
                      {createElement(Icon, {
                        className: "size-6",
                        "aria-hidden": true,
                      })}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-slate-950">
                        {title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
