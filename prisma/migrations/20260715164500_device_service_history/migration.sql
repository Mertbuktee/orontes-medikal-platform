-- CreateTable
CREATE TABLE "DeviceServiceHistory" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "completedById" TEXT,
    "fullName" VARCHAR(100) NOT NULL,
    "company" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "deviceBrand" VARCHAR(120),
    "deviceModel" VARCHAR(120),
    "deviceSerialNumber" VARCHAR(120),
    "serviceSummary" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceServiceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceServiceHistory_serviceRequestId_key" ON "DeviceServiceHistory"("serviceRequestId");

-- CreateIndex
CREATE INDEX "DeviceServiceHistory_completedAt_idx" ON "DeviceServiceHistory"("completedAt");

-- CreateIndex
CREATE INDEX "DeviceServiceHistory_completedById_idx" ON "DeviceServiceHistory"("completedById");

-- CreateIndex
CREATE INDEX "DeviceServiceHistory_email_idx" ON "DeviceServiceHistory"("email");

-- CreateIndex
CREATE INDEX "DeviceServiceHistory_phone_idx" ON "DeviceServiceHistory"("phone");

-- CreateIndex
CREATE INDEX "DeviceServiceHistory_deviceSerialNumber_idx" ON "DeviceServiceHistory"("deviceSerialNumber");

-- CreateIndex
CREATE INDEX "DeviceServiceHistory_deviceBrand_deviceModel_idx" ON "DeviceServiceHistory"("deviceBrand", "deviceModel");

-- AddForeignKey
ALTER TABLE "DeviceServiceHistory" ADD CONSTRAINT "DeviceServiceHistory_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceServiceHistory" ADD CONSTRAINT "DeviceServiceHistory_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
