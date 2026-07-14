import { describe, expect, it } from "vitest";

import {
  presentAuditEvent,
  redactIpAddress,
  sanitizeAuditMetadata,
  stripForbiddenAuditMetadata,
  summarizeUserAgent,
} from "./audit-presentation";

describe("audit presentation", () => {
  it("removes forbidden metadata before persistence", () => {
    const result = stripForbiddenAuditMetadata({
      targetUserId: "user_1",
      password: "secret",
      tokenHash: "hash",
      nested: {
        mfaSecret: "hidden",
        role: "ADMIN",
      },
    });

    expect(result).toEqual({
      targetUserId: "user_1",
      nested: {
        role: "ADMIN",
      },
    });
  });

  it("shows only allowlisted safe metadata", () => {
    const result = sanitizeAuditMetadata({
      fromRole: "EDITOR",
      toRole: "ADMIN",
      email: "user@example.com",
      unknownRawValue: "not shown",
    });

    expect(result).toEqual([
      { label: "Onceki rol", value: "EDITOR" },
      { label: "Yeni rol", value: "ADMIN" },
    ]);
  });

  it("derives known authentication presentation safely", () => {
    const result = presentAuditEvent({
      action: "LOGIN_FAILURE",
      entityType: "AdminAuth",
      metadata: { targetUserId: "user_1" },
    });

    expect(result.category).toBe("AUTHENTICATION");
    expect(result.severity).toBe("WARNING");
    expect(result.success).toBe("failure");
    expect(result.label).toBe("Basarisiz giris");
  });

  it("redacts IP and summarizes user agent", () => {
    expect(redactIpAddress("192.168.1.25")).toBe("192.168.x.x");
    expect(summarizeUserAgent("Mozilla/5.0 Chrome/120")).toContain("Chrome");
  });
});
