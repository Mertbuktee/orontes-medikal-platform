import { stat } from "node:fs/promises";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { getRequiredDatabaseUrl } from "../src/lib/database/env.ts";
import {
  getDeviceGroupSeedRecords,
  getHeroSeedRecords,
  getServiceSeedRecords,
} from "../src/lib/database/seed-data.ts";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: getRequiredDatabaseUrl(),
  }),
});

async function main() {
  for (const device of getDeviceGroupSeedRecords()) {
    await prisma.deviceGroup.upsert({
      where: { id: device.id },
      create: device,
      update: device,
    });
  }

  for (const service of getServiceSeedRecords()) {
    await prisma.service.upsert({
      where: { id: service.id },
      create: service,
      update: service,
    });
  }

  for (const { media, slide } of getHeroSeedRecords()) {
    const size = await getPublicAssetSize(media.storageKey);

    await prisma.media.upsert({
      where: { id: media.id },
      create: {
        ...media,
        size,
      },
      update: {
        ...media,
        size,
      },
    });

    await prisma.heroSlide.upsert({
      where: { id: slide.id },
      create: slide,
      update: slide,
    });
  }
}

async function getPublicAssetSize(storageKey: string) {
  const relativePath = storageKey.replace(/^public[\\/]/, "");
  const filePath = path.join(process.cwd(), "public", relativePath);

  try {
    const result = await stat(filePath);
    return result.size;
  } catch {
    return 0;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error("database_seed.failed");
    await prisma.$disconnect();
    throw error;
  });
