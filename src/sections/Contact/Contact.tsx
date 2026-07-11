import {
  BadgeCheck,
  Building2,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
} from "lucide-react";
import Link from "next/link";

const contactCards = [
  { title: "Telefon", value: "0553 606 57 03", href: "tel:+905536065703", icon: Phone },
  {
    title: "E-posta",
    value: "info@orontesteknoloji.com",
    href: "mailto:info@orontesteknoloji.com",
    icon: Mail,
  },
  {
    title: "Adres",
    value: "Kocasinan Merkez Mh.\nGörgülü Sk. No:20/B\nBahçelievler / İstanbul",
    href: "https://maps.app.goo.gl/6RGW6dy3kK4RAax8A",
    icon: MapPin,
  },
  {
    title: "WhatsApp",
    value: "Hızlı iletişim",
    href: "https://wa.me/905536065703?text=Merhabalar%20Website%20%C3%9Czerinden%20%C4%B0leti%C5%9Fime%20Ge%C3%A7iyorum",
    icon: MessageCircle,
  },
];

const trustItems = ["Türkiye Geneli Destek", "Teknik Servis", "Elektronik Kart Tamiri"];
const mapSrc =
  "https://www.google.com/maps?q=Kocasinan%20Merkez%20Mh.%20G%C3%B6rg%C3%BCl%C3%BC%20Sk.%20No%3A20%2FB%20Bah%C3%A7elievler%20%C4%B0stanbul&output=embed";

export default function Contact() {
  return (
    <section id="iletisim" className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_12%,rgba(14,165,233,0.1),transparent_30%),radial-gradient(circle_at_92%_18%,rgba(249,115,22,0.035),transparent_24%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]" />

      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="min-w-0 overflow-hidden">
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Bizimle İletişime Geçin
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Servis kapsamı, cihaz uygunluğu veya teknik destek hakkında bilgi
            almak için bizimle iletişime geçebilirsiniz.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {contactCards.map(({ title, value, href, icon: Icon }) => (
              <Link
                key={title}
                href={href}
                className="group flex min-h-28 min-w-0 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg"
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noreferrer" : undefined}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-950">{title}</span>
                  <span className="mt-1 block whitespace-pre-line break-words text-sm leading-6 text-slate-600">
                    {value}
                  </span>
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {trustItems.map((item) => (
              <div
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
              >
                <BadgeCheck className="size-4 text-orange-500" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/80 sm:p-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <div className="flex flex-col gap-4 border-b border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/25">
                  <Navigation className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                    Ofis konumu
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-950">
                    Bahçelievler / İstanbul
                  </h3>
                </div>
              </div>
              <Link
                href="https://maps.app.goo.gl/6RGW6dy3kK4RAax8A"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-orange-200 hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
              >
                Haritada Aç
                <ExternalLink className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="relative h-80 bg-slate-100 sm:aspect-[4/3] sm:h-auto sm:min-h-80">
              <iframe
                src={mapSrc}
                title="Orontes Medikal ofis konumu"
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-slate-700 sm:items-center">
            <Building2 className="size-5 shrink-0 text-sky-700" aria-hidden="true" />
            <span>
              Cihaz gönderimi ve servis kapsamı için ekibimizle ön görüşme
              yapabilirsiniz.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
