import { NextResponse, type NextRequest } from "next/server";

import { AdminAuthRepository } from "@/lib/auth/admin-auth-repository";
import { getAdminRequestContext } from "@/lib/auth/request-context";
import {
  ADMIN_SESSION_COOKIE_NAME,
  getExpiredAdminSessionCookieOptions,
} from "@/lib/auth/session-cookie";
import { hashAdminSessionToken } from "@/lib/auth/session-token";
import { prisma } from "@/lib/database/prisma";
import { isSameOriginRequest } from "@/lib/security/origin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { success: false, message: "Istek dogrulanamadi." },
      { status: 403 }
    );
  }

  const response = NextResponse.redirect(
    new URL("/admin/login", request.url),
    303
  );
  response.cookies.set(
    ADMIN_SESSION_COOKIE_NAME,
    "",
    getExpiredAdminSessionCookieOptions()
  );

  const rawToken = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!rawToken) {
    return response;
  }

  const context = getAdminRequestContext(request.headers);
  const repository = new AdminAuthRepository(prisma);
  const tokenHash = hashAdminSessionToken(rawToken);
  const session = await repository.findValidSessionByTokenHash(tokenHash);

  await repository.revokeSessionByTokenHash(tokenHash);
  await repository.appendAuditLog({
    actorId: session?.userId ?? null,
    action: "LOGOUT",
    entityType: "AdminSession",
    entityId: session?.id,
    metadata: {
      success: true,
    },
    context,
  });

  return response;
}

export function GET() {
  return NextResponse.json(
    { success: false, message: "Bu islem POST ile yapilmalidir." },
    { status: 405 }
  );
}
