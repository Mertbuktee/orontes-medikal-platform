import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import {
  canCreateInitialSuperAdmin,
  parseAdminBootstrapEnv,
} from "../src/lib/auth/bootstrap.ts";
import { hashPassword } from "../src/lib/auth/password.ts";
import { normalizeAdminEmail } from "../src/lib/auth/admin-auth-repository.ts";
import { getRequiredDatabaseUrl } from "../src/lib/database/env.ts";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: getRequiredDatabaseUrl(),
  }),
});

async function main() {
  const { email, name, password } = parseAdminBootstrapEnv();

  const existingSuperAdminCount = await prisma.user.count({
    where: { role: "SUPER_ADMIN" },
  });

  if (!canCreateInitialSuperAdmin(existingSuperAdminCount)) {
    console.log("admin_bootstrap.skipped_super_admin_exists");
    return;
  }

  await prisma.user.create({
    data: {
      email: normalizeAdminEmail(email),
      name: name.trim(),
      passwordHash: await hashPassword(password),
      role: "SUPER_ADMIN",
      isActive: true,
      passwordChangedAt: new Date(),
    },
  });

  console.log("admin_bootstrap.created_super_admin");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error("admin_bootstrap.failed");
    await prisma.$disconnect();
    throw error;
  });
