import { ArrowUpRight, BookOpenText, HeartPulse, NotebookText } from "lucide-react";
import Link from "next/link";

const posts = [
  {
    title: "Hastabaşı Monitörü Arızalarında İlk Kontroller",
    description:
      "Ekran, güç, batarya, SpO2 ve NIBP modüllerinde sık görülen sorunlara genel bakış.",
    category: "Hastabaşı Monitörü",
    icon: HeartPulse,
  },
  {
    title: "Elektronik Kart Tamirinde Arıza Analizi Nasıl Yapılır?",
    description:
      "Besleme devresi, komponent kontrolü ve fonksiyon testlerinin servis sürecindeki önemi.",
    category: "Elektronik Kart Tamiri",
    icon: NotebookText,
  },
  {
    title: "Medikal Cihazlarda Periyodik Bakımın Önemi",
    description:
      "Cihaz güvenliği, performans sürekliliği ve teknik uygunluk açısından bakım süreçleri.",
    category: "Periyodik Bakım",
    icon: BookOpenText,
  },
];

export default function BlogPreview() {
  return (
    <section
      id="blog"
      className="relative overflow-hidden bg-slate-50 py-16 sm:py-20 lg:py-24"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_10%,rgba(14,165,233,0.14),transparent_30%),radial-gradient(circle_at_88%_18%,rgba(249,115,22,0.13),transparent_28%)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold tracking-[0.16em] text-orange-600 shadow-sm">
            <BookOpenText className="size-3.5" aria-hidden="true" />
            BLOG
          </div>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Teknik Bilgi ve Servis Notları
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            Medikal cihaz bakım, onarım ve arıza süreçleri hakkında bilgilendirici
            içerikler.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {posts.map(({ title, description, category, icon: Icon }) => (
            <article
              key={title}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-slate-200/80"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-sky-500 via-orange-400 to-orange-500 opacity-80" />

              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                  {category}
                </span>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100 transition-colors group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:ring-orange-100">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              </div>

              <h3 className="mt-6 text-xl font-semibold leading-snug text-slate-950">
                {title}
              </h3>
              <p className="mt-3 min-h-20 text-sm leading-7 text-slate-600">
                {description}
              </p>

              <Link
                href="#"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition-colors hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                aria-label={`${title} yazısını incele`}
              >
                Yazıyı İncele
                <ArrowUpRight
                  className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
