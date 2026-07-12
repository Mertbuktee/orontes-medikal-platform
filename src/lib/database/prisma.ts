import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { getRequiredDatabaseUrl } from "@/lib/database/env";

if (typeof window !== "undefined") {
  throw new Error("PrismaClient must only be used on the server.");
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: getRequiredDatabaseUrl(),
    }),
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}
