import { NextResponse } from "next/server";

import { getCurrentAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/database/prisma";
import { PrismaServiceRequestRepository } from "@/lib/database/repositories/service-requests";
import { hasPermission } from "@/lib/rbac/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentAdminSession();

  if (!session) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  if (!hasPermission(session.role, "serviceRequests.view")) {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  const snapshot = await new PrismaServiceRequestRepository(
    prisma
  ).getLiveSnapshot();

  return NextResponse.json(
    {
      success: true,
      snapshot: {
        totalActive: snapshot.totalActive,
        latestCreated: snapshot.latestCreated
          ? {
              ...snapshot.latestCreated,
              createdAt: snapshot.latestCreated.createdAt.toISOString(),
              updatedAt: snapshot.latestCreated.updatedAt.toISOString(),
            }
          : null,
        latestUpdated: snapshot.latestUpdated
          ? {
              ...snapshot.latestUpdated,
              updatedAt: snapshot.latestUpdated.updatedAt.toISOString(),
            }
          : null,
      },
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}
