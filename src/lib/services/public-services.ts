import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/database/prisma";
import { PrismaServiceRepository } from "@/lib/database/repositories/services";

export const SERVICES_CACHE_TAG = "services";

const getCachedPublicFeaturedServices = unstable_cache(
  async (limit: number) =>
    new PrismaServiceRepository(prisma).listPublicFeaturedServices(limit),
  ["public-featured-services"],
  { tags: [SERVICES_CACHE_TAG] }
);

const getCachedPublicActiveServices = unstable_cache(
  async () => new PrismaServiceRepository(prisma).listPublicActiveServices(),
  ["public-active-services"],
  { tags: [SERVICES_CACHE_TAG] }
);

export async function getPublicFeaturedServices(limit = 6) {
  try {
    return await getCachedPublicFeaturedServices(limit);
  } catch {
    console.error("services.public_load_failed");
    return [];
  }
}

export async function getPublicActiveServices() {
  try {
    return await getCachedPublicActiveServices();
  } catch {
    console.error("services.public_load_failed");
    return [];
  }
}
