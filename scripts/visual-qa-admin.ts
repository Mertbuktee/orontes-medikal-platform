import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import argon2 from "argon2";

import { getRequiredDatabaseUrl } from "../src/lib/database/env.ts";

const email = process.env.VISUAL_QA_ADMIN_EMAIL;
const password = process.env.VISUAL_QA_ADMIN_PASSWORD;

if (process.env.APP_ENV === "production" || process.env.VERCEL_ENV === "production") {
  throw new Error("Visual QA admin provisioning is disabled in production.");
}

if (!email || !password) {
  throw new Error("VISUAL_QA_ADMIN_EMAIL and VISUAL_QA_ADMIN_PASSWORD are required.");
}

const adapter = new PrismaPg({ connectionString: getRequiredDatabaseUrl() });
const prisma = new PrismaClient({ adapter });
const passwordHash = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 3,
  parallelism: 1,
  hashLength: 32,
});

try {
  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Visual QA Admin",
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
      passwordChangedAt: new Date(),
    },
    update: {
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
      passwordChangedAt: new Date(),
      lockedUntil: null,
      failedLoginCount: 0,
    },
  });
} finally {
  await prisma.$disconnect();
}
