import type { Metadata } from "next";

import { absoluteUrl, siteConfig } from "@/config/site";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
};

export function createPageMetadata({
  title,
  description,
  path,
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
      siteName: siteConfig.name,
      type: "website",
      locale: "tr_TR",
    },
  };
}
