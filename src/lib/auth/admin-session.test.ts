import { describe, expect, it } from "vitest";

import {
  getAdminAccessDecision,
  isAdminDevBypassEnabled,
  type AdminSession,
} from "@/lib/auth/admin-session";

const session = {
  id: "session_1",
  userId: "user_1",
  actorId: "user_1",
  role: "VIEWER",
  name: "Viewer",
  email: "viewer@example.com",
  expiresAt: new Date("2026-01-01T00:00:00.000Z"),
  createdAt: new Date("2025-12-31T12:00:00.000Z"),
  lastSeenAt: new Date("2025-12-31T12:30:00.000Z"),
  remembered: false,
  mode: "authenticated",
} satisfies AdminSession;

describe("admin auth boundary", () => {
  it("keeps ADMIN_DEV_BYPASS disabled by default", () => {
    expect(isAdminDevBypassEnabled({})).toBe(false);
  });

  it("does not allow ADMIN_DEV_BYPASS in production", () => {
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

  it("redirects protected admin routes when no session exists", () => {
    const decision = getAdminAccessDecision(null);

    expect(decision).toEqual({
      status: "redirect",
      location: "/admin/login",
    });
  });

  it("allows SUPER_ADMIN to access admin routes", () => {
    const decision = getAdminAccessDecision(
      { ...session, role: "SUPER_ADMIN", name: "Owner" },
      "/admin/dashboard"
    );

    expect(decision.status).toBe("allow");
  });

  it("returns forbidden for authenticated users outside the panel role", () => {
    const decision = getAdminAccessDecision(session, "/admin/dashboard");

    expect(decision).toEqual({ status: "forbidden" });
  });
});
