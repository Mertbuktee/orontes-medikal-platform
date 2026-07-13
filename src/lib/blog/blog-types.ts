import type { ContentStatus } from "@prisma/client";

export type BlogContentBlock =
  | {
      id: string;
      type: "paragraph";
      text: string;
    }
  | {
      id: string;
      type: "heading";
      level: 2 | 3;
      text: string;
    }
  | {
      id: string;
      type: "bulletList" | "numberedList";
      items: string[];
    }
  | {
      id: string;
      type: "quote";
      text: string;
      attribution?: string;
    }
  | {
      id: string;
      type: "image";
      mediaId: string;
      altText: string;
      caption?: string;
    }
  | {
      id: string;
      type: "callout";
      tone: "info" | "warning" | "success";
      title?: string;
      text: string;
    }
  | {
      id: string;
      type: "divider";
    };

export type BlogPostFormValue = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: BlogContentBlock[];
  status: ContentStatus;
  categoryId: string | null;
  coverImageId: string | null;
  openGraphImageId: string | null;
  authorId: string | null;
  seoTitle: string;
  seoDescription: string;
  isFeatured: boolean;
  scheduledFor: string | null;
};

export type BlogCategoryFormValue = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  order: number;
  isActive: boolean;
};

export type PublicBlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: BlogContentBlock[];
  category: {
    name: string;
    slug: string;
  } | null;
  coverImageId: string | null;
  openGraphImageId: string | null;
  authorName: string | null;
  seoTitle: string;
  seoDescription: string;
  publishedAt: Date | null;
  updatedAt: Date;
  isFeatured: boolean;
};
