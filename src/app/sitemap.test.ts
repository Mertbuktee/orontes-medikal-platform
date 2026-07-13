import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/blog/public-blog", () => ({
  getPublicBlogPosts: async () => [
    {
      slug: "yayindaki-yazi",
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    },
  ],
  getPublicBlogCategoriesWithPublishedPosts: async () => [
    {
      slug: "aktif-kategori",
      updatedAt: new Date("2026-01-03T00:00:00.000Z"),
    },
  ],
}));

describe("sitemap blog entries", () => {
  it("includes public blog posts and useful active category pages only", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain("http://localhost:3000/blog/yayindaki-yazi");
    expect(urls).toContain("http://localhost:3000/blog/kategori/aktif-kategori");
    expect(urls.some((url) => url.includes("/admin"))).toBe(false);
    expect(urls.some((url) => url.includes("/api/"))).toBe(false);
  });
});
