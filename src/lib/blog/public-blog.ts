import { unstable_cache } from "next/cache";

export const BLOG_POSTS_CACHE_TAG = "blog-posts";
export const BLOG_CATEGORIES_CACHE_TAG = "blog-categories";

export function getBlogPostCacheTag(slug: string) {
  return `blog-post:${slug}`;
}

export const getPublicBlogPosts = unstable_cache(
  async (input?: {
    limit?: number;
    categorySlug?: string;
    query?: string;
    featuredOnly?: boolean;
  }) => {
    const [{ prisma }, { PrismaBlogRepository }] = await Promise.all([
      import("@/lib/database/prisma"),
      import("@/lib/database/repositories/blog"),
    ]);
    const repository = new PrismaBlogRepository(prisma);
    return repository.listPublicPublishedPosts(input);
  },
  ["public-blog-posts"],
  { tags: [BLOG_POSTS_CACHE_TAG, BLOG_CATEGORIES_CACHE_TAG], revalidate: 300 }
);

export async function getPublicBlogPostBySlug(slug: string) {
  const [{ prisma }, { PrismaBlogRepository }] = await Promise.all([
    import("@/lib/database/prisma"),
    import("@/lib/database/repositories/blog"),
  ]);
  const repository = new PrismaBlogRepository(prisma);
  return repository.getPublicPostBySlug(slug);
}

export const getPublicBlogCategories = unstable_cache(
  async () => {
    const [{ prisma }, { PrismaBlogRepository }] = await Promise.all([
      import("@/lib/database/prisma"),
      import("@/lib/database/repositories/blog"),
    ]);
    const repository = new PrismaBlogRepository(prisma);
    return repository.listPublicCategories();
  },
  ["public-blog-categories"],
  { tags: [BLOG_CATEGORIES_CACHE_TAG], revalidate: 300 }
);

export async function getPublicBlogCategoryBySlug(slug: string) {
  const [{ prisma }, { PrismaBlogRepository }] = await Promise.all([
    import("@/lib/database/prisma"),
    import("@/lib/database/repositories/blog"),
  ]);
  return new PrismaBlogRepository(prisma).getPublicCategoryBySlug(slug);
}

export async function getPublicBlogCategoriesWithPublishedPosts() {
  const [{ prisma }, { PrismaBlogRepository }] = await Promise.all([
    import("@/lib/database/prisma"),
    import("@/lib/database/repositories/blog"),
  ]);
  return new PrismaBlogRepository(prisma).listPublicCategoriesWithPublishedPosts();
}
