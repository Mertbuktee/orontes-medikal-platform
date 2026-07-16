-- Customer registry for the technical operations panel.
CREATE TABLE "CustomerCompany" (
    "id" TEXT NOT NULL,
    "legalName" VARCHAR(180) NOT NULL,
    "displayName" VARCHAR(180) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "taxNumber" VARCHAR(50),
    "taxOffice" VARCHAR(120),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerCompany_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerLocation" (
    "id" TEXT NOT NULL,
    "customerCompanyId" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "city" VARCHAR(80) NOT NULL,
    "district" VARCHAR(80) NOT NULL,
    "addressLine" TEXT NOT NULL,
    "department" VARCHAR(120),
    "building" VARCHAR(120),
    "floor" VARCHAR(40),
    "phone" VARCHAR(30),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerLocation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerContact" (
    "id" TEXT NOT NULL,
    "customerCompanyId" TEXT NOT NULL,
    "customerLocationId" TEXT,
    "fullName" VARCHAR(120) NOT NULL,
    "title" VARCHAR(120),
    "department" VARCHAR(120),
    "phone" VARCHAR(30) NOT NULL,
    "email" VARCHAR(254),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerContact_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ServiceRequest"
ADD COLUMN "customerCompanyId" TEXT,
ADD COLUMN "customerLocationId" TEXT,
ADD COLUMN "customerContactId" TEXT;

CREATE INDEX "CustomerCompany_legalName_idx" ON "CustomerCompany"("legalName");
CREATE INDEX "CustomerCompany_displayName_idx" ON "CustomerCompany"("displayName");
CREATE INDEX "CustomerCompany_phone_idx" ON "CustomerCompany"("phone");
CREATE INDEX "CustomerCompany_email_idx" ON "CustomerCompany"("email");
CREATE INDEX "CustomerCompany_taxNumber_idx" ON "CustomerCompany"("taxNumber");
CREATE INDEX "CustomerCompany_isActive_idx" ON "CustomerCompany"("isActive");
CREATE INDEX "CustomerCompany_archivedAt_idx" ON "CustomerCompany"("archivedAt");
CREATE INDEX "CustomerCompany_createdAt_idx" ON "CustomerCompany"("createdAt");

CREATE INDEX "CustomerLocation_customerCompanyId_idx" ON "CustomerLocation"("customerCompanyId");
CREATE INDEX "CustomerLocation_city_idx" ON "CustomerLocation"("city");
CREATE INDEX "CustomerLocation_district_idx" ON "CustomerLocation"("district");
CREATE INDEX "CustomerLocation_isPrimary_idx" ON "CustomerLocation"("isPrimary");
CREATE INDEX "CustomerLocation_isActive_idx" ON "CustomerLocation"("isActive");
CREATE INDEX "CustomerLocation_archivedAt_idx" ON "CustomerLocation"("archivedAt");

CREATE INDEX "CustomerContact_customerCompanyId_idx" ON "CustomerContact"("customerCompanyId");
CREATE INDEX "CustomerContact_customerLocationId_idx" ON "CustomerContact"("customerLocationId");
CREATE INDEX "CustomerContact_fullName_idx" ON "CustomerContact"("fullName");
CREATE INDEX "CustomerContact_phone_idx" ON "CustomerContact"("phone");
CREATE INDEX "CustomerContact_email_idx" ON "CustomerContact"("email");
CREATE INDEX "CustomerContact_isPrimary_idx" ON "CustomerContact"("isPrimary");
CREATE INDEX "CustomerContact_isActive_idx" ON "CustomerContact"("isActive");
CREATE INDEX "CustomerContact_archivedAt_idx" ON "CustomerContact"("archivedAt");

CREATE INDEX "ServiceRequest_customerCompanyId_idx" ON "ServiceRequest"("customerCompanyId");
CREATE INDEX "ServiceRequest_customerLocationId_idx" ON "ServiceRequest"("customerLocationId");
CREATE INDEX "ServiceRequest_customerContactId_idx" ON "ServiceRequest"("customerContactId");

ALTER TABLE "CustomerLocation" ADD CONSTRAINT "CustomerLocation_customerCompanyId_fkey" FOREIGN KEY ("customerCompanyId") REFERENCES "CustomerCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerContact" ADD CONSTRAINT "CustomerContact_customerCompanyId_fkey" FOREIGN KEY ("customerCompanyId") REFERENCES "CustomerCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerContact" ADD CONSTRAINT "CustomerContact_customerLocationId_fkey" FOREIGN KEY ("customerLocationId") REFERENCES "CustomerLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_customerCompanyId_fkey" FOREIGN KEY ("customerCompanyId") REFERENCES "CustomerCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_customerLocationId_fkey" FOREIGN KEY ("customerLocationId") REFERENCES "CustomerLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_customerContactId_fkey" FOREIGN KEY ("customerContactId") REFERENCES "CustomerContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
