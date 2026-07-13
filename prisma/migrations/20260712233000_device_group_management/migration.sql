ALTER TABLE "DeviceGroup"
ADD COLUMN "imageId" TEXT,
ADD COLUMN "openGraphImageId" TEXT,
ADD COLUMN "createdById" TEXT,
ADD COLUMN "updatedById" TEXT,
ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE INDEX "DeviceGroup_title_idx" ON "DeviceGroup"("title");
CREATE INDEX "DeviceGroup_imageId_idx" ON "DeviceGroup"("imageId");
CREATE INDEX "DeviceGroup_openGraphImageId_idx" ON "DeviceGroup"("openGraphImageId");
CREATE INDEX "DeviceGroup_createdById_idx" ON "DeviceGroup"("createdById");
CREATE INDEX "DeviceGroup_updatedById_idx" ON "DeviceGroup"("updatedById");
CREATE INDEX "DeviceGroup_archivedAt_idx" ON "DeviceGroup"("archivedAt");

ALTER TABLE "DeviceGroup"
ADD CONSTRAINT "DeviceGroup_imageId_fkey"
FOREIGN KEY ("imageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DeviceGroup"
ADD CONSTRAINT "DeviceGroup_openGraphImageId_fkey"
FOREIGN KEY ("openGraphImageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DeviceGroup"
ADD CONSTRAINT "DeviceGroup_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DeviceGroup"
ADD CONSTRAINT "DeviceGroup_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
