import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { existsSync, readFileSync } from "node:fs";

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const batchSize = normalizeBatchSize(process.env.BLOG_PUBLISH_BATCH_SIZE);
const now = new Date();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const published = [];

try {
  const duePosts = await prisma.blogPost.findMany({
    where: {
      status: "DRAFT",
      archivedAt: null,
      scheduledFor: { lte: now },
    },
    orderBy: { scheduledFor: "asc" },
    take: batchSize,
    select: { id: true, title: true },
  });

  for (const post of duePosts) {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.blogPost.updateMany({
        where: {
          id: post.id,
          status: "DRAFT",
          archivedAt: null,
          scheduledFor: { lte: now },
        },
        data: {
          status: "PUBLISHED",
          publishedAt: now,
          scheduledFor: null,
        },
      });

      if (updated.count !== 1) return false;

      await tx.auditLog.create({
        data: {
          actorId: null,
          action: "PUBLISH",
          entityType: "BlogPost",
          entityId: post.id,
          metadata: { source: "blog-publish-due", scheduled: true },
        },
      });

      return true;
    });

    if (result) published.push(post.id);
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        checked: duePosts.length,
        published: published.length,
        publishedIds: published,
      },
      null,
      2
    )
  );
} finally {
  await prisma.$disconnect();
}

function normalizeBatchSize(value) {
  const parsed = Number(value ?? 25);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 100 ? parsed : 25;
}

function loadLocalEnv() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
