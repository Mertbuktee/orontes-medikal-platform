import { NextResponse } from "next/server";
import { z } from "zod";

import { isSameOriginRequest } from "@/lib/security/origin";
import {
  consentCookieName,
  consentIdCookieName,
  createCookieConsentRecord,
  DevelopmentCookieConsentRepository,
  encodeConsentCookie,
  type CookieConsentRepository,
} from "@/lib/privacy/cookie-consent";

export const runtime = "nodejs";

const consentSchema = z.object({
  consentId: z.uuid().optional(),
  preferences: z.object({
    necessary: z.literal(true),
    analytics: z.boolean(),
    marketing: z.boolean(),
    functional: z.boolean(),
  }),
});

const repository = new DevelopmentCookieConsentRepository();

export const POST = createCookieConsentHandler({ repository });

export function createCookieConsentHandler({
  repository,
}: {
  repository: CookieConsentRepository;
}) {
  return async function POST(request: Request) {
    try {
      if (!isSameOriginRequest(request)) {
        return NextResponse.json(
          { success: false, message: "İstek kabul edilmedi." },
          { status: 403 }
        );
      }

      const parsed = consentSchema.safeParse(await request.json());

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, message: "Çerez tercihi geçersiz." },
          { status: 400 }
        );
      }

      const record = createCookieConsentRecord(parsed.data);
      await repository.save(record);

      const response = NextResponse.json({
        success: true,
        consentId: record.consentId,
        preferences: record.preferences,
      });
      const cookieOptions = {
        maxAge: 60 * 60 * 24 * 180,
        path: "/",
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
      };

      response.cookies.set(
        consentCookieName,
        encodeConsentCookie(record),
        cookieOptions
      );
      response.cookies.set(consentIdCookieName, record.consentId, cookieOptions);

      return response;
    } catch {
      return NextResponse.json(
        { success: false, message: "Çerez tercihi kaydedilemedi." },
        { status: 500 }
      );
    }
  };
}
