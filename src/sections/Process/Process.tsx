import {
  ClipboardCheck,
  Cpu,
  FileCheck2,
  PackageCheck,
  ScanSearch,
  Settings,
  ShieldCheck,
  Stethoscope,
  Truck,
  Wrench,
} from "lucide-react";

const flowItems = [
  "Kayıt",
  "Arıza Analizi",
  "Onarım",
  "Test",
  "Kalite Kontrol",
  "Teslim",
];

const steps = [
  {
    number: "01",
    title: "Cihaz Kabul",
    description: "Cihaz kayıt altına alınır ve ilk fiziksel kontrol yapılır.",
    icon: ClipboardCheck,
  },
  {
    number: "02",
    title: "Arıza Analizi",
    description: "Elektronik ve mekanik incelemeler gerçekleştirilir.",
    icon: ScanSearch,
  },
  {
    number: "03",
    title: "Onarım",
    description: "Arızalı komponentler ve mekanik parçalar onarılır.",
    icon: Wrench,
  },
  {
    number: "04",
    title: "Fonksiyon Testleri",
    description: "Kart ve cihaz gerçek çalışma koşullarında test edilir.",
    icon: Settings,
  },
  {
    number: "05",
    title: "Kalite Kontrol",
    description: "Son kontroller gerçekleştirilerek güvenlik doğrulanır.",
    icon: ShieldCheck,
  },
  {
    number: "06",
    title: "Teslim",
    description: "Cihaz müşteriye güvenli şekilde teslim edilir.",
    icon: PackageCheck,
  },
];

const infoItems = [
  {
    title: "Elektronik Kart Tamiri",
    description: "Komponent ve kart bazlı çözüm.",
    icon: Cpu,
  },
  {
    title: "Teknik Servis",
    description: "Planlı bakım ve onarım akışı.",
    icon: Stethoscope,
  },
  {
    title: "Türkiye Geneli Destek",
    description: "Gönderilen cihazlara servis desteği.",
    icon: Truck,
  },
];

export default function Process() {
  return (
    <section id="surec" className="relative overflow-hidden bg-slate-50 py-16 sm:py-20 lg:py-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_16%,rgba(14,165,233,0.15),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(249,115,22,0.14),transparent_28%),linear-gradient(180deg,#f8fbff_0%,#ffffff_56%,#fff7ed_100%)]" />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.4fr_0.6fr] lg:px-8">
        <div className="min-w-0">
          <span className="inline-flex rounded-full border border-orange-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-600 shadow-sm">
            SERVİS SÜRECİ
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Cihazınız Güvenli ve Planlı Bir Süreçten Geçer
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            Tarafımıza ulaşan her cihaz aynı teknik disiplin içerisinde
            değerlendirilir. Arıza tespiti, onarım, test ve teslim süreçleri
            kayıt altına alınarak uygulanır.
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
              {flowItems.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <span className="flex size-6 items-center justify-center rounded-full bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="relative space-y-4">
            <div className="absolute left-8 top-8 hidden h-[calc(100%-4rem)] w-px bg-linear-to-b from-sky-200 via-slate-200 to-orange-200 sm:block" />
            {steps.map(({ number, title, description, icon: Icon }) => (
              <div
                key={number}
                className="group relative rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-900/10 sm:ml-16"
              >
                <div className="absolute -left-16 top-5 hidden size-16 items-center justify-center rounded-2xl border border-white bg-slate-950 text-lg font-semibold text-white shadow-lg shadow-slate-900/15 sm:flex">
                  {number}
                </div>
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100 transition-colors group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:ring-orange-100">
                    <Icon className="size-6" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-orange-500 sm:hidden">
                      {number}
                    </span>
                    <h3 className="text-lg font-semibold text-slate-950">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-xl shadow-slate-900/5 sm:grid-cols-3">
            {infoItems.map(({ title, description, icon: Icon }) => (
              <div key={title} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <h4 className="mt-4 text-sm font-semibold text-slate-950">
                  {title}
                </h4>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
