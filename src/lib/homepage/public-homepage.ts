import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/database/prisma";
import { HomepageContentRepository } from "@/lib/database/repositories/homepage-content";

export const HOMEPAGE_CONTENT_CACHE_TAG = "homepage-content";
export const HOMEPAGE_SEO_CACHE_TAG = "homepage-seo";

const getCachedHomepageSections = unstable_cache(
  async () =>
    new HomepageContentRepository(prisma).getPublicHomepageSections(),
  ["public-homepage-sections"],
  { tags: [HOMEPAGE_CONTENT_CACHE_TAG] }
);

const getCachedHomepageSeo = unstable_cache(
  async () => new HomepageContentRepository(prisma).getHomepageSeo(),
  ["public-homepage-seo"],
  { tags: [HOMEPAGE_SEO_CACHE_TAG] }
);

export async function getPublicHomepageSections() {
  try {
    return await getCachedHomepageSections();
  } catch {
    console.error("homepage.public_sections_failed");
    return [];
  }
}

export async function getPublicHomepageSeo() {
  try {
    return await getCachedHomepageSeo();
  } catch {
    console.error("homepage.public_seo_failed");
    return null;
  }
}
