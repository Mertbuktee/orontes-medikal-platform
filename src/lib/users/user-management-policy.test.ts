import { describe, expect, it } from "vitest";

import {
  canAssignRole,
  canManageUser,
  getAssignableRolesForActor,
} from "./user-management-policy";

const superAdmin = { id: "super-1", role: "SUPER_ADMIN" as const };
const admin = { id: "admin-1", role: "ADMIN" as const };
const editor = { id: "editor-1", role: "EDITOR" as const };
const targetSuper = { id: "super-2", role: "SUPER_ADMIN" as const, isActive: true };
const targetAdmin = { id: "admin-2", role: "ADMIN" as const, isActive: true };

describe("user management privilege policy", () => {
  it("allows SUPER_ADMIN to assign every fixed role", () => {
    expect(getAssignableRolesForActor(superAdmin)).toContain("SUPER_ADMIN");
    expect(canAssignRole(superAdmin, "VIEWER")).toBe(true);
  });

  it("prevents ADMIN from creating or assigning SUPER_ADMIN", () => {
    expect(canAssignRole(admin, "SUPER_ADMIN")).toBe(false);
    expect(canManageUser(admin, null, "create", { nextRole: "SUPER_ADMIN" })).toBe(false);
    expect(
      canManageUser(admin, targetAdmin, "assignRole", { nextRole: "SUPER_ADMIN" })
    ).toBe(false);
  });

  it("prevents ADMIN from managing SUPER_ADMIN accounts", () => {
    expect(canManageUser(admin, targetSuper, "update")).toBe(false);
    expect(canManageUser(admin, targetSuper, "deactivate")).toBe(false);
    expect(canManageUser(admin, targetSuper, "forcePasswordReset")).toBe(false);
  });

  it("prevents self role changes and self deactivation", () => {
    expect(
      canManageUser(admin, { ...admin, isActive: true }, "assignRole", {
        nextRole: "VIEWER",
      })
    ).toBe(false);
    expect(canManageUser(admin, { ...admin, isActive: true }, "deactivate")).toBe(false);
  });

  it("protects the last active SUPER_ADMIN from demotion or deactivation", () => {
    expect(
      canManageUser(superAdmin, targetSuper, "assignRole", {
        nextRole: "ADMIN",
        activeSuperAdminCount: 1,
      })
    ).toBe(false);
    expect(
      canManageUser(superAdmin, targetSuper, "deactivate", {
        activeSuperAdminCount: 1,
      })
    ).toBe(false);
  });

  it("rejects non-admin roles for user management mutations", () => {
    expect(canManageUser(editor, targetAdmin, "update")).toBe(false);
  });
});
