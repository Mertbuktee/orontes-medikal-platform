import { describe, expect, it } from "vitest";

import {
  getAdminAccessDecision,
  getCurrentAdminSession,
  isAdminDevBypassEnabled,
} from "@/lib/auth/admin-session";

describe("admin auth boundary", () => {
  it("keeps ADMIN_DEV_BYPASS disabled by default", () => {
    expect(isAdminDevBypassEnabled({})).toBe(false);
  });

  it("allows development bypass only when explicitly enabled outside production", () => {
    expect(isAdminDevBypassEnabled({ ADMIN_DEV_BYPASS: "true" })).toBe(true);
    expect(
      isAdminDevBypassEnabled({
        ADMIN_DEV_BYPASS: "true",
        APP_ENV: "production",
      })
    ).toBe(false);
    expect(
      isAdminDevBypassEnabled({
        ADMIN_DEV_BYPASS: "true",
        VERCEL_ENV: "production",
      })
    ).toBe(false);
  });

  it("redirects protected admin routes when no session and bypass is false", () => {
    const decision = getAdminAccessDecision(null, {});

    expect(decision).toEqual({
      status: "redirect",
      location: "/admin/login",
    });
  });

  it("returns a clearly marked development bypass session when enabled", async () => {
    const session = await getCurrentAdminSession({ ADMIN_DEV_BYPASS: "true" });

    expect(session).toMatchObject({
      role: "SUPER_ADMIN",
      mode: "development-bypass",
      actorId: null,
    });
  });
});
