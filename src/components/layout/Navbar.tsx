"use client";

import { Mail, MapPin, Menu, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Ana Sayfa", href: "/" },
  { label: "Hizmetler", href: "/hizmetler" },
  { label: "Cihazlar", href: "/cihazlar" },
  { label: "Elektronik Kart Tamiri", href: "/elektronik-kart-tamiri" },
  { label: "Hakkımızda", href: "/hakkimizda" },
  { label: "Blog", href: "/blog" },
  { label: "İletişim", href: "/iletisim" },
];

const contactItems = [
  {
    label: "0553 606 57 03",
    href: "tel:+905536065703",
    icon: Phone,
    hoverClass: "hover:text-emerald-300",
  },
  {
    label: "info@orontesteknoloji.com",
    href: "mailto:info@orontesteknoloji.com",
    icon: Mail,
    hoverClass: "hover:text-sky-300",
  },
  {
    label: "Bahçelievler / İstanbul",
    href: "https://maps.app.goo.gl/6RGW6dy3kK4RAax8A",
    icon: MapPin,
    hoverClass: "hover:text-amber-300",
  },
];

const socialLinks = [
  {
    label: "Instagram",
    href: "https://instagram.com/orontesteknoloji",
    icon: "instagram",
    hoverClass:
      "hover:bg-gradient-to-tr hover:from-[#f58529] hover:via-[#dd2a7b] hover:to-[#515bd4] hover:text-white",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/orontes-i%CC%87novasyon-ve-end%C3%BCstriyel-%C3%BCr%C3%BCnler-san-tic-ltd-%C5%9Fti/",
    icon: "linkedin",
    hoverClass: "hover:bg-[#0a66c2] hover:text-white",
  },
] as const;

const serviceLinkClass =
  "inline-flex h-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-transparent bg-primary bg-clip-padding px-4 text-sm font-medium text-primary-foreground shadow-sm shadow-slate-950/10 transition-all duration-300 outline-none select-none hover:-translate-y-0.5 hover:bg-orange-500 hover:shadow-lg hover:shadow-orange-500/25 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px";

function Logo({ onClick }: { onClick?: () => void }) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onClick?.();

    if (window.location.pathname === "/") {
      window.location.reload();
      return;
    }

    window.location.assign("/");
  };

  return (
    <Link
      href="/"
      onClick={handleClick}
      className="relative block h-14 w-56 shrink-0 overflow-hidden sm:h-16 sm:w-64 lg:h-24 lg:w-72 xl:h-28 xl:w-80"
      aria-label="Ana sayfa"
    >
      <Image
        src="/images/logo/orontes-logo.png"
        alt="Orontes Medikal Platform"
        fill
        sizes="(max-width: 640px) 224px, (max-width: 1024px) 256px, (max-width: 1280px) 288px, 320px"
        className="origin-left object-contain object-left scale-[2.35] sm:scale-[2.45] lg:scale-[1.75] xl:scale-[2.05]"
        priority
      />
    </Link>
  );
}

function SocialIcon({ name }: { name: (typeof socialLinks)[number]["icon"] }) {
  if (name === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" aria-hidden="true">
        <rect width="15" height="15" x="4.5" y="4.5" rx="4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16.4" cy="7.7" r="1" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" fill="currentColor" aria-hidden="true">
      <path d="M6.9 8.9H3.7v10.4h3.2V8.9ZM5.3 4A1.85 1.85 0 1 0 5.3 7.7 1.85 1.85 0 0 0 5.3 4Zm14.9 9.5c0-3.1-1.7-4.9-4.2-4.9-1.9 0-2.8 1.1-3.2 1.8V8.9H9.7v10.4h3.2v-5.1c0-1.4.3-2.7 2-2.7s1.8 1.5 1.8 2.8v5h3.2v-5.8h.3Z" />
    </svg>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 8);

    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });

    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-transparent transition-all duration-300",
        scrolled
          ? "border-border/70 bg-background/85 shadow-sm backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <div className="hidden border-b border-border/60 bg-foreground text-background lg:block">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-6 text-sm">
          <div className="flex items-center gap-5">
            {contactItems.map(({ label, href, icon: Icon, hoverClass }) => (
              <Link
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noreferrer" : undefined}
                className={cn(
                  "flex items-center gap-2 text-background/85 transition-colors",
                  hoverClass
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {socialLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`Orontes ${item.label} hesabını aç`}
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-background/85 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-background/60 focus-visible:outline-none",
                  item.hoverClass
                )}
              >
                <SocialIcon name={item.icon} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-24 xl:h-28"
        aria-label="Ana navigasyon"
      >
        <Logo />
        <div className="hidden items-center gap-1 xl:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative rounded-md px-3 py-2 text-sm font-medium text-foreground/70 transition-all duration-300 hover:bg-orange-50 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span>{item.label}</span>
              <span
                className="absolute inset-x-3 bottom-1 h-0.5 origin-left scale-x-0 rounded-full bg-orange-500 transition-transform duration-300 group-hover:scale-x-100"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-2 xl:flex">
          <Link href="/servis-talebi" className={serviceLinkClass}>
            Servis Talebi
          </Link>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label="Menüyü aç"
            className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-background/80 text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none xl:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </SheetTrigger>
          <SheetContent>
            <SheetTitle className="sr-only">Mobil navigasyon</SheetTitle>
            <SheetDescription className="sr-only">
              Orontes Medikal Platform sayfa bağlantıları
            </SheetDescription>
            <div className="flex min-h-full flex-col gap-5 pb-6">
              <Logo onClick={() => setOpen(false)} />
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-3 text-base font-medium text-foreground/80 transition-all duration-300 hover:bg-orange-50 hover:pl-4 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <Link
                href="/servis-talebi"
                className={serviceLinkClass}
                onClick={() => setOpen(false)}
              >
                Servis Talebi
              </Link>
              <div className="flex gap-3 border-t border-border pt-6">
                {socialLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Orontes ${item.label} hesabını aç`}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-xl border border-border bg-muted/40 text-foreground transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      item.hoverClass
                    )}
                  >
                    <SocialIcon name={item.icon} />
                  </Link>
                ))}
              </div>
              <div className="grid gap-3 border-t border-border pt-6 text-sm">
                {contactItems.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={href.startsWith("http") ? "noreferrer" : undefined}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 min-w-0 items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    <span className="min-w-0 break-words">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
