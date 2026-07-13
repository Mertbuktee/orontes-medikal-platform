-- AlterTable
ALTER TABLE "Service"
ADD COLUMN "imageId" TEXT,
ADD COLUMN "openGraphImageId" TEXT,
ADD COLUMN "ctaLabel" VARCHAR(120),
ADD COLUMN "ctaHref" VARCHAR(300),
ADD COLUMN "createdById" TEXT,
ADD COLUMN "updatedById" TEXT,
ADD COLUMN "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Service_imageId_idx" ON "Service"("imageId");

-- CreateIndex
CREATE INDEX "Service_openGraphImageId_idx" ON "Service"("openGraphImageId");

-- CreateIndex
CREATE INDEX "Service_createdById_idx" ON "Service"("createdById");

-- CreateIndex
CREATE INDEX "Service_updatedById_idx" ON "Service"("updatedById");

-- CreateIndex
CREATE INDEX "Service_archivedAt_idx" ON "Service"("archivedAt");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_openGraphImageId_fkey" FOREIGN KEY ("openGraphImageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
