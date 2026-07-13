export const emptyBlogCategoryPolicy = "notFound" as const;

export function shouldExposePublicBlogCategory(input: {
  isActive: boolean;
  archivedAt: Date | null;
  publishedPostCount: number;
}) {
  return input.isActive && !input.archivedAt && input.publishedPostCount > 0;
}

export function shouldIncludeBlogCategoryInSitemap(input: {
  isActive: boolean;
  archivedAt: Date | null;
  publishedPostCount: number;
}) {
  return shouldExposePublicBlogCategory(input);
}
