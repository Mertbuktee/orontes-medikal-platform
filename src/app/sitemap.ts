import type { MetadataRoute } from "next";

import { absoluteUrl, isProductionDeployment, publicRoutes } from "@/config/site";
import {
  getPublicBlogCategoriesWithPublishedPosts,
  getPublicBlogPosts,
} from "@/lib/blog/public-blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const routes = publicRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const [blogPosts, blogCategories] = await Promise.all([
    getSitemapBlogPosts(),
    getSitemapBlogCategories(),
  ]);

  return [
    ...routes,
    ...blogPosts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
    ...blogCategories.map((category) => ({
      url: absoluteUrl(`/blog/kategori/${category.slug}`),
      lastModified: category.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
  ];
}

async function getSitemapBlogPosts() {
  try {
    return await getPublicBlogPosts();
  } catch (error) {
    if (isProductionDeployment(process.env)) {
      throw error;
    }

    return [];
  }
}

async function getSitemapBlogCategories() {
  try {
    return await getPublicBlogCategoriesWithPublishedPosts();
  } catch (error) {
    if (isProductionDeployment(process.env)) {
      throw error;
    }

    return [];
  }
}
