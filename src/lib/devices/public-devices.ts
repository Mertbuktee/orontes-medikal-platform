import { prisma } from "@/lib/database/prisma";
import {
  PrismaDeviceGroupRepository,
  type PublicDeviceGroupDto,
} from "@/lib/database/repositories/device-groups";

export async function getPublicFeaturedDevices(limit = 6) {
  return loadDevices((repository) =>
    repository.listPublicFeaturedDeviceGroups(limit)
  );
}

export async function getPublicActiveDevices() {
  return loadDevices((repository) => repository.listPublicActiveDeviceGroups());
}

async function loadDevices(
  loader: (
    repository: PrismaDeviceGroupRepository
  ) => Promise<PublicDeviceGroupDto[]>
) {
  try {
    return await loader(new PrismaDeviceGroupRepository(prisma));
  } catch {
    console.error("device_groups.public_load_failed");
    return [];
  }
}
