import {
  NavbarClient,
  type NavbarContactItem,
  type NavbarSocialItem,
} from "@/components/layout/NavbarClient";
import { getMediaVariantUrl } from "@/lib/media/media-url";
import { getPublicSiteSettings } from "@/lib/site-settings/public-site-settings";
import {
  createTelHref,
  formatDisplayPhone,
} from "@/lib/site-settings/site-settings-types";

export default async function Navbar() {
  const settings = await getPublicSiteSettings();
  const logoSrc = settings.branding.logoMediaId
    ? getMediaVariantUrl(settings.branding.logoMediaId, "MEDIUM")
    : settings.branding.logoFallbackPath;

  const contactItems: NavbarContactItem[] = [
    {
      label: formatDisplayPhone(settings.contact.phonePrimary),
      href: createTelHref(settings.contact.phonePrimary),
      icon: "phone",
      hoverClass: "hover:text-emerald-300",
    },
    {
      label: settings.contact.emailPrimary,
      href: `mailto:${settings.contact.emailPrimary}`,
      icon: "mail",
      hoverClass: "hover:text-sky-300",
    },
    {
      label: `${settings.address.district} / ${settings.address.city}`,
      href: settings.map.googleMapsPlaceId || settings.map.googleMapsEmbed || "/iletisim",
      icon: "map",
      hoverClass: "hover:text-amber-300",
    },
  ];

  const socialLinks: NavbarSocialItem[] = [
    settings.social.instagram
      ? {
          label: "Instagram",
          href: settings.social.instagram,
          icon: "instagram",
          hoverClass:
            "hover:bg-gradient-to-tr hover:from-[#f58529] hover:via-[#dd2a7b] hover:to-[#515bd4] hover:text-white",
        }
      : null,
    settings.social.linkedin
      ? {
          label: "LinkedIn",
          href: settings.social.linkedin,
          icon: "linkedin",
          hoverClass: "hover:bg-[#0a66c2] hover:text-white",
        }
      : null,
  ].filter(Boolean) as NavbarSocialItem[];

  return (
    <NavbarClient
      logoSrc={logoSrc}
      logoAlt={`${settings.general.companyName} logosu`}
      contactItems={contactItems}
      socialLinks={socialLinks}
    />
  );
}
