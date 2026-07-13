import type { MetadataRoute } from "next";

import { isProductionDeployment, publicRoutes } from "@/config/site";
import {
  getPublicBlogCategoriesWithPublishedPosts,
  getPublicBlogPosts,
} from "@/lib/blog/public-blog";
import { publicAbsoluteUrl } from "@/lib/site-settings/public-site-settings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const routes = await Promise.all(publicRoutes.map(async (route) => ({
    url: await publicAbsoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  })));

  const [blogPosts, blogCategories] = await Promise.all([
    getSitemapBlogPosts(),
    getSitemapBlogCategories(),
  ]);

  return [
    ...routes,
    ...blogPosts.map((post) => ({
      url: post.url,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
    ...blogCategories.map((category) => ({
      url: category.url,
      lastModified: category.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
  ];
}

async function getSitemapBlogPosts() {
  try {
    const posts = await getPublicBlogPosts();
    return Promise.all(
      posts.map(async (post) => ({
        ...post,
        url: await publicAbsoluteUrl(`/blog/${post.slug}`),
      }))
    );
  } catch (error) {
    if (isProductionDeployment(process.env)) {
      throw error;
    }

    return [];
  }
}

async function getSitemapBlogCategories() {
  try {
    const categories = await getPublicBlogCategoriesWithPublishedPosts();
    return Promise.all(
      categories.map(async (category) => ({
        ...category,
        url: await publicAbsoluteUrl(`/blog/kategori/${category.slug}`),
      }))
    );
  } catch (error) {
    if (isProductionDeployment(process.env)) {
      throw error;
    }

    return [];
  }
}
