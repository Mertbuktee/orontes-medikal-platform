import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/lib/auth/password.ts";
import { getRequiredDatabaseUrl } from "../src/lib/database/env.ts";

const confirmationPhrase = "ROTATE_ADMIN_PASSWORD";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: getRequiredDatabaseUrl(),
  }),
});

async function main() {
  const email = requireEnv("ADMIN_ROTATE_EMAIL").toLowerCase();
  const password = requireEnv("ADMIN_ROTATE_PASSWORD");
  const confirm = requireEnv("ADMIN_ROTATE_CONFIRM");

  if (confirm !== confirmationPhrase) {
    throw new Error(
      `ADMIN_ROTATE_CONFIRM must be exactly ${confirmationPhrase}.`
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    throw new Error("Admin user was not found.");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        failedLoginCount: 0,
        lockedUntil: null,
        isActive: true,
      },
      select: { id: true },
    }),
    prisma.adminSession.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "PASSWORD_CHANGED",
        entityType: "User",
        entityId: user.id,
        metadata: {
          source: "admin_rotate_password_script",
          role: user.role,
        },
      },
    }),
  ]);

  console.log(`admin_password_rotated ${user.email}`);
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error("admin_rotate_password.failed");
    await prisma.$disconnect();
    throw error;
  });
