import { AuditAction } from "@prisma/client";
import { z } from "zod";

export const auditCategories = [
  "AUTHENTICATION",
  "SESSION",
  "USER_MANAGEMENT",
  "SERVICE_REQUEST",
  "CONTENT",
  "SYSTEM",
  "UNKNOWN",
] as const;

export const auditSeverities = [
  "INFO",
  "NOTICE",
  "WARNING",
  "CRITICAL",
] as const;

export const auditSuccessStates = ["success", "failure", "unknown"] as const;

export const auditPageSizes = [50, 100, 200] as const;

export const auditSortOptions = ["newest", "oldest"] as const;

export const securityRangeOptions = ["24h", "7d", "30d", "90d"] as const;

const dateStringSchema = z
  .string()
  .trim()
  .max(32)
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date");

export const auditListSearchParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().pipe(z.union([
    z.literal(50),
    z.literal(100),
    z.literal(200),
  ])).default(50),
  query: z.string().trim().max(120).default(""),
  action: z.nativeEnum(AuditAction).optional(),
  entityType: z.string().trim().max(120).optional(),
  entityId: z.string().trim().max(160).optional(),
  actorId: z.string().trim().max(160).optional(),
  category: z.enum(auditCategories).optional(),
  severity: z.enum(auditSeverities).optional(),
  success: z.enum(auditSuccessStates).optional(),
  dateFrom: dateStringSchema.optional(),
  dateTo: dateStringSchema.optional(),
  sort: z.enum(auditSortOptions).default("newest"),
});

export const auditExportSearchParamsSchema = auditListSearchParamsSchema
  .omit({ page: true, pageSize: true })
  .extend({
    format: z.literal("csv").default("csv"),
    limit: z.coerce.number().int().min(1).max(10000).default(1000),
  });

export const securityCenterSearchParamsSchema = z.object({
  range: z.enum(securityRangeOptions).default("7d"),
});

export type AuditListInput = z.infer<typeof auditListSearchParamsSchema>;
export type AuditExportInput = z.infer<typeof auditExportSearchParamsSchema>;
export type SecurityRange = z.infer<typeof securityCenterSearchParamsSchema>["range"];

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseAuditListSearchParams(
  params: Record<string, string | string[] | undefined>
) {
  return auditListSearchParamsSchema.parse({
    page: firstParam(params.page),
    pageSize: firstParam(params.pageSize),
    query: firstParam(params.query),
    action: firstParam(params.action),
    entityType: firstParam(params.entityType),
    entityId: firstParam(params.entityId),
    actorId: firstParam(params.actorId),
    category: firstParam(params.category),
    severity: firstParam(params.severity),
    success: firstParam(params.success),
    dateFrom: firstParam(params.dateFrom),
    dateTo: firstParam(params.dateTo),
    sort: firstParam(params.sort),
  });
}

export function parseAuditExportSearchParams(
  params: Record<string, string | string[] | undefined>
) {
  return auditExportSearchParamsSchema.parse({
    format: firstParam(params.format),
    limit: firstParam(params.limit),
    query: firstParam(params.query),
    action: firstParam(params.action),
    entityType: firstParam(params.entityType),
    entityId: firstParam(params.entityId),
    actorId: firstParam(params.actorId),
    category: firstParam(params.category),
    severity: firstParam(params.severity),
    success: firstParam(params.success),
    dateFrom: firstParam(params.dateFrom),
    dateTo: firstParam(params.dateTo),
    sort: firstParam(params.sort),
  });
}

export function parseSecurityRange(value: string | string[] | undefined) {
  return securityCenterSearchParamsSchema.parse({
    range: firstParam(value),
  }).range;
}
