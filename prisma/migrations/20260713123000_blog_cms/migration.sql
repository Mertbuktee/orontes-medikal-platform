-- Blog CMS foundation: structured content, publishing workflow, categories and revisions.

ALTER TABLE "BlogCategory"
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "seoTitle" VARCHAR(180) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "seoDescription" VARCHAR(320) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

ALTER TABLE "BlogPost"
  ALTER COLUMN "title" TYPE VARCHAR(200),
  ALTER COLUMN "slug" TYPE VARCHAR(180),
  ALTER COLUMN "categoryId" DROP NOT NULL,
  ALTER COLUMN "authorId" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "openGraphImageId" TEXT,
  ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "scheduledFor" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "createdById" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedById" TEXT,
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BlogPost_openGraphImageId_fkey'
  ) THEN
    ALTER TABLE "BlogPost"
      ADD CONSTRAINT "BlogPost_openGraphImageId_fkey"
      FOREIGN KEY ("openGraphImageId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BlogPost_createdById_fkey'
  ) THEN
    ALTER TABLE "BlogPost"
      ADD CONSTRAINT "BlogPost_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BlogPost_updatedById_fkey'
  ) THEN
    ALTER TABLE "BlogPost"
      ADD CONSTRAINT "BlogPost_updatedById_fkey"
      FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "BlogPostRevision" (
  "id" TEXT NOT NULL,
  "blogPostId" TEXT NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "excerpt" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "seoTitle" VARCHAR(180) NOT NULL,
  "seoDescription" VARCHAR(320) NOT NULL,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BlogPostRevision_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BlogPostRevision_blogPostId_fkey'
  ) THEN
    ALTER TABLE "BlogPostRevision"
      ADD CONSTRAINT "BlogPostRevision_blogPostId_fkey"
      FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BlogPostRevision_createdById_fkey'
  ) THEN
    ALTER TABLE "BlogPostRevision"
      ADD CONSTRAINT "BlogPostRevision_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "BlogCategory_order_idx" ON "BlogCategory"("order");
CREATE INDEX IF NOT EXISTS "BlogCategory_isActive_order_idx" ON "BlogCategory"("isActive", "order");
CREATE INDEX IF NOT EXISTS "BlogCategory_archivedAt_idx" ON "BlogCategory"("archivedAt");

CREATE INDEX IF NOT EXISTS "BlogPost_status_scheduledFor_idx" ON "BlogPost"("status", "scheduledFor");
CREATE INDEX IF NOT EXISTS "BlogPost_openGraphImageId_idx" ON "BlogPost"("openGraphImageId");
CREATE INDEX IF NOT EXISTS "BlogPost_createdById_idx" ON "BlogPost"("createdById");
CREATE INDEX IF NOT EXISTS "BlogPost_updatedById_idx" ON "BlogPost"("updatedById");
CREATE INDEX IF NOT EXISTS "BlogPost_isFeatured_status_publishedAt_idx" ON "BlogPost"("isFeatured", "status", "publishedAt");
CREATE INDEX IF NOT EXISTS "BlogPost_archivedAt_idx" ON "BlogPost"("archivedAt");

CREATE INDEX IF NOT EXISTS "BlogPostRevision_blogPostId_idx" ON "BlogPostRevision"("blogPostId");
CREATE INDEX IF NOT EXISTS "BlogPostRevision_createdById_idx" ON "BlogPostRevision"("createdById");
CREATE INDEX IF NOT EXISTS "BlogPostRevision_createdAt_idx" ON "BlogPostRevision"("createdAt");
