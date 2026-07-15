export const siteSettingKeys = [
  'site.general',
  'site.contact',
  'site.whatsapp',
  'site.address',
  'site.map',
  'site.branding',
  'site.seo',
  'site.social',
  'site.search',
  'site.analytics',
  'site.legal',
  'site.footer',
  'site.defaultCta',
  'site.system',
] as const;

export type SiteSettingKey = (typeof siteSettingKeys)[number];

export type GeneralSettings = {
  companyName: string;
  legalCompanyName: string;
  shortCompanyName: string;
  companyDescription: string;
  companySlogan: string;
};

export type ContactSettings = {
  phonePrimary: string;
  phoneSecondary: string;
  emailPrimary: string;
  emailSupport: string;
};

export type WhatsAppSettings = {
  whatsappNumber: string;
  whatsappMessageDefault: string;
};

export type AddressSettings = {
  country: string;
  city: string;
  district: string;
  postalCode: string;
  addressLine: string;
};

export type MapSettings = {
  googleMapsEmbed: string;
  googleMapsPlaceId: string;
  latitude: string;
  longitude: string;
};

export type BrandingSettings = {
  logoMediaId: string;
  logoDarkMediaId: string;
  faviconMediaId: string;
  appleTouchIconMediaId: string;
  defaultOgImageMediaId: string;
  logoFallbackPath: string;
};

export type SeoSettings = {
  defaultTitle: string;
  titleSuffix: string;
  defaultDescription: string;
  defaultKeywords: string;
  canonicalOrigin: string;
};

export type SocialSettings = {
  instagram: string;
  facebook: string;
  linkedin: string;
  youtube: string;
  x: string;
  threads: string;
};

export type SearchSettings = {
  googleSiteVerification: string;
  bingSiteVerification: string;
};

export type AnalyticsSettings = {
  googleAnalyticsId: string;
  googleTagManagerId: string;
  metaPixelId: string;
};

export type LegalSettings = {
  privacyPolicyEnabled: boolean;
  cookiePolicyEnabled: boolean;
  kvkkEnabled: boolean;
};

export type FooterSettings = {
  copyrightText: string;
  footerDescription: string;
};

export type DefaultCtaSettings = {
  primaryButtonLabel: string;
  primaryButtonHref: string;
  secondaryButtonLabel: string;
  secondaryButtonHref: string;
};

export type SystemSettings = {
  maintenanceMode: boolean;
  maintenanceMessage: string;
};

export type SiteSettings = {
  general: GeneralSettings;
  contact: ContactSettings;
  whatsapp: WhatsAppSettings;
  address: AddressSettings;
  map: MapSettings;
  branding: BrandingSettings;
  seo: SeoSettings;
  social: SocialSettings;
  search: SearchSettings;
  analytics: AnalyticsSettings;
  legal: LegalSettings;
  footer: FooterSettings;
  defaultCta: DefaultCtaSettings;
  system: SystemSettings;
};

export type SiteSettingGroup = keyof SiteSettings;

export const siteSettingGroupToKey: Record<SiteSettingGroup, SiteSettingKey> = {
  general: 'site.general',
  contact: 'site.contact',
  whatsapp: 'site.whatsapp',
  address: 'site.address',
  map: 'site.map',
  branding: 'site.branding',
  seo: 'site.seo',
  social: 'site.social',
  search: 'site.search',
  analytics: 'site.analytics',
  legal: 'site.legal',
  footer: 'site.footer',
  defaultCta: 'site.defaultCta',
  system: 'site.system',
};

export const defaultSiteSettings: SiteSettings = {
  general: {
    companyName: 'Orontes Teknoloji',
    legalCompanyName:
      'Orontes İnovasyon Endüstriyel Ürünler Sanayi Ticaret Ltd. Şti.',
    shortCompanyName: 'Orontes',
    companyDescription:
      'Medikal cihaz bakım, onarım, elektronik kart tamiri ve teknik servis çözümleri.',
    companySlogan:
      'Medikal cihazlarınız için güvenilir teknik servis çözümleri.',
  },
  contact: {
    phonePrimary: '+905536065703',
    phoneSecondary: '',
    emailPrimary: 'info@orontesteknoloji.com',
    emailSupport: 'info@orontesteknoloji.com',
  },
  whatsapp: {
    whatsappNumber: '905536065703',
    whatsappMessageDefault: 'Merhabalar Website Üzerinden İletişime Geçiyorum',
  },
  address: {
    country: 'TR',
    city: 'İstanbul',
    district: 'Bahçelievler',
    postalCode: '',
    addressLine: 'Kocasinan Merkez Mh. Görgülü Sk. No:20/B',
  },
  map: {
    googleMapsEmbed:
      'https://www.google.com/maps?q=Kocasinan%20Merkez%20Mh.%20G%C3%B6rg%C3%BCl%C3%BC%20Sk.%20No%3A20%2FB%20Bah%C3%A7elievler%20%C4%B0stanbul&output=embed',
    googleMapsPlaceId: 'https://maps.app.goo.gl/6RGW6dy3kK4RAax8A',
    latitude: '',
    longitude: '',
  },
  branding: {
    logoMediaId: '',
    logoDarkMediaId: '',
    faviconMediaId: '',
    appleTouchIconMediaId: '',
    defaultOgImageMediaId: '',
    logoFallbackPath: '/images/logo/orontes-logo.png',
  },
  seo: {
    defaultTitle: 'Orontes Teknoloji | Medikal Teknik Servis',
    titleSuffix: 'Orontes Teknoloji',
    defaultDescription:
      'Medikal cihaz teknik servisi, elektronik kart onarımı, mekanik bakım ve periyodik bakım hizmetleri.',
    defaultKeywords:
      'medikal cihaz teknik servis, elektronik kart tamiri, medikal cihaz bakımı',
    canonicalOrigin: '',
  },
  social: {
    instagram: 'https://instagram.com/orontesteknoloji',
    facebook: '',
    linkedin:
      'https://www.linkedin.com/company/orontes-i%CC%87novasyon-ve-end%C3%BCstriyel-%C3%BCr%C3%BCnler-san-tic-ltd-%C5%9Fti/',
    youtube: '',
    x: '',
    threads: '',
  },
  search: {
    googleSiteVerification: '',
    bingSiteVerification: '',
  },
  analytics: {
    googleAnalyticsId: '',
    googleTagManagerId: '',
    metaPixelId: '',
  },
  legal: {
    privacyPolicyEnabled: true,
    cookiePolicyEnabled: true,
    kvkkEnabled: true,
  },
  footer: {
    copyrightText:
      'Orontes İnovasyon Endüstriyel Ürünler Sanayi Ticaret Ltd. Şti. Tüm hakları saklıdır.',
    footerDescription:
      'Medikal cihaz bakım, onarım, elektronik kart tamiri ve teknik servis çözümleri.',
  },
  defaultCta: {
    primaryButtonLabel: 'Servis Talebi Oluştur',
    primaryButtonHref: '/servis-talebi',
    secondaryButtonLabel: 'WhatsApp',
    secondaryButtonHref:
      'https://wa.me/905536065703?text=Merhabalar%20Website%20%C3%9Czerinden%20%C4%B0leti%C5%9Fime%20Ge%C3%A7iyorum',
  },
  system: {
    maintenanceMode: false,
    maintenanceMessage:
      'Web sitemiz kısa süreli bakım modundadır. Lütfen daha sonra tekrar deneyin.',
  },
};

export function formatDisplayPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('90')
    ? digits.slice(2)
    : digits.startsWith('0')
      ? digits.slice(1)
      : digits;
  if (local.length !== 10) return phone;
  return `0${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6, 8)} ${local.slice(8)}`;
}

export function createTelHref(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('90')
    ? digits.slice(2)
    : digits.startsWith('0')
      ? digits.slice(1)
      : digits;
  const normalized = local.length === 10 ? `+90${local}` : `+${digits}`;
  return `tel:${normalized}`;
}

export function createWhatsappHref(input: WhatsAppSettings) {
  const digits = input.whatsappNumber.replace(/\D/g, '');
  const text = encodeURIComponent(input.whatsappMessageDefault);
  return `https://wa.me/${digits}?text=${text}`;
}

export function formatFullAddress(settings: Pick<SiteSettings, 'address'>) {
  const { addressLine, district, city, postalCode } = settings.address;
  return [addressLine, postalCode, district, city].filter(Boolean).join(' / ');
}
