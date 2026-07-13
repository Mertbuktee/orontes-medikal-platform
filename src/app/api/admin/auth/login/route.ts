import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  AdminAuthRepository,
  normalizeAdminEmail,
  type AuthUserRecord,
} from "@/lib/auth/admin-auth-repository";
import {
  createLoginRateLimitKey,
  isLoginRateLimited,
  recordLoginFailure,
  resetLoginFailures,
} from "@/lib/auth/login-rate-limit";
import { verifyPassword } from "@/lib/auth/password";
import { getAdminRequestContext } from "@/lib/auth/request-context";
import {
  ADMIN_SESSION_COOKIE_NAME,
  getAdminSessionCookieOptions,
  getAdminSessionExpiresAt,
} from "@/lib/auth/session-cookie";
import {
  generateAdminSessionToken,
  hashAdminSessionToken,
} from "@/lib/auth/session-token";
import { prisma } from "@/lib/database/prisma";
import { isSameOriginRequest } from "@/lib/security/origin";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform(normalizeAdminEmail),
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional().default(false),
});

const genericLoginError = "E-posta veya şifre hatalı.";
const rateLimitMessage =
  "Çok fazla giriş denemesi. Lütfen daha sonra tekrar deneyin.";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { success: false, message: "İstek doğrulanamadı." },
      { status: 403 }
    );
  }

  const context = getAdminRequestContext(request.headers);
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: genericLoginError },
      { status: 401 }
    );
  }

  const rateLimitKey = createLoginRateLimitKey(
    parsed.data.email,
    context.ipAddress
  );
  const currentLimit = isLoginRateLimited(rateLimitKey);

  if (!currentLimit.allowed) {
    return NextResponse.json(
      { success: false, message: rateLimitMessage },
      { status: 429 }
    );
  }

  const repository = new AdminAuthRepository(prisma);
  const user = await repository.findUserByEmail(parsed.data.email);
  const authenticated = await isValidLogin(user, parsed.data.password);

  if (!authenticated || !user) {
    const failure = recordLoginFailure(rateLimitKey);

    if (user) {
      const failureRecord = await repository.recordFailedLogin(user.id);
      if (failureRecord.failedLoginCount >= 5) {
        await repository.lockUserUntil(
          user.id,
          new Date(Date.now() + 15 * 60 * 1000)
        );
        await repository.appendAuditLog({
          actorId: user.id,
          action: "ACCOUNT_LOCKED",
          entityType: "User",
          entityId: user.id,
          metadata: { reason: "failed_login_threshold" },
          context,
        });
      }
    }

    await repository.appendAuditLog({
      actorId: user?.id ?? null,
      action: "LOGIN_FAILURE",
      entityType: "AdminAuth",
      metadata: {
        rateLimited: !failure.allowed,
      },
      context,
    });

    return NextResponse.json(
      {
        success: false,
        message: failure.allowed ? genericLoginError : rateLimitMessage,
      },
      { status: failure.allowed ? 401 : 429 }
    );
  }

  resetLoginFailures(rateLimitKey);

  const rawToken = generateAdminSessionToken();
  const expiresAt = getAdminSessionExpiresAt(
    new Date(),
    process.env,
    parsed.data.rememberMe
  );
  const session = await repository.createSession({
    user,
    tokenHash: hashAdminSessionToken(rawToken),
    expiresAt,
    context,
    remembered: parsed.data.rememberMe,
  });

  await repository.appendAuditLog({
    actorId: user.id,
    action: "LOGIN",
    entityType: "AdminSession",
    entityId: session.id,
    metadata: {
      success: true,
      remembered: parsed.data.rememberMe,
    },
    context,
  });

  const response = NextResponse.json({
    success: true,
    redirectTo: "/admin/dashboard",
  });

  response.cookies.set(
    ADMIN_SESSION_COOKIE_NAME,
    rawToken,
    getAdminSessionCookieOptions(process.env, parsed.data.rememberMe)
  );

  return response;
}

async function isValidLogin(user: AuthUserRecord | null, password: string) {
  if (!user || !user.isActive) {
    return false;
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return false;
  }

  return verifyPassword(user.passwordHash, password);
}
