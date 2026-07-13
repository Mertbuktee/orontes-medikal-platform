import { describe, expect, it } from "vitest";

import {
  blogContentSchema,
  blogSlugSchema,
  createBlogSlug,
} from "@/lib/blog/blog-validation";

describe("blog structured content validation", () => {
  it("accepts valid paragraph and heading blocks", () => {
    const result = blogContentSchema.safeParse([
      { id: "block-1", type: "paragraph", text: "Teknik servis notu." },
      { id: "block-2", type: "heading", level: 2, text: "İlk kontroller" },
    ]);

    expect(result.success).toBe(true);
  });

  it("rejects H1 blocks", () => {
    const result = blogContentSchema.safeParse([
      { id: "block-1", type: "heading", level: 1, text: "Yanlış başlık" },
    ]);

    expect(result.success).toBe(false);
  });

  it("rejects unknown block types and unexpected fields", () => {
    const result = blogContentSchema.safeParse([
      { id: "block-1", type: "html", html: "<script>alert(1)</script>" },
    ]);

    expect(result.success).toBe(false);
  });

  it("rejects empty article content", () => {
    expect(blogContentSchema.safeParse([]).success).toBe(false);
  });

  it("normalizes Turkish titles into URL-safe slugs", () => {
    expect(createBlogSlug("Elektronik Kart Tamirinde Arıza Analizi")).toBe(
      "elektronik-kart-tamirinde-ariza-analizi"
    );
    expect(blogSlugSchema.safeParse("gecerli-blog-slug").success).toBe(true);
    expect(blogSlugSchema.safeParse("Geçersiz Slug").success).toBe(false);
  });
});
