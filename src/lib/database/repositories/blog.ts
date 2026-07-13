import type { ContentStatus, Prisma, PrismaClient } from "@prisma/client";

import type { BlogContentBlock } from "@/lib/blog/blog-types";
import { blogContentSchema, blogPostInputSchema } from "@/lib/blog/blog-validation";

export type BlogListInput = {
  query?: string;
  status?: ContentStatus | "all";
  categoryId?: string;
  archived?: "active" | "archived" | "all";
  page?: number;
  pageSize?: number;
  sort?: "newest" | "oldest" | "updated" | "published";
};

export type BlogPostInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: BlogContentBlock[];
  categoryId: string | null;
  coverImageId: string | null;
  openGraphImageId: string | null;
  authorId: string | null;
  seoTitle: string;
  seoDescription: string;
  isFeatured: boolean;
  scheduledFor: Date | null;
};

export type BlogCategoryInput = {
  name: string;
  slug: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  order: number;
  isActive: boolean;
};

const blogPostSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  status: true,
  categoryId: true,
  category: { select: { id: true, name: true, slug: true, isActive: true } },
  coverImageId: true,
  coverImage: {
    select: {
      id: true,
      title: true,
      altText: true,
      mimeType: true,
      width: true,
      height: true,
      archivedAt: true,
    },
  },
  openGraphImageId: true,
  openGraphImage: {
    select: { id: true, title: true, altText: true, archivedAt: true },
  },
  authorId: true,
  author: { select: { id: true, name: true, email: true, isActive: true } },
  seoTitle: true,
  seoDescription: true,
  isFeatured: true,
  publishedAt: true,
  scheduledFor: true,
  createdById: true,
  updatedById: true,
  createdAt: true,
  updatedAt: true,
  archivedAt: true,
  _count: { select: { revisions: true } },
} satisfies Prisma.BlogPostSelect;

export class PrismaBlogRepository {
  constructor(private readonly client: PrismaClient) {}

  async listAdminPosts(input: BlogListInput = {}) {
    const page = normalizePage(input.page);
    const pageSize = normalizePageSize(input.pageSize);
    const where = buildBlogWhere(input);

    const [items, total] = await this.client.$transaction([
      this.client.blogPost.findMany({
        where,
        orderBy: getBlogOrderBy(input.sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: blogPostSelect,
      }),
      this.client.blogPost.count({ where }),
    ]);

    return {
      items: items.map(mapAdminBlogPost),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getAdminPostById(id: string) {
    const post = await this.client.blogPost.findUnique({
      where: { id },
      select: blogPostSelect,
    });

    return post ? mapAdminBlogPost(post) : null;
  }

  async getPublicPostBySlug(slug: string) {
    const now = new Date();
    const post = await this.client.blogPost.findFirst({
      where: publicPostWhere({ slug, now }),
      select: blogPostSelect,
    });

    return post ? mapPublicBlogPost(post) : null;
  }

  async listPublicPublishedPosts(input: {
    limit?: number;
    categorySlug?: string;
    query?: string;
    featuredOnly?: boolean;
  } = {}) {
    const now = new Date();
    const query = input.query?.trim().slice(0, 120);

    const posts = await this.client.blogPost.findMany({
      where: {
        ...publicPostWhere({ now }),
        isFeatured: input.featuredOnly ? true : undefined,
        category: input.categorySlug
          ? { slug: input.categorySlug, isActive: true, archivedAt: null }
          : undefined,
        ...(query
          ? {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { slug: { contains: query, mode: "insensitive" } },
                { excerpt: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      take: input.limit,
      select: blogPostSelect,
    });

    return posts.map(mapPublicBlogPost);
  }

  async listPublicFeaturedPosts(limit: number) {
    return this.listPublicPublishedPosts({ limit, featuredOnly: true });
  }

  async createPost(input: BlogPostInput, actorId: string) {
    await this.assertPostReferences(input);
    const parsed = blogPostInputSchema.parse(input);

    return this.client.blogPost.create({
      data: {
        ...parsed,
        content: parsed.content as Prisma.InputJsonValue,
        status: "DRAFT",
        createdById: actorId,
        updatedById: actorId,
      },
      select: blogPostSelect,
    });
  }

  async updatePost(id: string, input: BlogPostInput, actorId: string) {
    await this.assertPostReferences(input);
    const parsed = blogPostInputSchema.parse(input);

    return this.client.$transaction(async (tx) => {
      const existing = await tx.blogPost.findUnique({
        where: { id },
        select: {
          title: true,
          excerpt: true,
          content: true,
          seoTitle: true,
          seoDescription: true,
          status: true,
        },
      });

      if (!existing) {
        throw new Error("Blog post not found.");
      }

      if (existing.status === "PUBLISHED") {
        await tx.blogPostRevision.create({
          data: {
            blogPostId: id,
            title: existing.title,
            excerpt: existing.excerpt,
            content: existing.content as Prisma.InputJsonValue,
            seoTitle: existing.seoTitle,
            seoDescription: existing.seoDescription,
            createdById: actorId,
          },
        });
      }

      return tx.blogPost.update({
        where: { id },
        data: {
          ...parsed,
          content: parsed.content as Prisma.InputJsonValue,
          updatedById: actorId,
        },
        select: blogPostSelect,
      });
    });
  }

  async publishPost(id: string, actorId: string) {
    return this.client.$transaction(async (tx) => {
      const post = await tx.blogPost.findUnique({
        where: { id },
        select: blogPostSelect,
      });

      if (!post) throw new Error("Blog post not found.");
      assertPublishable(post);

      return tx.blogPost.update({
        where: { id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          scheduledFor: null,
          archivedAt: null,
          updatedById: actorId,
        },
        select: blogPostSelect,
      });
    });
  }

  unpublishPost(id: string, actorId: string) {
    return this.client.blogPost.update({
      where: { id },
      data: { status: "DRAFT", scheduledFor: null, updatedById: actorId },
      select: blogPostSelect,
    });
  }

  async schedulePost(id: string, scheduledFor: Date, actorId: string) {
    if (scheduledFor.getTime() <= Date.now()) {
      throw new Error("Scheduled date must be in the future.");
    }

    const post = await this.client.blogPost.findUnique({
      where: { id },
      select: blogPostSelect,
    });

    if (!post) throw new Error("Blog post not found.");
    assertPublishable(post);

    return this.client.blogPost.update({
      where: { id },
      data: {
        status: "DRAFT",
        scheduledFor,
        publishedAt: null,
        updatedById: actorId,
      },
      select: blogPostSelect,
    });
  }

  archivePost(id: string, actorId: string) {
    return this.client.blogPost.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
        scheduledFor: null,
        isFeatured: false,
        updatedById: actorId,
      },
      select: blogPostSelect,
    });
  }

  restorePost(id: string, actorId: string) {
    return this.client.blogPost.update({
      where: { id },
      data: { status: "DRAFT", archivedAt: null, updatedById: actorId },
      select: blogPostSelect,
    });
  }

  async duplicatePost(id: string, actorId: string) {
    const post = await this.getAdminPostById(id);
    if (!post) throw new Error("Blog post not found.");

    return this.client.blogPost.create({
      data: {
        title: `${post.title} Kopya`.slice(0, 200),
        slug: `${post.slug}-kopya-${Date.now()}`.slice(0, 180),
        excerpt: post.excerpt,
        content: post.content as Prisma.InputJsonValue,
        status: "DRAFT",
        categoryId: post.categoryId,
        coverImageId: post.coverImageId,
        openGraphImageId: post.openGraphImageId,
        authorId: post.authorId,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        isFeatured: false,
        createdById: actorId,
        updatedById: actorId,
      },
      select: blogPostSelect,
    });
  }

  slugExists(slug: string, excludeId?: string) {
    return this.client.blogPost
      .count({ where: { slug, id: excludeId ? { not: excludeId } : undefined } })
      .then((count) => count > 0);
  }

  async listAdminCategories(input: { includeArchived?: boolean } = {}) {
    const categories = await this.client.blogCategory.findMany({
      where: input.includeArchived ? {} : { archivedAt: null },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            posts: {
              where: {
                status: "PUBLISHED",
                archivedAt: null,
              },
            },
          },
        },
      },
    });

    return categories;
  }

  listPublicCategories() {
    return this.client.blogCategory.findMany({
      where: { isActive: true, archivedAt: null },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, description: true },
    });
  }

  async getPublicCategoryBySlug(slug: string) {
    const now = new Date();
    const category = await this.client.blogCategory.findFirst({
      where: {
        slug,
        isActive: true,
        archivedAt: null,
        posts: { some: publicPostWhere({ now }) },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        seoTitle: true,
        seoDescription: true,
        updatedAt: true,
      },
    });

    return category;
  }

  async listPublicCategoriesWithPublishedPosts() {
    const now = new Date();

    return this.client.blogCategory.findMany({
      where: {
        isActive: true,
        archivedAt: null,
        posts: { some: publicPostWhere({ now }) },
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, updatedAt: true },
    });
  }

  getAdminCategoryById(id: string) {
    return this.client.blogCategory.findUnique({
      where: { id },
      include: { _count: { select: { posts: true } } },
    });
  }

  async createCategory(input: BlogCategoryInput) {
    return this.client.blogCategory.create({ data: input });
  }

  async updateCategory(id: string, input: BlogCategoryInput) {
    return this.client.blogCategory.update({ where: { id }, data: input });
  }

  setCategoryActiveState(id: string, isActive: boolean) {
    return this.client.blogCategory.update({ where: { id }, data: { isActive } });
  }

  archiveCategory(id: string) {
    return this.client.blogCategory.update({
      where: { id },
      data: { archivedAt: new Date(), isActive: false },
    });
  }

  restoreCategory(id: string) {
    return this.client.blogCategory.update({
      where: { id },
      data: { archivedAt: null, isActive: false },
    });
  }

  async moveCategory(id: string, direction: "up" | "down" | "first" | "last") {
    return this.client.$transaction(async (tx) => {
      const categories = await tx.blogCategory.findMany({
        where: { archivedAt: null },
        orderBy: [{ order: "asc" }, { name: "asc" }],
        select: { id: true },
      });
      const index = categories.findIndex((item) => item.id === id);
      if (index < 0) return categories.map((item) => item.id);

      const [item] = categories.splice(index, 1);
      const targetIndex =
        direction === "first"
          ? 0
          : direction === "last"
            ? categories.length
            : direction === "up"
              ? Math.max(0, index - 1)
              : Math.min(categories.length, index + 1);

      categories.splice(targetIndex, 0, item);

      await Promise.all(
        categories.map((category, orderIndex) =>
          tx.blogCategory.update({
            where: { id: category.id },
            data: { order: orderIndex + 1 },
          })
        )
      );

      return categories.map((category) => category.id);
    });
  }

  getDashboardSummary() {
    return Promise.all([
      this.client.blogPost.count({ where: { status: "DRAFT", archivedAt: null } }),
      this.client.blogPost.count({
        where: { status: "PUBLISHED", archivedAt: null },
      }),
      this.client.blogPost.count({
        where: {
          status: "DRAFT",
          scheduledFor: { gt: new Date() },
          archivedAt: null,
        },
      }),
      this.client.blogPost.count({ where: { status: "ARCHIVED" } }),
      this.client.blogPost.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, updatedAt: true, status: true },
      }),
    ]).then(([draft, published, scheduled, archived, latest]) => ({
      draft,
      published,
      scheduled,
      archived,
      latest,
    }));
  }

  listSelectableMedia() {
    return this.client.media.findMany({
      where: {
        archivedAt: null,
        usageType: "IMAGE",
        mimeType: { in: ["image/jpeg", "image/png", "image/webp"] },
        category: { in: ["BLOG", "GENERAL", "SEO"] },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        altText: true,
        mimeType: true,
        width: true,
        height: true,
        variants: { select: { variant: true } },
      },
    });
  }

  listAuthorOptions() {
    return this.client.user.findMany({
      where: {
        isActive: true,
        role: { in: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    });
  }

  private async assertPostReferences(input: BlogPostInput) {
    const mediaIds = [
      input.coverImageId,
      input.openGraphImageId,
      ...input.content
        .filter((block) => block.type === "image")
        .map((block) => block.mediaId),
    ].filter((id): id is string => Boolean(id));

    if (mediaIds.length) {
      const count = await this.client.media.count({
        where: {
          id: { in: mediaIds },
          archivedAt: null,
          usageType: "IMAGE",
          mimeType: { in: ["image/jpeg", "image/png", "image/webp"] },
        },
      });

      if (count !== new Set(mediaIds).size) {
        throw new Error("Invalid media selection.");
      }
    }

    if (input.categoryId) {
      const category = await this.client.blogCategory.findFirst({
        where: { id: input.categoryId, archivedAt: null },
      });
      if (!category) throw new Error("Invalid category.");
    }

    if (input.authorId) {
      const author = await this.client.user.findFirst({
        where: { id: input.authorId, isActive: true },
      });
      if (!author) throw new Error("Invalid author.");
    }
  }
}

export function normalizePage(value: number | undefined) {
  return Number.isFinite(value) && value && value > 0 ? Math.floor(value) : 1;
}

export function normalizePageSize(value: number | undefined) {
  return [20, 50, 100].includes(value ?? 0) ? (value as 20 | 50 | 100) : 20;
}

function buildBlogWhere(input: BlogListInput): Prisma.BlogPostWhereInput {
  const query = input.query?.trim().slice(0, 120);

  return {
    ...(input.archived === "all"
      ? {}
      : input.archived === "archived"
        ? { archivedAt: { not: null } }
        : { archivedAt: null }),
    status: input.status && input.status !== "all" ? input.status : undefined,
    categoryId: input.categoryId || undefined,
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
            { excerpt: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

function getBlogOrderBy(sort: BlogListInput["sort"]): Prisma.BlogPostOrderByWithRelationInput[] {
  if (sort === "oldest") return [{ createdAt: "asc" }];
  if (sort === "updated") return [{ updatedAt: "desc" }];
  if (sort === "published") return [{ publishedAt: "desc" }];
  return [{ createdAt: "desc" }];
}

function publicPostWhere(input: {
  slug?: string;
  now: Date;
}): Prisma.BlogPostWhereInput {
  return {
    slug: input.slug,
    status: "PUBLISHED",
    archivedAt: null,
    publishedAt: { lte: input.now },
    OR: [{ scheduledFor: null }, { scheduledFor: { lte: input.now } }],
    category: { isActive: true, archivedAt: null },
  };
}

function mapAdminBlogPost(post: Prisma.BlogPostGetPayload<{ select: typeof blogPostSelect }>) {
  return {
    ...post,
    content: parseBlogContent(post.content),
  };
}

function mapPublicBlogPost(post: Prisma.BlogPostGetPayload<{ select: typeof blogPostSelect }>) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: parseBlogContent(post.content),
    category: post.category
      ? { name: post.category.name, slug: post.category.slug }
      : null,
    coverImageId: post.coverImageId,
    openGraphImageId: post.openGraphImageId,
    authorName: post.author?.name ?? null,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    isFeatured: post.isFeatured,
  };
}

function parseBlogContent(value: Prisma.JsonValue) {
  const parsed = blogContentSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

function assertPublishable(
  post: Prisma.BlogPostGetPayload<{ select: typeof blogPostSelect }>
) {
  if (post.archivedAt || post.status === "ARCHIVED") {
    throw new Error("Archived posts cannot be published.");
  }
  if (!post.categoryId || !post.category?.isActive || !post.authorId) {
    throw new Error("Category and author are required before publishing.");
  }
  const content = blogContentSchema.safeParse(post.content);
  if (!content.success) {
    throw new Error("Valid article content is required before publishing.");
  }
}
