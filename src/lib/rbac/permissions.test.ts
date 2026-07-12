import { describe, expect, it } from "vitest";

import {
  canAccessAdminRoute,
  hasPermission,
  permissions,
  rolePermissions,
} from "@/lib/rbac/permissions";

describe("admin RBAC contracts", () => {
  it("maps roles to permissions", () => {
    expect(rolePermissions.SUPER_ADMIN).toContain("users.manage");
    expect(rolePermissions.ADMIN).toContain("settings.manage");
    expect(rolePermissions.EDITOR).toContain("blog.manage");
    expect(rolePermissions.SERVICE_STAFF).toContain("serviceRequests.view");
    expect(rolePermissions.VIEWER).toEqual([
      "dashboard.view",
      "serviceRequests.view",
    ]);
  });

  it("gives SUPER_ADMIN every permission", () => {
    for (const permission of permissions) {
      expect(hasPermission("SUPER_ADMIN", permission)).toBe(true);
    }
  });

  it("prevents VIEWER from managing content", () => {
    expect(hasPermission("VIEWER", "blog.manage")).toBe(false);
    expect(hasPermission("VIEWER", "devices.manage")).toBe(false);
    expect(hasPermission("VIEWER", "settings.manage")).toBe(false);
  });

  it("limits SERVICE_STAFF to service request workflow access", () => {
    expect(hasPermission("SERVICE_STAFF", "serviceRequests.view")).toBe(true);
    expect(hasPermission("SERVICE_STAFF", "serviceRequests.update")).toBe(true);
    expect(hasPermission("SERVICE_STAFF", "serviceRequests.notes.create")).toBe(
      true
    );
    expect(hasPermission("SERVICE_STAFF", "serviceRequests.attachments.view")).toBe(
      true
    );
    expect(hasPermission("SERVICE_STAFF", "serviceRequests.assign")).toBe(false);
    expect(hasPermission("SERVICE_STAFF", "serviceRequests.archive")).toBe(false);
    expect(hasPermission("SERVICE_STAFF", "serviceRequests.delete")).toBe(false);
    expect(hasPermission("SERVICE_STAFF", "blog.manage")).toBe(false);
  });

  it("allows VIEWER to inspect requests without mutating them", () => {
    expect(hasPermission("VIEWER", "serviceRequests.view")).toBe(true);
    expect(hasPermission("VIEWER", "serviceRequests.update")).toBe(false);
    expect(hasPermission("VIEWER", "serviceRequests.notes.create")).toBe(false);
    expect(hasPermission("VIEWER", "serviceRequests.attachments.view")).toBe(false);
  });

  it("hasPermission returns role-specific decisions", () => {
    expect(hasPermission("ADMIN", "settings.manage")).toBe(true);
    expect(hasPermission("ADMIN", "users.manage")).toBe(false);
    expect(hasPermission("EDITOR", "seo.manage")).toBe(true);
    expect(hasPermission("EDITOR", "roles.manage")).toBe(false);
  });

  it("canAccessAdminRoute evaluates protected admin paths", () => {
    expect(canAccessAdminRoute("VIEWER", "/admin/dashboard")).toBe(true);
    expect(canAccessAdminRoute("VIEWER", "/admin/service-requests")).toBe(true);
    expect(canAccessAdminRoute("VIEWER", "/admin/blog")).toBe(false);
    expect(canAccessAdminRoute("SERVICE_STAFF", "/admin/service-requests")).toBe(true);
    expect(canAccessAdminRoute("SERVICE_STAFF", "/admin/devices")).toBe(false);
    expect(canAccessAdminRoute("SUPER_ADMIN", "/admin/audit-log")).toBe(true);
  });
});
