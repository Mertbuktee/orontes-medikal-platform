import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getMediaVariantUrl } from "@/lib/media/media-url";
import {
  getPublicSiteOrigin,
  getPublicSiteSettings,
} from "@/lib/site-settings/public-site-settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const [settings, origin] = await Promise.all([
    getPublicSiteSettings(),
    getPublicSiteOrigin(),
  ]);
  const defaultOgImage = settings.branding.defaultOgImageMediaId
    ? getMediaVariantUrl(settings.branding.defaultOgImageMediaId, "LARGE")
    : undefined;

  return {
    metadataBase: new URL(origin),
    title: {
      default: settings.seo.defaultTitle,
      template: `%s | ${settings.seo.titleSuffix}`,
    },
    description: settings.seo.defaultDescription,
    keywords: settings.seo.defaultKeywords
      ? settings.seo.defaultKeywords.split(",").map((item) => item.trim())
      : undefined,
    verification: {
      google: settings.search.googleSiteVerification || undefined,
      other: settings.search.bingSiteVerification
        ? { "msvalidate.01": settings.search.bingSiteVerification }
        : undefined,
    },
    openGraph: {
      title: settings.seo.defaultTitle,
      description: settings.seo.defaultDescription,
      siteName: settings.general.companyName,
      locale: "tr_TR",
      type: "website",
      images: defaultOgImage ? [{ url: defaultOgImage }] : undefined,
    },
  };
}

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
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
