import { describe, expect, it } from "vitest";

import {
  deviceGroups,
  getActiveOrderedDevices,
  getFeaturedDevices,
} from "@/content/devices";
import {
  getActiveOrderedServices,
  getFeaturedServices,
  services,
} from "@/content/services";
import {
  blogPosts,
  getBlogPostHref,
  getPublishedBlogPosts,
} from "@/content/blog-posts";

describe("public content architecture", () => {
  it("returns only six active featured devices for the homepage", () => {
    const devices = getFeaturedDevices();

    expect(devices).toHaveLength(6);
    expect(devices.every((device) => device.isActive && device.isFeatured)).toBe(true);
  });

  it("returns all active devices ordered by order", () => {
    const devices = getActiveOrderedDevices();
    const orders = devices.map((device) => device.order);

    expect(devices).toHaveLength(deviceGroups.filter((device) => device.isActive).length);
    expect(orders).toEqual([...orders].sort((first, second) => first - second));
  });

  it("excludes inactive devices", () => {
    const devices = getActiveOrderedDevices([
      { ...deviceGroups[0], id: "inactive", isActive: false, order: 1 },
      { ...deviceGroups[1], id: "active", isActive: true, order: 2 },
    ]);

    expect(devices.map((device) => device.id)).toEqual(["active"]);
  });

  it("keeps device models admin-ready", () => {
    for (const device of deviceGroups) {
      expect(device.slug).toBeTruthy();
      expect(device.shortDescription).toBeTruthy();
      expect(device.fullDescription).toBeTruthy();
      expect(device.iconKey).toBeTruthy();
      expect(device.capabilities.length).toBeGreaterThan(0);
      expect(device.seoTitle).toBeTruthy();
      expect(device.seoDescription).toBeTruthy();
    }
  });

  it("returns active services ordered and featured services for homepage", () => {
    const activeServices = getActiveOrderedServices();
    const featuredServices = getFeaturedServices();

    expect(activeServices).toHaveLength(services.filter((service) => service.isActive).length);
    expect(featuredServices.every((service) => service.isActive && service.isFeatured)).toBe(true);
  });

  it("keeps blog posts future-detail-ready without fake dates", () => {
    for (const post of blogPosts) {
      expect(post.slug).toBeTruthy();
      expect(post.excerpt).toBeTruthy();
      expect(post.contentBlocks).toEqual([]);
      expect(post.publishedAt).toBeUndefined();
      expect(getBlogPostHref(post.slug)).toBe(`/blog#${post.slug}`);
    }

    expect(getPublishedBlogPosts()).toHaveLength(blogPosts.length);
  });
});
