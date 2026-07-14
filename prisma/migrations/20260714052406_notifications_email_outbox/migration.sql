-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('SERVICE_REQUEST_NEW', 'SERVICE_REQUEST_ASSIGNED', 'SERVICE_REQUEST_STATUS_CHANGED', 'SERVICE_REQUEST_NOTE_ADDED', 'CONTENT_PUBLISHED', 'CONTENT_SCHEDULED', 'SECURITY_ALERT', 'PASSWORD_CHANGED', 'MFA_CHANGED', 'SESSION_REVOKED', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED', 'RETRY_SCHEDULED', 'CANCELLED');

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "message" VARCHAR(1000) NOT NULL,
    "linkUrl" VARCHAR(300),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDelivery" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT,
    "templateKey" VARCHAR(120) NOT NULL,
    "templatePayload" JSONB NOT NULL,
    "recipient" VARCHAR(254) NOT NULL,
    "subject" VARCHAR(220) NOT NULL,
    "provider" VARCHAR(60) NOT NULL,
    "providerMessageId" VARCHAR(180),
    "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "nextAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorCode" VARCHAR(120),
    "errorSummary" VARCHAR(500),
    "idempotencyKey" VARCHAR(220),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDeliveryAttempt" (
    "id" TEXT NOT NULL,
    "emailDeliveryId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "EmailDeliveryStatus" NOT NULL,
    "errorCode" VARCHAR(120),
    "errorSummary" VARCHAR(500),
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailDeliveryAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreference_category_idx" ON "NotificationPreference"("category");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_category_key" ON "NotificationPreference"("userId", "category");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_category_idx" ON "Notification"("category");

-- CreateIndex
CREATE INDEX "Notification_expiresAt_idx" ON "Notification"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailDelivery_idempotencyKey_key" ON "EmailDelivery"("idempotencyKey");

-- CreateIndex
CREATE INDEX "EmailDelivery_status_nextAttemptAt_idx" ON "EmailDelivery"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "EmailDelivery_recipient_idx" ON "EmailDelivery"("recipient");

-- CreateIndex
CREATE INDEX "EmailDelivery_templateKey_idx" ON "EmailDelivery"("templateKey");

-- CreateIndex
CREATE INDEX "EmailDelivery_createdAt_idx" ON "EmailDelivery"("createdAt");

-- CreateIndex
CREATE INDEX "EmailDelivery_notificationId_idx" ON "EmailDelivery"("notificationId");

-- CreateIndex
CREATE INDEX "EmailDeliveryAttempt_emailDeliveryId_idx" ON "EmailDeliveryAttempt"("emailDeliveryId");

-- CreateIndex
CREATE INDEX "EmailDeliveryAttempt_attemptedAt_idx" ON "EmailDeliveryAttempt"("attemptedAt");

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDelivery" ADD CONSTRAINT "EmailDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDeliveryAttempt" ADD CONSTRAINT "EmailDeliveryAttempt_emailDeliveryId_fkey" FOREIGN KEY ("emailDeliveryId") REFERENCES "EmailDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
