import { CookieConsentBanner } from "@/components/consent/CookieConsentBanner";
import { CookieConsentProvider } from "@/components/consent/CookieConsentProvider";
import { CookiePreferencesDialog } from "@/components/consent/CookiePreferencesDialog";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { createOrganizationJsonLd } from "@/lib/seo/structured-data";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CookieConsentProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
      <CookieConsentBanner />
      <CookiePreferencesDialog />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createOrganizationJsonLd()),
        }}
      />
    </CookieConsentProvider>
  );
}
