import { describe, expect, it } from "vitest";

import {
  emptyBlogCategoryPolicy,
  shouldExposePublicBlogCategory,
  shouldIncludeBlogCategoryInSitemap,
} from "@/lib/blog/blog-category-policy";

describe("public blog category policy", () => {
  it("exposes active categories with published posts", () => {
    expect(
      shouldExposePublicBlogCategory({
        isActive: true,
        archivedAt: null,
        publishedPostCount: 1,
      })
    ).toBe(true);
  });

  it("hides inactive categories", () => {
    expect(
      shouldExposePublicBlogCategory({
        isActive: false,
        archivedAt: null,
        publishedPostCount: 1,
      })
    ).toBe(false);
  });

  it("uses notFound for empty categories to avoid thin placeholder pages", () => {
    expect(emptyBlogCategoryPolicy).toBe("notFound");
    expect(
      shouldExposePublicBlogCategory({
        isActive: true,
        archivedAt: null,
        publishedPostCount: 0,
      })
    ).toBe(false);
  });

  it("keeps sitemap inclusion aligned with public exposure", () => {
    expect(
      shouldIncludeBlogCategoryInSitemap({
        isActive: true,
        archivedAt: null,
        publishedPostCount: 2,
      })
    ).toBe(true);
    expect(
      shouldIncludeBlogCategoryInSitemap({
        isActive: true,
        archivedAt: new Date(),
        publishedPostCount: 2,
      })
    ).toBe(false);
  });
});
