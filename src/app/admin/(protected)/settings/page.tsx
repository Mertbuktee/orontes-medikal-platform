import { Save } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requirePermission } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { SiteSettingsRepository } from "@/lib/database/repositories/site-settings";

import { updateSiteSettingGroup } from "./actions";

type Field = {
  name: string;
  label: string;
  type?: string;
  help?: string;
};

const tabs = [
  ["general", "General"],
  ["branding", "Brand"],
  ["contact", "Contact"],
  ["address", "Address"],
  ["seo", "SEO"],
  ["social", "Social"],
  ["analytics", "Analytics"],
  ["footer", "Footer"],
  ["legal", "Legal"],
  ["system", "System"],
] as const;

export default async function AdminSettingsPage() {
  await requirePermission("settings.view");
  const [settings, mediaItems] = await Promise.all([
    new SiteSettingsRepository(prisma).getSettings(),
    prisma.media.findMany({
      where: {
        archivedAt: null,
        mimeType: { startsWith: "image/" },
        usageType: { in: ["IMAGE", "LOGO", "FAVICON", "OPEN_GRAPH"] },
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        originalName: true,
        mimeType: true,
        width: true,
        height: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Site Yönetimi"
        title="Site Ayarları"
        description="Marka kimliği, iletişim bilgileri, global SEO, sosyal medya, yasal görünürlük ve bakım modunu tek yerden yönetin."
      />

      <nav
        aria-label="Ayar sekmeleri"
        className="sticky top-16 z-10 flex gap-2 overflow-x-auto rounded-3xl border border-slate-200 bg-white/90 p-2 shadow-sm backdrop-blur"
      >
        {tabs.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="inline-flex min-h-10 shrink-0 items-center rounded-2xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <SettingsSection
            id="general"
            title="General"
            description="Şirket adı, açıklama ve marka dili."
            group="general"
            fields={[
              { name: "companyName", label: "Firma Adı" },
              { name: "legalCompanyName", label: "Yasal Ünvan" },
              { name: "shortCompanyName", label: "Kısa Ad" },
              { name: "companySlogan", label: "Slogan" },
              { name: "companyDescription", label: "Açıklama" },
            ]}
            values={settings.general}
          />

          <SettingsSection
            id="contact"
            title="Contact"
            description="Telefon ve e-posta bilgileri tüm public alanlarda buradan okunur."
            group="contact"
            fields={[
              { name: "phonePrimary", label: "Ana Telefon" },
              { name: "phoneSecondary", label: "İkinci Telefon" },
              { name: "emailPrimary", label: "Ana E-posta", type: "email" },
              { name: "emailSupport", label: "Destek E-posta", type: "email" },
            ]}
            values={settings.contact}
          />

          <SettingsSection
            id="whatsapp"
            title="WhatsApp"
            description="WhatsApp numarası ve hazır mesaj metni."
            group="whatsapp"
            fields={[
              { name: "whatsappNumber", label: "WhatsApp Numarası" },
              { name: "whatsappMessageDefault", label: "Hazır Mesaj" },
            ]}
            values={settings.whatsapp}
          />

          <SettingsSection
            id="address"
            title="Address"
            description="Adres ve harita bilgileri."
            group="address"
            fields={[
              { name: "country", label: "Ülke" },
              { name: "city", label: "Şehir" },
              { name: "district", label: "İlçe" },
              { name: "postalCode", label: "Posta Kodu" },
              { name: "addressLine", label: "Adres Satırı" },
            ]}
            values={settings.address}
          />

          <SettingsSection
            id="map"
            title="Map"
            description="Google Maps embed ve konum metadata alanları."
            group="map"
            fields={[
              { name: "googleMapsEmbed", label: "Google Maps Embed URL" },
              { name: "googleMapsPlaceId", label: "Google Maps / Place Link" },
              { name: "latitude", label: "Latitude" },
              { name: "longitude", label: "Longitude" },
            ]}
            values={settings.map}
          />

          <BrandingSection values={settings.branding} mediaItems={mediaItems} />

          <SettingsSection
            id="seo"
            title="SEO"
            description="Global fallback title, description, keywords ve canonical origin."
            group="seo"
            fields={[
              { name: "defaultTitle", label: "Varsayılan Title" },
              { name: "titleSuffix", label: "Title Suffix" },
              { name: "defaultDescription", label: "Varsayılan Description" },
              { name: "defaultKeywords", label: "Keywords" },
              { name: "canonicalOrigin", label: "Canonical Origin" },
            ]}
            values={settings.seo}
          />

          <SettingsSection
            id="social"
            title="Social"
            description="Footer, navbar ve structured data için sosyal medya linkleri."
            group="social"
            fields={[
              { name: "instagram", label: "Instagram" },
              { name: "facebook", label: "Facebook" },
              { name: "linkedin", label: "LinkedIn" },
              { name: "youtube", label: "YouTube" },
              { name: "x", label: "X" },
              { name: "threads", label: "Threads" },
            ]}
            values={settings.social}
          />

          <SettingsSection
            id="analytics"
            title="Analytics / Search"
            description="Doğrulama ve ölçüm ID'leri. Scriptler consent verilmeden çalıştırılmayacak."
            group="analytics"
            fields={[
              { name: "googleAnalyticsId", label: "Google Analytics ID" },
              { name: "googleTagManagerId", label: "Google Tag Manager ID" },
              { name: "metaPixelId", label: "Meta Pixel ID" },
            ]}
            values={settings.analytics}
          />

          <SettingsSection
            id="search"
            title="Search Verification"
            description="Search Console ve Bing doğrulama değerleri."
            group="search"
            fields={[
              { name: "googleSiteVerification", label: "Google Site Verification" },
              { name: "bingSiteVerification", label: "Bing Site Verification" },
            ]}
            values={settings.search}
          />

          <SettingsSection
            id="footer"
            title="Footer"
            description="Footer açıklaması ve copyright metni."
            group="footer"
            fields={[
              { name: "footerDescription", label: "Footer Açıklaması" },
              { name: "copyrightText", label: "Copyright Metni" },
            ]}
            values={settings.footer}
          />

          <FooterAdvancedSection values={settings.footer} />

          <SettingsSection
            id="defaultCta"
            title="Default CTA"
            description="Global CTA varsayılan metin ve linkleri."
            group="defaultCta"
            fields={[
              { name: "primaryButtonLabel", label: "Primary Label" },
              { name: "primaryButtonHref", label: "Primary Link" },
              { name: "secondaryButtonLabel", label: "Secondary Label" },
              { name: "secondaryButtonHref", label: "Secondary Link" },
            ]}
            values={settings.defaultCta}
          />

          <BooleanSection
            id="legal"
            title="Legal"
            description="Yasal sayfa linklerinin görünürlüğü."
            group="legal"
            values={settings.legal}
            fields={[
              ["privacyPolicyEnabled", "Gizlilik Politikası"],
              ["cookiePolicyEnabled", "Çerez Politikası"],
              ["kvkkEnabled", "KVKK"],
            ]}
          />

          <BooleanSection
            id="system"
            title="System"
            description="Maintenance mode public siteyi bakım ekranına alır; admin panel etkilenmez."
            group="system"
            values={settings.system}
            fields={[["maintenanceMode", "Maintenance Mode"]]}
            textFields={[["maintenanceMessage", "Maintenance Mesajı"]]}
          />
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">SEO Önizleme</h2>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-[#1a0dab]">{settings.seo.defaultTitle}</p>
              <p className="mt-1 text-xs text-emerald-700">
                {settings.seo.canonicalOrigin || "APP_ORIGIN"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {settings.seo.defaultDescription}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Maintenance
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Durum:{" "}
              <span className="font-semibold">
                {settings.system.maintenanceMode ? "Aktif" : "Kapalı"}
              </span>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SettingsSection({
  id,
  title,
  description,
  group,
  fields,
  values,
}: {
  id: string;
  title: string;
  description: string;
  group: string;
  fields: Field[];
  values: Record<string, string | boolean>;
}) {
  return (
    <section id={id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeader title={title} description={description} />
      <form action={updateSiteSettingGroup} className="mt-5 grid gap-4 md:grid-cols-2">
        <input type="hidden" name="group" value={group} />
        {fields.map((field) => (
          <label key={field.name} className="grid gap-2 text-sm font-semibold text-slate-700">
            {field.label}
            <input
              name={field.name}
              type={field.type ?? "text"}
              defaultValue={String(values[field.name] ?? "")}
              className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-950 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
            {field.help ? <span className="text-xs text-slate-500">{field.help}</span> : null}
          </label>
        ))}
        <SaveButton />
      </form>
    </section>
  );
}

function BrandingSection({
  values,
  mediaItems,
}: {
  values: Record<string, string>;
  mediaItems: Array<{
    id: string;
    title: string;
    originalName: string | null;
    mimeType: string;
    width: number | null;
    height: number | null;
  }>;
}) {
  const fields = [
    ["logoMediaId", "Logo"],
    ["logoDarkMediaId", "Dark Logo"],
    ["faviconMediaId", "Favicon"],
    ["appleTouchIconMediaId", "Apple Touch Icon"],
    ["defaultOgImageMediaId", "Default OG Image"],
  ] as const;

  return (
    <section id="branding" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeader
        title="Brand"
        description="Logo, favicon ve varsayılan OG görselleri Media Library kayıtlarından seçilir."
      />
      <form action={updateSiteSettingGroup} className="mt-5 grid gap-4 md:grid-cols-2">
        <input type="hidden" name="group" value="branding" />
        {fields.map(([name, label]) => (
          <label key={name} className="grid gap-2 text-sm font-semibold text-slate-700">
            {label}
            <select
              name={name}
              defaultValue={values[name] ?? ""}
              className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-950 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            >
              <option value="">Varsayılan / seçilmedi</option>
              {mediaItems.map((media) => (
                <option key={media.id} value={media.id}>
                  {media.title} ({media.mimeType}
                  {media.width && media.height ? `, ${media.width}x${media.height}` : ""})
                </option>
              ))}
            </select>
          </label>
        ))}
        <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
          Logo Fallback Path
          <input
            name="logoFallbackPath"
            defaultValue={values.logoFallbackPath}
            className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-950 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </label>
        <SaveButton />
      </form>
    </section>
  );
}

function FooterAdvancedSection({
  values,
}: {
  values: Record<string, string | boolean>;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeader
        title="Footer Advanced"
        description="Powered-by, link, renk, harita ve footer alt notunu güvenli alanlarla yönetin."
      />
      <form action={updateSiteSettingGroup} className="mt-5 grid gap-4 md:grid-cols-2">
        <input type="hidden" name="group" value="footer" />
        <input type="hidden" name="footerAdvanced" value="true" />
        <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            name="poweredByEnabled"
            value="true"
            defaultChecked={Boolean(values.poweredByEnabled)}
            className="size-4 accent-orange-500"
          />
          Powered-by göster
        </label>
        <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            name="showMapEmbed"
            value="true"
            defaultChecked={Boolean(values.showMapEmbed)}
            className="size-4 accent-orange-500"
          />
          Footer haritasını göster
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Powered-by Ön Yazı
          <input
            name="poweredByPrefix"
            defaultValue={String(values.poweredByPrefix ?? "")}
            className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-950 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Powered-by Yazısı
          <input
            name="poweredByLabel"
            defaultValue={String(values.poweredByLabel ?? "")}
            className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-950 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Powered-by Linki
          <input
            name="poweredByHref"
            defaultValue={String(values.poweredByHref ?? "")}
            placeholder="https://..."
            className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-950 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Powered-by Rengi
          <input
            name="poweredByColor"
            type="color"
            defaultValue={String(values.poweredByColor ?? "#fb923c")}
            className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Harita Başlığı
          <input
            name="mapTitle"
            defaultValue={String(values.mapTitle ?? "")}
            className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-950 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
          Footer Alt Notu
          <input
            name="footerNote"
            defaultValue={String(values.footerNote ?? "")}
            className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-950 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </label>
        <p className="text-xs leading-5 text-slate-500 md:col-span-2">
          Harita kaynağı üstteki Map bölümündeki Google Maps Embed URL alanından gelir.
        </p>
        <SaveButton />
      </form>
    </section>
  );
}

function BooleanSection({
  id,
  title,
  description,
  group,
  values,
  fields,
  textFields = [],
}: {
  id: string;
  title: string;
  description: string;
  group: string;
  values: Record<string, string | boolean>;
  fields: Array<[string, string]>;
  textFields?: Array<[string, string]>;
}) {
  return (
    <section id={id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeader title={title} description={description} />
      <form action={updateSiteSettingGroup} className="mt-5 grid gap-4">
        <input type="hidden" name="group" value={group} />
        <div className="grid gap-3 md:grid-cols-3">
          {fields.map(([name, label]) => (
            <label
              key={name}
              className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700"
            >
              <input
                type="checkbox"
                name={name}
                value="true"
                defaultChecked={Boolean(values[name])}
                className="size-4 accent-orange-500"
              />
              {label}
            </label>
          ))}
        </div>
        {textFields.map(([name, label]) => (
          <label key={name} className="grid gap-2 text-sm font-semibold text-slate-700">
            {label}
            <textarea
              name={name}
              defaultValue={String(values[name] ?? "")}
              rows={4}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-950 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </label>
        ))}
        <SaveButton />
      </form>
    </section>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function SaveButton() {
  return (
    <div className="md:col-span-2">
      <button className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-semibold text-white shadow-sm shadow-orange-500/20 transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
        <Save className="size-4" aria-hidden="true" />
        Kaydet
      </button>
    </div>
  );
}
