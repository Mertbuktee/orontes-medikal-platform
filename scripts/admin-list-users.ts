import "./load-local-env.ts";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { getRequiredDatabaseUrl } from "../src/lib/database/env.ts";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: getRequiredDatabaseUrl(),
  }),
});

async function main() {
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { email: "asc" }],
    select: {
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  console.table(
    users.map((user) => ({
      email: user.email,
      name: user.name,
      role: user.role,
      active: user.isActive,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? "-",
      createdAt: user.createdAt.toISOString(),
    }))
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error("admin_list_users.failed");
    await prisma.$disconnect();
    throw error;
  });
