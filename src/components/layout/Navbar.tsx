"use client";

import {
  Mail,
  MapPin,
  Menu,
  Phone,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Ana Sayfa", href: "/#hero" },
  { label: "Hizmetler", href: "/#hizmetler" },
  { label: "Cihazlar", href: "/#cihazlar" },
  { label: "Elektronik Kart Tamiri", href: "/#kart-tamiri" },
  { label: "Hakkımızda", href: "/#neden-biz" },
  { label: "Blog", href: "/#blog" },
  { label: "İletişim", href: "/#iletisim" },
];

const contactItems = [
  { label: "0553 606 57 03", href: "tel:+905536065703", icon: Phone },
  {
    label: "info@orontesteknoloji.com",
    href: "mailto:info@orontesteknoloji.com",
    icon: Mail,
  },
  { label: "Bahçelievler / İstanbul", href: "/#iletisim", icon: MapPin },
];

const whatsappHref = "https://wa.me/905536065703";
const serviceLinkClass =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-transparent bg-primary bg-clip-padding px-2.5 text-sm font-medium text-primary-foreground transition-all outline-none select-none hover:bg-primary/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px";

function Logo() {
  return (
    <Link href="#" className="flex items-center gap-2" aria-label="Ana sayfa">
      <Image
        src="/images/logo/orontes-logo.png"
        alt="Orontes Medikal Platform"
        width={1536}
        height={1024}
        className="h-[7rem] w-auto sm:h-[9rem] lg:h-[12rem]"
        priority
      />
    </Link>
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
            {contactItems.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-2 text-background/85 transition-colors hover:text-background"
              >
                <Icon className="size-4" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
          <Link
            href={whatsappHref}
            className="flex items-center gap-2 text-background/85 transition-colors hover:text-background"
            target="_blank"
            rel="noreferrer"
          >
            <Image src="/images/icons/wp.png" alt="" width={16} height={16} className="size-4 rounded-sm" aria-hidden="true" />
            <span>WhatsApp</span>
          </Link>
        </div>
      </div>

      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20"
        aria-label="Ana navigasyon"
      >
        <Logo />
        <div className="hidden items-center gap-1 xl:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/75 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-2 xl:flex">
          <Link href="/#servis-talebi" className={serviceLinkClass}>
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
            <div className="flex flex-col gap-8">
              <Logo />
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-2 py-3 text-base font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <Link
                href="/#servis-talebi"
                className={serviceLinkClass}
                onClick={() => setOpen(false)}
              >
                Servis Talebi
              </Link>
              <div className="grid gap-3 border-t border-border pt-6 text-sm">
                {contactItems.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
              <Link
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-md border border-border px-3 py-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Image src="/images/icons/wp.png" alt="" width={16} height={16} className="size-4 rounded-sm" aria-hidden="true" />
                <span>WhatsApp</span>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
