import type { MetadataRoute } from "next";

import { publicAbsoluteUrl } from "@/lib/site-settings/public-site-settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/"],
    },
    sitemap: await publicAbsoluteUrl("/sitemap.xml"),
  };
}
