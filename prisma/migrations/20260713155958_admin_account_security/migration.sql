-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'ALL_SESSIONS_REVOKED';
ALTER TYPE "AuditAction" ADD VALUE 'PASSWORD_RESET_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE 'PASSWORD_RESET_COMPLETED';
ALTER TYPE "AuditAction" ADD VALUE 'MFA_ENROLLMENT_STARTED';
ALTER TYPE "AuditAction" ADD VALUE 'MFA_ENABLED';
ALTER TYPE "AuditAction" ADD VALUE 'MFA_DISABLED';
ALTER TYPE "AuditAction" ADD VALUE 'MFA_RECOVERY_CODES_REGENERATED';
ALTER TYPE "AuditAction" ADD VALUE 'MFA_CHALLENGE_SUCCESS';
ALTER TYPE "AuditAction" ADD VALUE 'MFA_CHALLENGE_FAILURE';
ALTER TYPE "AuditAction" ADD VALUE 'RECOVERY_CODE_USED';

-- AlterTable
ALTER TABLE "AdminSession" ADD COLUMN     "remembered" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mfaVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "securityVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestedIp" VARCHAR(64),
    "userAgent" VARCHAR(512),

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "encryptedSecret" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MfaCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MfaRecoveryCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfaRecoveryCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE INDEX "PasswordResetToken_usedAt_idx" ON "PasswordResetToken"("usedAt");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_usedAt_expiresAt_idx" ON "PasswordResetToken"("userId", "usedAt", "expiresAt");

-- CreateIndex
CREATE INDEX "MfaCredential_userId_idx" ON "MfaCredential"("userId");

-- CreateIndex
CREATE INDEX "MfaCredential_verifiedAt_idx" ON "MfaCredential"("verifiedAt");

-- CreateIndex
CREATE INDEX "MfaCredential_revokedAt_idx" ON "MfaCredential"("revokedAt");

-- CreateIndex
CREATE INDEX "MfaCredential_userId_revokedAt_idx" ON "MfaCredential"("userId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MfaRecoveryCode_codeHash_key" ON "MfaRecoveryCode"("codeHash");

-- CreateIndex
CREATE INDEX "MfaRecoveryCode_userId_idx" ON "MfaRecoveryCode"("userId");

-- CreateIndex
CREATE INDEX "MfaRecoveryCode_usedAt_idx" ON "MfaRecoveryCode"("usedAt");

-- CreateIndex
CREATE INDEX "MfaRecoveryCode_userId_usedAt_idx" ON "MfaRecoveryCode"("userId", "usedAt");

-- CreateIndex
CREATE INDEX "User_mfaEnabled_idx" ON "User"("mfaEnabled");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MfaCredential" ADD CONSTRAINT "MfaCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MfaRecoveryCode" ADD CONSTRAINT "MfaRecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
