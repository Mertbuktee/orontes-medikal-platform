import { Role } from "@prisma/client";
import { z } from "zod";

import { normalizeAdminEmail } from "@/lib/auth/admin-auth-repository";

export const userPageSizes = [20, 50, 100] as const;

export const userIdSchema = z.string().min(1).max(120);
export const roleSchema = z.enum(Role);

export const userListSearchParamsSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  pageSize: z.coerce
    .number()
    .int()
    .refine((value) => userPageSizes.includes(value as (typeof userPageSizes)[number]))
    .catch(20),
  query: z.string().trim().max(120).optional().catch(undefined),
  role: roleSchema.optional().catch(undefined),
  active: z.enum(["active", "inactive", "all"]).catch("all"),
  mfa: z.enum(["enabled", "disabled", "all"]).catch("all"),
  locked: z.enum(["locked", "unlocked", "all"]).catch("all"),
  sort: z.enum(["newest", "oldest", "updated"]).catch("newest"),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(150),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => normalizeAdminEmail(value)),
  role: roleSchema,
  isActive: z.coerce.boolean().catch(true),
});

export const updateUserSchema = z.object({
  id: userIdSchema,
  name: z.string().trim().min(2).max(150),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => normalizeAdminEmail(value)),
  role: roleSchema,
});

export const userActiveStateSchema = z.object({
  id: userIdSchema,
  reason: z.string().trim().min(5).max(1000).optional(),
});

export const userRoleAssignmentSchema = z.object({
  id: userIdSchema,
  role: roleSchema,
});

export const userSessionRevokeSchema = z.object({
  userId: userIdSchema,
  sessionId: userIdSchema,
});

export const userActionIdSchema = z.object({
  id: userIdSchema,
});
