import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ConsentRouteScope } from "@/components/consent/ConsentRouteScope";
import { CookieConsentProvider } from "@/components/consent/CookieConsentProvider";
import { siteConfig } from "@/config/site";
import { createOrganizationJsonLd } from "@/lib/seo/structured-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.origin),
  title: "Orontes Teknoloji | Medikal Teknik Servis",
  description:
    "Medikal cihaz teknik servisi, elektronik kart onarımı, mekanik bakım ve periyodik bakım hizmetleri.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col">
        <CookieConsentProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
          <ConsentRouteScope />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(createOrganizationJsonLd()),
            }}
          />
        </CookieConsentProvider>
      </body>
    </html>
  );
}
