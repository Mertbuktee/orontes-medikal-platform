import {
  Activity,
  ArrowRight,
  Bed,
  CheckCircle2,
  ClipboardPlus,
  Cpu,
  HeartPulse,
  Monitor,
  MoveHorizontal,
  ScanHeart,
  Stethoscope,
  Table2,
  Thermometer,
  Wind,
} from "lucide-react";
import Link from "next/link";

const trustItems = [
  "Geniş Cihaz Kapsamı",
  "Türkiye Geneli Hizmet",
  "Elektronik Kart Uzmanlığı",
  "Teknik Servis Desteği",
];

const devices = [
  {
    title: "Anestezi Cihazları",
    description: "Gaz akışı, sensör ve elektronik kontrol üniteleri için servis.",
    chips: ["Elektronik", "Bakım", "Test"],
    icon: Stethoscope,
  },
  {
    title: "Ventilatörler",
    description: "Solunum desteği sağlayan sistemlerde arıza analizi ve bakım.",
    chips: ["Mekanik", "Arıza Analizi", "Test"],
    icon: Wind,
  },
  {
    title: "Hastabaşı Monitörleri",
    description: "Ekran, modül, bağlantı ve ölçüm devreleri için teknik destek.",
    chips: ["Elektronik", "Arıza Analizi", "Test"],
    icon: Monitor,
  },
  {
    title: "Tansiyon ve SpO2 Ölçerler",
    description: "Ölçüm doğruluğunu etkileyen sensör ve devre kontrolleri.",
    chips: ["Elektronik", "Bakım", "Test"],
    icon: Thermometer,
  },
  {
    title: "EKG Cihazları",
    description: "Sinyal alma, yazdırma ve bağlantı sorunlarında servis çözümü.",
    chips: ["Elektronik", "Arıza Analizi", "Test"],
    icon: HeartPulse,
  },
  {
    title: "Holter Cihazları",
    description: "Kayıt, batarya, kablo ve veri aktarım problemlerinde destek.",
    chips: ["Elektronik", "Bakım", "Test"],
    icon: ScanHeart,
  },
  {
    title: "Efor Cihazları",
    description: "Kontrol kartı, bağlantı ve çalışma güvenliği için inceleme.",
    chips: ["Elektronik", "Mekanik", "Arıza Analizi"],
    icon: Activity,
  },
  {
    title: "Ameliyat Masaları",
    description: "Hareket mekanizması, kumanda ve elektronik kontrol servisi.",
    chips: ["Mekanik", "Elektronik", "Bakım"],
    icon: Table2,
  },
  {
    title: "Hasta Yatakları",
    description: "Motor, kumanda, mekanik aksam ve güvenlik kontrolleri.",
    chips: ["Mekanik", "Bakım", "Yedek Parça"],
    icon: Bed,
  },
  {
    title: "Hasta Sedyeleri",
    description: "Mekanik hareket, fren ve taşıma güvenliği için bakım.",
    chips: ["Mekanik", "Bakım", "Yedek Parça"],
    icon: MoveHorizontal,
  },
  {
    title: "Motorlu Masalar",
    description: "Motor sürücüleri, kontrol kutuları ve hareket sistemleri.",
    chips: ["Mekanik", "Elektronik", "Arıza Analizi"],
    icon: ClipboardPlus,
  },
  {
    title: "Elektronik Kartlar",
    description: "Medikal cihaz kartlarında komponent bazlı onarım ve test.",
    chips: ["Kart Onarımı", "Elektronik", "Test"],
    icon: Cpu,
  },
];

export default function Devices() {
  return (
    <section id="cihazlar" className="relative overflow-hidden bg-slate-50 py-16 sm:py-20 lg:py-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_18%,rgba(14,165,233,0.16),transparent_30%),radial-gradient(circle_at_88%_10%,rgba(249,115,22,0.16),transparent_28%),linear-gradient(180deg,#f8fbff_0%,#ffffff_55%,#fff7ed_100%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex rounded-full border border-orange-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-600 shadow-sm shadow-orange-100/70">
            Cihaz Grupları
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Desteklediğimiz Medikal Cihaz Grupları
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg">
            Türkiye genelinden tarafımıza gönderilen medikal cihazlara
            elektronik kart tamiri, mekanik bakım, arıza analizi ve teknik
            servis desteği sunuyoruz.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map((item) => (
              <div
                key={item}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm"
              >
                <CheckCircle2 className="size-4 shrink-0 text-orange-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {devices.map(({ title, description, chips, icon: Icon }) => (
            <div
              key={title}
              className="group relative flex min-h-64 flex-col overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-lg shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1.5 hover:border-sky-200 hover:shadow-2xl hover:shadow-sky-900/10"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-sky-500 via-orange-400 to-orange-500 opacity-80" />
              <div className="relative flex size-12 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100 transition-colors group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:ring-orange-100">
                <Icon className="size-6" aria-hidden="true" />
              </div>

              <h3 className="relative mt-6 text-base font-semibold text-slate-950">
                {title}
              </h3>
              <p className="relative mt-3 text-sm leading-6 text-slate-600">
                {description}
              </p>
              <div className="relative mt-auto flex flex-wrap gap-2 pt-5">
                {chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full bg-slate-50 px-2.5 py-1 text-[0.7rem] font-semibold text-slate-600 ring-1 ring-slate-200 group-hover:bg-sky-50 group-hover:text-sky-700 group-hover:ring-sky-100"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl border border-sky-100 bg-white/85 p-6 shadow-xl shadow-slate-900/5 sm:flex sm:items-center sm:justify-between sm:gap-6 lg:p-8">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">
              Aradığınız cihaz listede yok mu?
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Servis kapsamımız hakkında bilgi almak için bizimle iletişime
              geçebilirsiniz.
            </p>
          </div>
          <Link
            href="#iletisim"
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 sm:mt-0"
          >
            Bize Ulaşın
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
