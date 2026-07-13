import { CookieConsentBanner } from "@/components/consent/CookieConsentBanner";
import { CookieConsentProvider } from "@/components/consent/CookieConsentProvider";
import { CookiePreferencesDialog } from "@/components/consent/CookiePreferencesDialog";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { createOrganizationJsonLd } from "@/lib/seo/structured-data";
import { getPublicSiteSettings } from "@/lib/site-settings/public-site-settings";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getPublicSiteSettings();

  return (
    <CookieConsentProvider>
      <div className="flex min-h-screen flex-col">
        {settings.system.maintenanceMode ? (
          <MaintenancePage message={settings.system.maintenanceMessage} />
        ) : (
          <>
            <Navbar />
            <div className="flex-1">{children}</div>
            <Footer />
          </>
        )}
      </div>
      <CookieConsentBanner />
      <CookiePreferencesDialog />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createOrganizationJsonLd(settings)),
        }}
      />
    </CookieConsentProvider>
  );
}

function MaintenancePage({ message }: { message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-white">
      <div className="max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-orange-300">
          Bakım Modu
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Kısa süreli bakımdayız
        </h1>
        <p className="mt-5 text-base leading-8 text-slate-300">{message}</p>
      </div>
    </main>
  );
}
