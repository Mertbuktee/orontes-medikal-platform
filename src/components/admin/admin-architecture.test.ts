import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { adminNavItems } from "@/components/admin/admin-navigation";

const workspaceRoot = process.cwd();

function readSource(filePath: string) {
  return readFileSync(path.join(workspaceRoot, filePath), "utf8");
}

describe("admin architecture foundation", () => {
  it("keeps public homepage available in the public route group", () => {
    expect(existsSync(path.join(workspaceRoot, "src/app/(public)/page.tsx"))).toBe(true);
    expect(existsSync(path.join(workspaceRoot, "src/app/admin/dashboard/page.tsx"))).toBe(false);
    expect(
      existsSync(path.join(workspaceRoot, "src/app/admin/(protected)/dashboard/page.tsx"))
    ).toBe(true);
  });

  it("does not render cookie consent from admin layouts", () => {
    const adminLayout = readSource("src/app/admin/layout.tsx");
    const protectedLayout = readSource("src/app/admin/(protected)/layout.tsx");
    const publicLayout = readSource("src/app/(public)/layout.tsx");

    expect(adminLayout).not.toContain("CookieConsent");
    expect(protectedLayout).not.toContain("CookieConsent");
    expect(publicLayout).toContain("CookieConsentProvider");
    expect(publicLayout).toContain("CookieConsentBanner");
  });

  it("keeps admin navigation inside protected admin routes", () => {
    const catchAllExists = existsSync(
      path.join(workspaceRoot, "src/app/admin/(protected)/[...module]/page.tsx")
    );

    expect(catchAllExists).toBe(true);
    for (const item of adminNavItems) {
      expect(item.href).toMatch(/^\/(admin|technical)\//);
      expect(item.title).toBeTruthy();
      expect(item.requiredPermission).toBeTruthy();
    }
  });

  it("login form has accessible email and password fields", () => {
    const formSource = readSource("src/components/admin/AdminLoginForm.tsx");

    expect(formSource).toContain('htmlFor="admin-email"');
    expect(formSource).toContain('id="admin-email"');
    expect(formSource).toContain('autoComplete="email"');
    expect(formSource).toContain('htmlFor="admin-password"');
    expect(formSource).toContain('id="admin-password"');
    expect(formSource).toContain('autoComplete="current-password"');
    expect(formSource).toContain("Şifreyi göster");
  });
});
