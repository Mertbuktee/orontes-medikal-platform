import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { absoluteUrl, publicRoutes, resolveSiteOrigin } from "@/config/site";
import { createBreadcrumbJsonLd } from "@/lib/seo/structured-data";

const workspaceRoot = process.cwd();

describe("public SEO architecture", () => {
  it("allows a localhost fallback outside production deployments", () => {
    expect(resolveSiteOrigin({})).toBe("http://localhost:3000");
  });

  it("accepts valid HTTPS APP_ORIGIN in production deployments", () => {
    expect(
      resolveSiteOrigin({
        APP_ENV: "production",
        APP_ORIGIN: "https://orontesteknoloji.com",
      })
    ).toBe("https://orontesteknoloji.com");
  });

  it("rejects missing APP_ORIGIN in production deployments", () => {
    expect(() => resolveSiteOrigin({ APP_ENV: "production" })).toThrow(
      "APP_ORIGIN is required"
    );
  });

  it("rejects malformed APP_ORIGIN in production deployments", () => {
    expect(() =>
      resolveSiteOrigin({ APP_ENV: "production", APP_ORIGIN: "not-a-url" })
    ).toThrow("APP_ORIGIN is required");
  });

  it("rejects HTTP APP_ORIGIN in production deployments", () => {
    expect(() =>
      resolveSiteOrigin({
        APP_ENV: "production",
        APP_ORIGIN: "http://orontesteknoloji.com",
      })
    ).toThrow("APP_ORIGIN must use HTTPS");
  });

  it("rejects localhost APP_ORIGIN in production deployments", () => {
    expect(() =>
      resolveSiteOrigin({
        APP_ENV: "production",
        APP_ORIGIN: "https://localhost:3000",
      })
    ).toThrow("APP_ORIGIN cannot be localhost");

    expect(() =>
      resolveSiteOrigin({
        APP_ENV: "production",
        APP_ORIGIN: "https://127.0.0.1:3000",
      })
    ).toThrow("APP_ORIGIN cannot be localhost");
  });

  it("keeps public route titles and descriptions unique", () => {
    const titles = publicRoutes.map((route) => route.title);
    const descriptions = publicRoutes.map((route) => route.description);

    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it("sitemap includes every public route and excludes admin and API routes", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);

    for (const route of publicRoutes) {
      expect(urls).toContain(absoluteUrl(route.path));
    }

    expect(urls.some((url) => url.includes("/api/"))).toBe(false);
    expect(urls.some((url) => url.includes("/admin"))).toBe(false);
  });

  it("robots points to sitemap and excludes private route families", () => {
    const result = robots();

    expect(result.sitemap).toBe(absoluteUrl("/sitemap.xml"));
    expect(JSON.stringify(result.rules)).toContain("/api/");
    expect(JSON.stringify(result.rules)).toContain("/admin/");
  });

  it("public app routes have page files", () => {
    for (const route of publicRoutes) {
      if (route.path === "/") {
        expect(existsSync(path.join(workspaceRoot, "src/app/(public)/page.tsx"))).toBe(true);
        continue;
      }

      expect(
        existsSync(
          path.join(
            workspaceRoot,
            "src/app/(public)",
            route.path.slice(1),
            "page.tsx"
          )
        )
      ).toBe(true);
    }
  });

  it("public source does not keep legacy hash-only links or placeholder hrefs", () => {
    const sourceFiles = [
      "src/components/layout/Navbar.tsx",
      "src/components/layout/Footer.tsx",
      "src/sections/Services/Services.tsx",
      "src/sections/Devices/Devices.tsx",
      "src/sections/BlogPreview/BlogPreview.tsx",
      "src/app/(public)/not-found.tsx",
    ];

    for (const file of sourceFiles) {
      const content = readFileSync(path.join(workspaceRoot, file), "utf8");

      expect(content).not.toContain('href="#"');
      expect(content).not.toContain('href="/#');
    }
  });

  it("breadcrumb JSON-LD is generated without invented review data", () => {
    const jsonLd = createBreadcrumbJsonLd([
      { name: "Ana Sayfa", path: "/" },
      { name: "Cihazlar", path: "/cihazlar" },
    ]);

    expect(jsonLd["@type"]).toBe("BreadcrumbList");
    expect(JSON.stringify(jsonLd)).not.toContain("AggregateRating");
    expect(JSON.stringify(jsonLd)).not.toContain("review");
  });
});
