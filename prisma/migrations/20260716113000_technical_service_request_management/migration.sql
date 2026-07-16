-- CreateEnum
CREATE TYPE "ServicePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TechnicalServiceType" AS ENUM ('REPAIR', 'PREVENTIVE_MAINTENANCE', 'INSPECTION', 'INSTALLATION', 'CALIBRATION_CHECK', 'FIELD_SERVICE', 'WORKSHOP_SERVICE');

-- CreateEnum
CREATE TYPE "ServiceRequestPartOperation" AS ENUM ('USED', 'REPLACED', 'REMOVED');

-- CreateEnum
CREATE TYPE "ServiceRequestTechnicalActionType" AS ENUM ('INSPECTION', 'DIAGNOSIS', 'REPAIR', 'REPLACEMENT', 'CLEANING', 'ADJUSTMENT', 'SOFTWARE', 'TEST', 'CALIBRATION_CHECK', 'OTHER');

-- AlterTable
ALTER TABLE "ServiceRequest"
ADD COLUMN "priority" "ServicePriority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN "serviceType" "TechnicalServiceType" NOT NULL DEFAULT 'REPAIR',
ADD COLUMN "reportedFault" TEXT,
ADD COLUMN "initialAssessment" TEXT,
ADD COLUMN "diagnosis" TEXT,
ADD COLUMN "workPerformed" TEXT,
ADD COLUMN "testResult" TEXT,
ADD COLUMN "finalResult" TEXT,
ADD COLUMN "serviceStartedAt" TIMESTAMP(3),
ADD COLUMN "serviceCompletedAt" TIMESTAMP(3),
ADD COLUMN "completedById" TEXT;

-- Backfill the reported fault from the submitted public message.
UPDATE "ServiceRequest"
SET "reportedFault" = "message"
WHERE "reportedFault" IS NULL;

-- CreateTable
CREATE TABLE "ServiceRequestPart" (
  "id" TEXT NOT NULL,
  "serviceRequestId" TEXT NOT NULL,
  "partName" VARCHAR(180) NOT NULL,
  "partNumber" VARCHAR(120),
  "serialNumber" VARCHAR(120),
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "operation" "ServiceRequestPartOperation" NOT NULL,
  "notes" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ServiceRequestPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequestTechnicalAction" (
  "id" TEXT NOT NULL,
  "serviceRequestId" TEXT NOT NULL,
  "actionType" "ServiceRequestTechnicalActionType" NOT NULL,
  "description" TEXT NOT NULL,
  "performedById" TEXT NOT NULL,
  "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ServiceRequestTechnicalAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceRequest_priority_idx" ON "ServiceRequest"("priority");

-- CreateIndex
CREATE INDEX "ServiceRequest_serviceType_idx" ON "ServiceRequest"("serviceType");

-- CreateIndex
CREATE INDEX "ServiceRequest_serviceStartedAt_idx" ON "ServiceRequest"("serviceStartedAt");

-- CreateIndex
CREATE INDEX "ServiceRequest_serviceCompletedAt_idx" ON "ServiceRequest"("serviceCompletedAt");

-- CreateIndex
CREATE INDEX "ServiceRequest_completedById_idx" ON "ServiceRequest"("completedById");

-- CreateIndex
CREATE INDEX "ServiceRequestPart_serviceRequestId_idx" ON "ServiceRequestPart"("serviceRequestId");

-- CreateIndex
CREATE INDEX "ServiceRequestPart_createdById_idx" ON "ServiceRequestPart"("createdById");

-- CreateIndex
CREATE INDEX "ServiceRequestPart_operation_idx" ON "ServiceRequestPart"("operation");

-- CreateIndex
CREATE INDEX "ServiceRequestPart_createdAt_idx" ON "ServiceRequestPart"("createdAt");

-- CreateIndex
CREATE INDEX "ServiceRequestTechnicalAction_serviceRequestId_idx" ON "ServiceRequestTechnicalAction"("serviceRequestId");

-- CreateIndex
CREATE INDEX "ServiceRequestTechnicalAction_performedById_idx" ON "ServiceRequestTechnicalAction"("performedById");

-- CreateIndex
CREATE INDEX "ServiceRequestTechnicalAction_actionType_idx" ON "ServiceRequestTechnicalAction"("actionType");

-- CreateIndex
CREATE INDEX "ServiceRequestTechnicalAction_performedAt_idx" ON "ServiceRequestTechnicalAction"("performedAt");

-- CreateIndex
CREATE INDEX "ServiceRequestTechnicalAction_createdAt_idx" ON "ServiceRequestTechnicalAction"("createdAt");

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequestPart" ADD CONSTRAINT "ServiceRequestPart_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequestPart" ADD CONSTRAINT "ServiceRequestPart_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequestTechnicalAction" ADD CONSTRAINT "ServiceRequestTechnicalAction_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequestTechnicalAction" ADD CONSTRAINT "ServiceRequestTechnicalAction_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
