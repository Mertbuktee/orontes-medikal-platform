-- CreateEnum
CREATE TYPE "MediaCategory" AS ENUM ('GENERAL', 'HERO', 'DEVICE', 'SERVICE', 'BLOG', 'SEO', 'BRAND', 'LEGAL');

-- CreateEnum
CREATE TYPE "MediaUsageType" AS ENUM ('IMAGE', 'DOCUMENT', 'LOGO', 'FAVICON', 'OPEN_GRAPH');

-- CreateEnum
CREATE TYPE "MediaVariantType" AS ENUM ('ORIGINAL', 'THUMBNAIL', 'MEDIUM', 'LARGE');

-- AlterTable
ALTER TABLE "Media"
ADD COLUMN "title" VARCHAR(150) NOT NULL DEFAULT 'Untitled media',
ADD COLUMN "description" TEXT,
ADD COLUMN "category" "MediaCategory" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN "usageType" "MediaUsageType" NOT NULL DEFAULT 'IMAGE',
ADD COLUMN "contentHash" VARCHAR(64),
ADD COLUMN "archivedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MediaVariant" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "variant" "MediaVariantType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" VARCHAR(120) NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Media_contentHash_key" ON "Media"("contentHash");

-- CreateIndex
CREATE INDEX "Media_category_idx" ON "Media"("category");

-- CreateIndex
CREATE INDEX "Media_usageType_idx" ON "Media"("usageType");

-- CreateIndex
CREATE INDEX "Media_archivedAt_idx" ON "Media"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MediaVariant_storageKey_key" ON "MediaVariant"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "MediaVariant_mediaId_variant_key" ON "MediaVariant"("mediaId", "variant");

-- CreateIndex
CREATE INDEX "MediaVariant_mediaId_idx" ON "MediaVariant"("mediaId");

-- CreateIndex
CREATE INDEX "MediaVariant_variant_idx" ON "MediaVariant"("variant");

-- AddForeignKey
ALTER TABLE "MediaVariant" ADD CONSTRAINT "MediaVariant_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
