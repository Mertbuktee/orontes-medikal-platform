import { EmailDeliveryStatus, NotificationCategory } from "@prisma/client";
import { z } from "zod";

export const notificationListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().pipe(z.union([z.literal(20), z.literal(50), z.literal(100)])).default(20),
  state: z.enum(["all", "unread", "read"]).default("all"),
  category: z.enum(NotificationCategory).optional(),
});

export const emailDeliveryListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().pipe(z.union([z.literal(20), z.literal(50), z.literal(100)])).default(20),
  status: z.enum(EmailDeliveryStatus).optional(),
  templateKey: z.string().trim().max(120).optional(),
  failedOnly: z.coerce.boolean().default(false),
});

export const notificationPreferenceSchema = z.object({
  category: z.enum(NotificationCategory),
  emailEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
});

export const sendTestEmailSchema = z.object({
  recipient: z.string().trim().email().max(254),
});

export const emailDeliveryActionSchema = z.object({
  id: z.string().min(1).max(160),
});

export const mailWorkerSchema = z.object({
  batchSize: z.coerce.number().int().min(1).max(100).default(25),
});

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
