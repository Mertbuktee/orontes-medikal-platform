import { absoluteUrl } from '@/config/site';
import type { SiteSettings } from '@/lib/site-settings/site-settings-types';

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export function createBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function createOrganizationJsonLd(settings: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.general.legalCompanyName,
    alternateName: settings.general.companyName,
    url: absoluteUrl('/'),
    email: settings.contact.emailPrimary,
    telephone: settings.contact.phonePrimary,
    sameAs: Object.values(settings.social).filter(Boolean),
  };
}

export function createLocalBusinessJsonLd(settings: SiteSettings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: settings.general.legalCompanyName,
    url: absoluteUrl('/iletisim'),
    email: settings.contact.emailPrimary,
    telephone: settings.contact.phonePrimary,
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.address.addressLine,
      addressLocality: settings.address.district,
      addressRegion: settings.address.city,
      postalCode: settings.address.postalCode || undefined,
      addressCountry: settings.address.country,
    },
    geo:
      settings.map.latitude && settings.map.longitude
        ? {
            '@type': 'GeoCoordinates',
            latitude: settings.map.latitude,
            longitude: settings.map.longitude,
          }
        : undefined,
  };
}

export function createArticleJsonLd(input: {
  path: string;
  headline: string;
  description: string;
  image?: string | null;
  datePublished?: Date | null;
  dateModified: Date;
  authorName?: string | null;
  settings: SiteSettings;
}) {
  const settings = input.settings;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    image: input.image ? [input.image] : undefined,
    datePublished: input.datePublished?.toISOString(),
    dateModified: input.dateModified.toISOString(),
    author: input.authorName
      ? {
          '@type': 'Person',
          name: input.authorName,
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: settings.general.legalCompanyName || settings.general.companyName,
      url: absoluteUrl('/'),
    },
    mainEntityOfPage: absoluteUrl(input.path),
  };
}
