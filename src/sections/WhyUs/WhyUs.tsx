import { ClipboardCheck, Cpu, FileCheck2, ShieldCheck } from "lucide-react";

const features = [
  {
    title: "Arızaya Bütüncül Bakış",
    description:
      "Sorunu yalnızca görünen parçayla sınırlamayız; elektronik kart, mekanik aksam, bağlantılar ve kullanım koşullarını birlikte değerlendiririz.",
    detail: "Kök neden odaklı inceleme",
    icon: Cpu,
  },
  {
    title: "Şeffaf Servis İletişimi",
    description:
      "Cihaz tarafımıza ulaştıktan sonra tespit edilen arıza, uygulanacak işlem ve servis kapsamı anlaşılır şekilde paylaşılır.",
    detail: "Net bilgilendirme akışı",
    icon: ClipboardCheck,
  },
  {
    title: "Kontrollü Teslim Hazırlığı",
    description:
      "Onarım tamamlandığında cihaz veya kart; temizlik, bağlantı, çalışma ve teslim öncesi son kontrollerden geçirilir.",
    detail: "Teslim öncesi kontrol",
    icon: ShieldCheck,
  },
  {
    title: "Kurumsal Servis Disiplini",
    description:
      "Sağlık kuruluşlarının operasyon hassasiyetini dikkate alır, her işi planlı ve izlenebilir bir teknik servis yaklaşımıyla ele alırız.",
    detail: "Düzenli ve takip edilebilir süreç",
    icon: FileCheck2,
  },
];

export default function WhyUs() {
  return (
    <section id="neden-biz" className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_18%,rgba(14,165,233,0.13),transparent_30%),radial-gradient(circle_at_86%_8%,rgba(249,115,22,0.12),transparent_26%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
            Orontes yaklaşımı
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Neden Orontes?
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg">
            Teknik servis sürecini yalnızca onarım olarak değil; doğru tespit,
            açık iletişim, kontrollü uygulama ve güvenli teslimden oluşan
            uçtan uca bir hizmet deneyimi olarak ele alıyoruz.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ title, description, detail, icon: Icon }) => (
            <div
              key={title}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-900/10 sm:p-6 lg:min-h-72"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-sky-500 via-orange-400 to-orange-500 opacity-80" />
              <div className="flex size-12 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100 transition-colors group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:ring-orange-100">
                <Icon className="size-6" aria-hidden="true" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-slate-950">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {description}
              </p>
              <div className="mt-auto pt-5">
                <span className="inline-flex rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:ring-orange-100">
                  {detail}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
