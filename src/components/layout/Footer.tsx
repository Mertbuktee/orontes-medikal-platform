import Link from "next/link";
import { ArrowRight, Mail, MapPin, MessageCircle, Phone, type LucideIcon } from "lucide-react";

import { CookieSettingsButton } from "@/components/consent/CookieSettingsButton";

type FooterLink = { label: string; href: string };
type ContactLink = FooterLink & { icon: LucideIcon; ariaLabel: string };

const companyName = "Orontes İnovasyon Endüstriyel Ürünler Sanayi Ticaret Ltd. Şti.";

const quickLinks: FooterLink[] = [
  { label: "Ana Sayfa", href: "#hero" },
  { label: "Hizmetler", href: "#hizmetler" },
  { label: "Cihazlar", href: "#cihazlar" },
  { label: "Elektronik Kart Tamiri", href: "#kart-tamiri" },
  { label: "Neden Orontes", href: "#neden-biz" },
  { label: "Servis Süreci", href: "#surec" },
  { label: "Blog", href: "#blog" },
  { label: "İletişim", href: "#iletisim" },
];

const services = [
  "Elektronik Kart Tamiri",
  "Medikal Cihaz Bakımı",
  "Arıza Analizi",
  "Mekanik Servis",
  "Yedek Parça",
  "Teknik Destek",
];

const contactLinks: ContactLink[] = [
  {
    label: "0553 606 57 03",
    href: "tel:+905536065703",
    icon: Phone,
    ariaLabel: "Orontes telefon numarasını ara",
  },
  {
    label: "info@orontesteknoloji.com",
    href: "mailto:info@orontesteknoloji.com",
    icon: Mail,
    ariaLabel: "Orontes e-posta adresine mail gönder",
  },
  {
    label: "Kocasinan Merkez Mh. Görgülü Sk. No:20/B Bahçelievler / İstanbul",
    href: "https://maps.app.goo.gl/6RGW6dy3kK4RAax8A",
    icon: MapPin,
    ariaLabel: "Orontes adresini haritada aç",
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/905536065703",
    icon: MessageCircle,
    ariaLabel: "Orontes ile WhatsApp üzerinden iletişime geç",
  },
];

const policyLinks: FooterLink[] = [
  { label: "Gizlilik Politikası", href: "/gizlilik-politikasi" },
  { label: "KVKK", href: "/kvkk" },
  { label: "Çerez Politikası", href: "/cerez-politikasi" },
];

type SocialLink = FooterLink & {
  icon: "instagram" | "linkedin";
  ariaLabel: string;
};

const socialLinks: SocialLink[] = [
  {
    label: "Instagram",
    href: "https://instagram.com/orontesteknoloji",
    icon: "instagram", ariaLabel: "Orontes Teknoloji Instagram hesabını aç",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/orontes-i%CC%87novasyon-ve-end%C3%BCstriyel-%C3%BCr%C3%BCnler-san-tic-ltd-%C5%9Fti/",
    icon: "linkedin", ariaLabel: "Orontes Teknoloji LinkedIn sayfasını aç",
  },
];

function FooterHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-300">{children}</h2>;
}

function FooterAnchor({
  href,
  label,
  ariaLabel,
  children,
}: FooterLink & { ariaLabel?: string; children?: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel ?? label}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="group inline-flex items-start gap-2 text-sm leading-6 text-slate-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071526]"
    >
      {children ?? (
        <>
          <ArrowRight
            className="mt-1 size-3.5 shrink-0 text-orange-400 transition group-hover:translate-x-0.5"
            aria-hidden="true"
          />
          <span>{label}</span>
        </>
      )}
    </Link>
  );
}

function SocialIcon({ name }: { name: SocialLink["icon"] }) {
  if (name === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
        <rect width="15" height="15" x="4.5" y="4.5" rx="4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16.4" cy="7.7" r="1" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
      <path d="M6.9 8.9H3.7v10.4h3.2V8.9ZM5.3 4A1.85 1.85 0 1 0 5.3 7.7 1.85 1.85 0 0 0 5.3 4Zm14.9 9.5c0-3.1-1.7-4.9-4.2-4.9-1.9 0-2.8 1.1-3.2 1.8V8.9H9.7v10.4h3.2v-5.1c0-1.4.3-2.7 2-2.7s1.8 1.5 1.8 2.8v5h3.2v-5.8h.3Z" />
    </svg>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-[#061423] text-white">
      <div className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden="true"
        >
          <div className="absolute -left-24 top-10 size-72 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 size-80 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:36px_36px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-10">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            <nav aria-labelledby="footer-quick-links">
              <FooterHeading>Hızlı Linkler</FooterHeading>
              <ul id="footer-quick-links" className="mt-5 space-y-2.5">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <FooterAnchor {...link} />
                  </li>
                ))}
              </ul>
            </nav>

            <section aria-labelledby="footer-services">
              <FooterHeading>Hizmetler</FooterHeading>
              <ul id="footer-services" className="mt-5 space-y-3">
                {services.map((service) => (
                  <li key={service} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-2 size-1.5 rounded-full bg-orange-400" />
                    <span>{service}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="footer-contact">
              <FooterHeading>İletişim</FooterHeading>
              <ul id="footer-contact" className="mt-5 space-y-3">
                {contactLinks.map(({ icon: Icon, ...item }) => (
                  <li key={item.href}>
                    <FooterAnchor {...item}>
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-sky-300/15 bg-sky-400/10 text-sky-200 transition group-hover:border-orange-300/30 group-hover:text-orange-200">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <span>{item.label}</span>
                    </FooterAnchor>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex gap-3" aria-label="Sosyal medya bağlantıları">
                {socialLinks.map((item) => (
                  <Link
                    key={item.href} href={item.href} aria-label={item.ariaLabel} target="_blank" rel="noreferrer"
                    className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-200 transition hover:border-orange-300/35 hover:bg-orange-500/15 hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071526]"
                  >
                    <SocialIcon name={item.icon} />
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-12 flex flex-col gap-5 border-t border-white/10 pt-6 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p>© {currentYear} {companyName} Tüm hakları saklıdır.</p>
              <p>
                Powered by{" "}
                <Link
                  href="https://www.linkedin.com/in/mertbukte/" target="_blank" rel="noreferrer"
                  className="font-semibold text-orange-300 transition hover:text-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071526]"
                >
                  Mert BÜKTE
                </Link>
              </p>
            </div>
            <nav aria-label="Yasal bağlantılar">
              <ul className="flex flex-wrap gap-x-5 gap-y-2">
                {policyLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071526]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <CookieSettingsButton className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071526]" />
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
