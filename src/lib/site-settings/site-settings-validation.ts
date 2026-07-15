import { z } from 'zod';

import {
  defaultSiteSettings,
  type SiteSettingGroup,
  type SiteSettings,
} from '@/lib/site-settings/site-settings-types';

const optionalText = (max = 500) => z.string().trim().max(max).default('');
const requiredText = (min = 1, max = 500) =>
  z.string().trim().min(min).max(max);

const optionalUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => !value || isSafeUrl(value), 'Güvenli bir URL girin.')
  .default('');

const optionalCtaUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) => !value || isSafeCtaUrl(value),
    'Güvenli bir bağlantı girin.',
  )
  .default('');

const phoneSchema = z
  .string()
  .trim()
  .max(30)
  .refine((value) => !value || /^\+?[0-9\s()-]{7,30}$/.test(value), {
    message: 'Geçerli bir telefon numarası girin.',
  });

const coordinateSchema = z
  .string()
  .trim()
  .max(32)
  .refine(
    (value) => !value || /^-?\d{1,3}(\.\d{1,12})?$/.test(value),
    'Geçerli bir koordinat girin.',
  )
  .default('');

export const siteSettingSchemas = {
  general: z.object({
    companyName: requiredText(2, 160),
    legalCompanyName: requiredText(2, 220),
    shortCompanyName: requiredText(2, 80),
    companyDescription: requiredText(20, 500),
    companySlogan: optionalText(220),
  }),
  contact: z.object({
    phonePrimary: phoneSchema.min(7),
    phoneSecondary: phoneSchema.default(''),
    emailPrimary: z.string().trim().email().max(254),
    emailSupport: z.string().trim().email().max(254),
  }),
  whatsapp: z.object({
    whatsappNumber: phoneSchema.min(7),
    whatsappMessageDefault: requiredText(5, 240),
  }),
  address: z.object({
    country: requiredText(2, 80),
    city: requiredText(2, 120),
    district: requiredText(2, 120),
    postalCode: optionalText(24),
    addressLine: requiredText(5, 260),
  }),
  map: z.object({
    googleMapsEmbed: optionalUrlSchema,
    googleMapsPlaceId: optionalUrlSchema,
    latitude: coordinateSchema,
    longitude: coordinateSchema,
  }),
  branding: z.object({
    logoMediaId: optionalText(120),
    logoDarkMediaId: optionalText(120),
    faviconMediaId: optionalText(120),
    appleTouchIconMediaId: optionalText(120),
    defaultOgImageMediaId: optionalText(120),
    logoFallbackPath: z.string().trim().startsWith('/').max(260),
  }),
  seo: z.object({
    defaultTitle: requiredText(10, 120),
    titleSuffix: requiredText(2, 80),
    defaultDescription: requiredText(50, 240),
    defaultKeywords: optionalText(500),
    canonicalOrigin: z
      .string()
      .trim()
      .max(240)
      .refine((value) => !value || isAbsoluteHttpUrl(value), {
        message: 'Canonical origin mutlak http/https URL olmalıdır.',
      })
      .default(''),
  }),
  social: z.object({
    instagram: optionalUrlSchema,
    facebook: optionalUrlSchema,
    linkedin: optionalUrlSchema,
    youtube: optionalUrlSchema,
    x: optionalUrlSchema,
    threads: optionalUrlSchema,
  }),
  search: z.object({
    googleSiteVerification: optionalText(180),
    bingSiteVerification: optionalText(180),
  }),
  analytics: z.object({
    googleAnalyticsId: optionalText(80),
    googleTagManagerId: optionalText(80),
    metaPixelId: optionalText(80),
  }),
  legal: z.object({
    privacyPolicyEnabled: z.boolean(),
    cookiePolicyEnabled: z.boolean(),
    kvkkEnabled: z.boolean(),
  }),
  footer: z.object({
    copyrightText: requiredText(10, 260),
    footerDescription: requiredText(10, 400),
  }),
  defaultCta: z.object({
    primaryButtonLabel: requiredText(2, 80),
    primaryButtonHref: optionalCtaUrlSchema,
    secondaryButtonLabel: optionalText(80),
    secondaryButtonHref: optionalCtaUrlSchema,
  }),
  system: z.object({
    maintenanceMode: z.boolean(),
    maintenanceMessage: requiredText(10, 500),
  }),
} satisfies {
  [K in SiteSettingGroup]: z.ZodType<SiteSettings[K]>;
};

export function parseSiteSettingGroup<K extends SiteSettingGroup>(
  group: K,
  value: unknown,
): SiteSettings[K] {
  return siteSettingSchemas[group].parse(value) as SiteSettings[K];
}

export function parseSiteSettings(
  raw: Partial<Record<SiteSettingGroup, unknown>>,
) {
  return {
    general: parseSiteSettingGroup(
      'general',
      raw.general ?? defaultSiteSettings.general,
    ),
    contact: parseSiteSettingGroup(
      'contact',
      raw.contact ?? defaultSiteSettings.contact,
    ),
    whatsapp: parseSiteSettingGroup(
      'whatsapp',
      raw.whatsapp ?? defaultSiteSettings.whatsapp,
    ),
    address: parseSiteSettingGroup(
      'address',
      raw.address ?? defaultSiteSettings.address,
    ),
    map: parseSiteSettingGroup('map', raw.map ?? defaultSiteSettings.map),
    branding: parseSiteSettingGroup(
      'branding',
      raw.branding ?? defaultSiteSettings.branding,
    ),
    seo: parseSiteSettingGroup('seo', raw.seo ?? defaultSiteSettings.seo),
    social: parseSiteSettingGroup(
      'social',
      raw.social ?? defaultSiteSettings.social,
    ),
    search: parseSiteSettingGroup(
      'search',
      raw.search ?? defaultSiteSettings.search,
    ),
    analytics: parseSiteSettingGroup(
      'analytics',
      raw.analytics ?? defaultSiteSettings.analytics,
    ),
    legal: parseSiteSettingGroup(
      'legal',
      raw.legal ?? defaultSiteSettings.legal,
    ),
    footer: parseSiteSettingGroup(
      'footer',
      raw.footer ?? defaultSiteSettings.footer,
    ),
    defaultCta: parseSiteSettingGroup(
      'defaultCta',
      raw.defaultCta ?? defaultSiteSettings.defaultCta,
    ),
    system: parseSiteSettingGroup(
      'system',
      raw.system ?? defaultSiteSettings.system,
    ),
  } satisfies SiteSettings;
}

export function validateProductionSiteSettings(settings: SiteSettings) {
  const errors: string[] = [];
  const warnings: string[] = [];

  requireSetting(
    settings.general.companyName,
    'site.general.companyName',
    errors,
  );
  requireSetting(
    settings.general.legalCompanyName,
    'site.general.legalCompanyName',
    errors,
  );
  requireSetting(
    settings.contact.phonePrimary,
    'site.contact.phonePrimary',
    errors,
  );
  requireSetting(
    settings.contact.emailPrimary,
    'site.contact.emailPrimary',
    errors,
  );
  requireSetting(
    settings.contact.emailSupport,
    'site.contact.emailSupport',
    errors,
  );
  requireSetting(
    settings.whatsapp.whatsappNumber,
    'site.whatsapp.whatsappNumber',
    errors,
  );
  requireSetting(settings.address.country, 'site.address.country', errors);
  requireSetting(settings.address.city, 'site.address.city', errors);
  requireSetting(settings.address.district, 'site.address.district', errors);
  requireSetting(
    settings.address.addressLine,
    'site.address.addressLine',
    errors,
  );
  requireSetting(settings.seo.defaultTitle, 'site.seo.defaultTitle', errors);
  requireSetting(
    settings.seo.defaultDescription,
    'site.seo.defaultDescription',
    errors,
  );
  requireSetting(
    settings.footer.copyrightText,
    'site.footer.copyrightText',
    errors,
  );
  requireSetting(
    settings.footer.footerDescription,
    'site.footer.footerDescription',
    errors,
  );

  if (!settings.branding.logoMediaId) {
    warnings.push(
      'site.branding.logoMediaId should be set to a production Media record.',
    );
  }
  if (!settings.branding.faviconMediaId) {
    warnings.push('site.branding.faviconMediaId should be set before launch.');
  }
  if (!settings.branding.defaultOgImageMediaId) {
    warnings.push(
      'site.branding.defaultOgImageMediaId should be set before launch.',
    );
  }
  if (!settings.social.instagram) {
    warnings.push(
      'site.social.instagram is empty; footer will omit Instagram.',
    );
  }
  if (!settings.social.linkedin) {
    warnings.push('site.social.linkedin is empty; footer will omit LinkedIn.');
  }

  return { ok: errors.length === 0, errors, warnings };
}

function requireSetting(value: string, key: string, errors: string[]) {
  if (!value.trim()) {
    errors.push(`${key} is required.`);
  }
}

export function isSafeUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isSafeCtaUrl(value: string) {
  if (value.startsWith('/')) return !value.startsWith('//');
  if (value.startsWith('tel:') || value.startsWith('mailto:')) return true;
  return isSafeUrl(value);
}

function isAbsoluteHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}
