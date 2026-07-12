import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import argon2 from "argon2";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

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
const imageBuffer = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/ASP/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/ASP/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Al//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EFBQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EFBQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EFBABAQAAAAAAAAAAAAAAAAAAARD/2gAIAQEAAT8Qf//Z",
  "base64"
);
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

  await prisma.serviceRequest.upsert({
    where: { id: "visual-qa-service-request" },
    create: {
      id: "visual-qa-service-request",
      fullName: "Visual QA Kullanıcı",
      company: "Visual QA Hastanesi",
      phone: "0553 000 00 00",
      email: "visual-qa-request@orontes.local",
      deviceBrand: "QA Marka",
      deviceModel: "QA Model",
      deviceSerialNumber: "QA-001",
      message:
        "Bu kayıt yalnızca admin servis talebi ekranlarının visual QA kontrolü için oluşturulmuştur.",
      status: "REVIEWING",
    },
    update: {
      fullName: "Visual QA Kullanıcı",
      company: "Visual QA Hastanesi",
      phone: "0553 000 00 00",
      email: "visual-qa-request@orontes.local",
      deviceBrand: "QA Marka",
      deviceModel: "QA Model",
      deviceSerialNumber: "QA-001",
      message:
        "Bu kayıt yalnızca admin servis talebi ekranlarının visual QA kontrolü için oluşturulmuştur.",
      status: "REVIEWING",
      archivedAt: null,
    },
  });

  const mediaFiles = [
    ["originals", "visual-qa-media.jpg", "ORIGINAL"],
    ["thumbnails", "visual-qa-media.jpg", "THUMBNAIL"],
    ["medium", "visual-qa-media.jpg", "MEDIUM"],
    ["large", "visual-qa-media.jpg", "LARGE"],
  ] as const;

  for (const [directory, fileName] of mediaFiles) {
    const targetDirectory = path.join(
      process.cwd(),
      "storage",
      "private",
      "media",
      directory
    );
    await mkdir(targetDirectory, { recursive: true });
    await writeFile(path.join(targetDirectory, fileName), imageBuffer);
  }

  await prisma.media.upsert({
    where: { id: "visual-qa-media" },
    create: {
      id: "visual-qa-media",
      storageKey: "originals/visual-qa-media.jpg",
      originalName: "visual-qa-media.jpg",
      mimeType: "image/jpeg",
      size: imageBuffer.length,
      width: 1,
      height: 1,
      altText: "Visual QA medya görseli",
      title: "Visual QA Medya",
      description: "Yalnızca admin medya ekranları için synthetic test kaydı.",
      category: "GENERAL",
      usageType: "IMAGE",
      contentHash:
        "0000000000000000000000000000000000000000000000000000000000000aa1",
      uploadedBy: { connect: { email } },
      variants: {
        create: mediaFiles.map(([directory, fileName, variant]) => ({
          variant,
          storageKey: `${directory}/${fileName}`,
          mimeType: "image/jpeg",
          width: 1,
          height: 1,
          size: imageBuffer.length,
        })),
      },
    },
    update: {
      storageKey: "originals/visual-qa-media.jpg",
      originalName: "visual-qa-media.jpg",
      mimeType: "image/jpeg",
      size: imageBuffer.length,
      width: 1,
      height: 1,
      altText: "Visual QA medya görseli",
      title: "Visual QA Medya",
      description: "Yalnızca admin medya ekranları için synthetic test kaydı.",
      category: "GENERAL",
      usageType: "IMAGE",
      archivedAt: null,
      uploadedBy: { connect: { email } },
    },
  });

  await prisma.mediaVariant.deleteMany({
    where: { mediaId: "visual-qa-media" },
  });
  await prisma.mediaVariant.createMany({
    data: mediaFiles.map(([directory, fileName, variant]) => ({
      mediaId: "visual-qa-media",
      variant,
      storageKey: `${directory}/${fileName}`,
      mimeType: "image/jpeg",
      width: 1,
      height: 1,
      size: imageBuffer.length,
    })),
  });
} finally {
  await prisma.$disconnect();
}
