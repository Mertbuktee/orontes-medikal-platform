import type { Metadata } from 'next';

import { absoluteUrl } from '@/config/site';

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  siteName?: string;
};

export function createPageMetadata({
  title,
  description,
  path,
  siteName,
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName,
      type: 'website',
      locale: 'tr_TR',
    },
  };
}
