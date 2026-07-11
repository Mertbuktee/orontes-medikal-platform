import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ConsentRouteScope } from "@/components/consent/ConsentRouteScope";
import { CookieConsentProvider } from "@/components/consent/CookieConsentProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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
      <body className="min-h-screen flex flex-col">
        <CookieConsentProvider>
          <Navbar />

          <main className="flex-1">{children}</main>

          <Footer />
          <ConsentRouteScope />
        </CookieConsentProvider>
      </body>
    </html>
  );
}
