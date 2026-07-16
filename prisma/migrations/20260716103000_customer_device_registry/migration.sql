CREATE TYPE "CustomerDeviceStatus" AS ENUM ('ACTIVE', 'UNDER_SERVICE', 'OUT_OF_SERVICE', 'RETIRED', 'ARCHIVED');

CREATE TYPE "CustomerDeviceCriticality" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TABLE "Manufacturer" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Manufacturer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeviceModel" (
    "id" TEXT NOT NULL,
    "manufacturerId" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "deviceGroupId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceModel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerDevice" (
    "id" TEXT NOT NULL,
    "publicCode" VARCHAR(32) NOT NULL,
    "customerCompanyId" TEXT NOT NULL,
    "customerLocationId" TEXT NOT NULL,
    "deviceGroupId" TEXT,
    "manufacturerId" TEXT,
    "deviceModelId" TEXT,
    "customManufacturer" VARCHAR(160),
    "customModel" VARCHAR(160),
    "serialNumber" VARCHAR(160) NOT NULL,
    "assetTag" VARCHAR(120),
    "hospitalInventoryNumber" VARCHAR(120),
    "department" VARCHAR(120),
    "room" VARCHAR(120),
    "installationDate" TIMESTAMP(3),
    "purchaseDate" TIMESTAMP(3),
    "warrantyEndDate" TIMESTAMP(3),
    "status" "CustomerDeviceStatus" NOT NULL DEFAULT 'ACTIVE',
    "criticality" "CustomerDeviceCriticality" NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    "lastServiceAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerDevice_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ServiceRequest"
ADD COLUMN "customerDeviceId" TEXT;

CREATE UNIQUE INDEX "Manufacturer_slug_key" ON "Manufacturer"("slug");
CREATE INDEX "Manufacturer_name_idx" ON "Manufacturer"("name");
CREATE INDEX "Manufacturer_isActive_idx" ON "Manufacturer"("isActive");

CREATE INDEX "DeviceModel_manufacturerId_idx" ON "DeviceModel"("manufacturerId");
CREATE INDEX "DeviceModel_deviceGroupId_idx" ON "DeviceModel"("deviceGroupId");
CREATE INDEX "DeviceModel_name_idx" ON "DeviceModel"("name");
CREATE INDEX "DeviceModel_isActive_idx" ON "DeviceModel"("isActive");
CREATE UNIQUE INDEX "DeviceModel_manufacturerId_name_key" ON "DeviceModel"("manufacturerId", "name");

CREATE UNIQUE INDEX "CustomerDevice_publicCode_key" ON "CustomerDevice"("publicCode");
CREATE INDEX "CustomerDevice_publicCode_idx" ON "CustomerDevice"("publicCode");
CREATE INDEX "CustomerDevice_customerCompanyId_idx" ON "CustomerDevice"("customerCompanyId");
CREATE INDEX "CustomerDevice_customerLocationId_idx" ON "CustomerDevice"("customerLocationId");
CREATE INDEX "CustomerDevice_deviceGroupId_idx" ON "CustomerDevice"("deviceGroupId");
CREATE INDEX "CustomerDevice_manufacturerId_idx" ON "CustomerDevice"("manufacturerId");
CREATE INDEX "CustomerDevice_deviceModelId_idx" ON "CustomerDevice"("deviceModelId");
CREATE INDEX "CustomerDevice_serialNumber_idx" ON "CustomerDevice"("serialNumber");
CREATE INDEX "CustomerDevice_assetTag_idx" ON "CustomerDevice"("assetTag");
CREATE INDEX "CustomerDevice_hospitalInventoryNumber_idx" ON "CustomerDevice"("hospitalInventoryNumber");
CREATE INDEX "CustomerDevice_status_idx" ON "CustomerDevice"("status");
CREATE INDEX "CustomerDevice_criticality_idx" ON "CustomerDevice"("criticality");
CREATE INDEX "CustomerDevice_lastServiceAt_idx" ON "CustomerDevice"("lastServiceAt");
CREATE INDEX "CustomerDevice_isActive_idx" ON "CustomerDevice"("isActive");
CREATE INDEX "CustomerDevice_archivedAt_idx" ON "CustomerDevice"("archivedAt");
CREATE INDEX "CustomerDevice_manufacturerId_serialNumber_idx" ON "CustomerDevice"("manufacturerId", "serialNumber");
CREATE INDEX "ServiceRequest_customerDeviceId_idx" ON "ServiceRequest"("customerDeviceId");

ALTER TABLE "DeviceModel" ADD CONSTRAINT "DeviceModel_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeviceModel" ADD CONSTRAINT "DeviceModel_deviceGroupId_fkey" FOREIGN KEY ("deviceGroupId") REFERENCES "DeviceGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerDevice" ADD CONSTRAINT "CustomerDevice_customerCompanyId_fkey" FOREIGN KEY ("customerCompanyId") REFERENCES "CustomerCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerDevice" ADD CONSTRAINT "CustomerDevice_customerLocationId_fkey" FOREIGN KEY ("customerLocationId") REFERENCES "CustomerLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomerDevice" ADD CONSTRAINT "CustomerDevice_deviceGroupId_fkey" FOREIGN KEY ("deviceGroupId") REFERENCES "DeviceGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerDevice" ADD CONSTRAINT "CustomerDevice_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CustomerDevice" ADD CONSTRAINT "CustomerDevice_deviceModelId_fkey" FOREIGN KEY ("deviceModelId") REFERENCES "DeviceModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_customerDeviceId_fkey" FOREIGN KEY ("customerDeviceId") REFERENCES "CustomerDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
