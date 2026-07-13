import { describe, expect, it } from "vitest";

import {
  createDashboardRangeWindow,
  createTimelineBuckets,
  createTrend,
  getBucketKey,
  getPermissionsForRole,
  parseDashboardRange,
} from "@/lib/database/repositories/admin-dashboard";

describe("admin dashboard helpers", () => {
  it("defaults to 30-day range and accepts only allowlisted ranges", () => {
    expect(parseDashboardRange(undefined)).toBe("30d");
    expect(parseDashboardRange("7d")).toBe("7d");
    expect(parseDashboardRange("90d")).toBe("90d");
    expect(parseDashboardRange("danger")).toBe("30d");
  });

  it("creates previous equal-length windows", () => {
    const now = new Date("2026-07-13T12:00:00.000Z");
    const range = createDashboardRangeWindow("7d", now);

    expect(range.from).toEqual(new Date("2026-07-06T12:00:00.000Z"));
    expect(range.previousFrom).toEqual(new Date("2026-06-29T12:00:00.000Z"));
    expect(range.previousTo).toEqual(range.from);
    expect(range.bucket).toBe("day");
  });

  it("handles previous zero trends without misleading percentage", () => {
    expect(createTrend(5, 0)).toEqual({
      current: 5,
      previous: 0,
      delta: 5,
      percent: null,
    });
    expect(createTrend(15, 10).percent).toBe(50);
  });

  it("creates zero-filled timeline buckets", () => {
    const range = createDashboardRangeWindow(
      "7d",
      new Date("2026-07-13T00:00:00.000Z")
    );
    const buckets = createTimelineBuckets(range);

    expect(buckets.length).toBeGreaterThanOrEqual(7);
    expect(buckets.every((bucket) => bucket.count === 0)).toBe(true);
  });

  it("uses Europe/Istanbul date parts for bucket keys", () => {
    const key = getBucketKey(new Date("2026-07-12T21:30:00.000Z"), "day");

    expect(key).toBe("2026-07-13");
  });

  it("keeps role dashboard permissions scoped", () => {
    expect(getPermissionsForRole("SUPER_ADMIN")).toContain("audit.view");
    expect(getPermissionsForRole("EDITOR")).toContain("blog.view");
    expect(getPermissionsForRole("EDITOR")).not.toContain("serviceRequests.view");
    expect(getPermissionsForRole("SERVICE_STAFF")).toContain(
      "serviceRequests.view"
    );
    expect(getPermissionsForRole("SERVICE_STAFF")).not.toContain("blog.view");
  });
});
