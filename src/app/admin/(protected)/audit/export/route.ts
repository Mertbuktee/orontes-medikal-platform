import { headers } from "next/headers";
import { NextRequest } from "next/server";

import { parseAuditExportSearchParams } from "@/lib/audit/audit-validation";
import { requirePermission } from "@/lib/auth/admin-session";
import { AdminAuthRepository } from "@/lib/auth/admin-auth-repository";
import { getAdminRequestContext } from "@/lib/auth/request-context";
import { prisma } from "@/lib/database/prisma";
import {
  getAuditCsv,
  PrismaAuditLogRepository,
} from "@/lib/database/repositories/audit-logs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await requirePermission("audit.export");
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = parseAuditExportSearchParams(params);
  const repository = new PrismaAuditLogRepository(prisma);
  const items = await repository.exportAuditEvents(parsed);
  const csv = getAuditCsv(items);

  await new AdminAuthRepository(prisma).appendAuditLog({
    actorId: session.userId,
    action: "CREATE",
    entityType: "AuditExport",
    metadata: {
      rowCount: items.length,
      filtersApplied: hasFilters(params),
    },
    context: getAdminRequestContext(await headers()),
  });

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orontes-audit-${date}.csv"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function hasFilters(params: Record<string, string>) {
  return Object.keys(params).some(
    (key) => !["format", "limit", "page", "pageSize"].includes(key)
  );
}
