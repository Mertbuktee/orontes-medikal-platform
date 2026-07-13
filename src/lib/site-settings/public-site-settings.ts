import { unstable_cache } from "next/cache";

import { isProductionDeployment, resolveSiteOrigin } from "@/config/site";
import { defaultSiteSettings, type SiteSettings } from "@/lib/site-settings/site-settings-types";

export const SITE_SETTINGS_CACHE_TAG = "site-settings";
export const GLOBAL_SEO_CACHE_TAG = "global-seo";
export const BRANDING_CACHE_TAG = "branding";

export const getPublicSiteSettings = unstable_cache(
  getPublicSiteSettingsUncached,
  ["public-site-settings"],
  {
    tags: [SITE_SETTINGS_CACHE_TAG, GLOBAL_SEO_CACHE_TAG, BRANDING_CACHE_TAG],
    revalidate: 300,
  }
);

export async function getPublicSiteSettingsUncached() {
  try {
    const [{ prisma }, { SiteSettingsRepository }] = await Promise.all([
      import("@/lib/database/prisma"),
      import("@/lib/database/repositories/site-settings"),
    ]);
    return await new SiteSettingsRepository(prisma).getSettings();
  } catch (error) {
    if (isProductionDeployment(process.env)) {
      throw error;
    }

    return defaultSiteSettings;
  }
}

export async function getPublicSiteOrigin() {
  const settings = await getPublicSiteSettingsUncached();
  return resolveSettingsOrigin(settings);
}

export async function publicAbsoluteUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, await getPublicSiteOrigin()).toString();
}

export function resolveSettingsOrigin(settings: SiteSettings) {
  return settings.seo.canonicalOrigin || resolveSiteOrigin(process.env);
}
