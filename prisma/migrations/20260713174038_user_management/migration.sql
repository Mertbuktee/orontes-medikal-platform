-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "deactivatedAt" TIMESTAMP(3),
ADD COLUMN     "deactivatedById" TEXT,
ADD COLUMN     "deactivationReason" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_updatedAt_idx" ON "User"("updatedAt");

-- CreateIndex
CREATE INDEX "User_createdById_idx" ON "User"("createdById");

-- CreateIndex
CREATE INDEX "User_updatedById_idx" ON "User"("updatedById");

-- CreateIndex
CREATE INDEX "User_deactivatedById_idx" ON "User"("deactivatedById");

-- CreateIndex
CREATE INDEX "User_deactivatedAt_idx" ON "User"("deactivatedAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_deactivatedById_fkey" FOREIGN KEY ("deactivatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
