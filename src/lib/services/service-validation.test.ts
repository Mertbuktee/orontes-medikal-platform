import { describe, expect, it } from "vitest";

import {
  createServiceSlug,
  serviceInputSchema,
  serviceListQuerySchema,
} from "@/lib/services/service-validation";

const validServiceInput = {
  title: "Yeni Teknik Servis",
  slug: "yeni-teknik-servis",
  shortDescription:
    "Medikal cihazlar için kontrollü ve planlı teknik servis süreci sağlar.",
  fullDescription:
    "Medikal cihazların kabul, arıza analizi, onarım ve teslim süreçlerini kapsayan detaylı teknik servis hizmetidir.",
  iconKey: "wrench",
  imageId: "",
  openGraphImageId: "",
  isFeatured: true,
  isActive: true,
  order: 1,
  seoTitle: "Yeni Teknik Servis | Orontes Teknoloji",
  seoDescription:
    "Medikal cihazlar için planlı, kontrollü ve izlenebilir teknik servis hizmeti.",
  ctaLabel: "",
  ctaHref: "",
};

describe("service validation", () => {
  it("normalizes Turkish titles into URL-safe slugs", () => {
    expect(createServiceSlug("Kalibrasyon ve Ölçüm Çözümleri")).toBe(
      "kalibrasyon-ve-olcum-cozumleri"
    );
  });

  it("accepts a valid service input", () => {
    expect(serviceInputSchema.safeParse(validServiceInput).success).toBe(true);
  });

  it("rejects unknown icon keys", () => {
    expect(
      serviceInputSchema.safeParse({
        ...validServiceInput,
        iconKey: "unknown-icon",
      }).success
    ).toBe(false);
  });

  it("rejects unsafe CTA URLs", () => {
    expect(
      serviceInputSchema.safeParse({
        ...validServiceInput,
        ctaLabel: "Aç",
        ctaHref: "javascript:alert(1)",
      }).success
    ).toBe(false);
  });

  it("requires CTA label and URL together", () => {
    expect(
      serviceInputSchema.safeParse({
        ...validServiceInput,
        ctaLabel: "Aç",
        ctaHref: "",
      }).success
    ).toBe(false);
  });

  it("accepts allowlisted list query page sizes", () => {
    const parsed = serviceListQuerySchema.parse({
      page: "2",
      pageSize: "50",
    });

    expect(parsed.page).toBe(2);
    expect(parsed.pageSize).toBe(50);
  });

  it("rejects unsupported list query page sizes", () => {
    expect(
      serviceListQuerySchema.safeParse({
        pageSize: "500",
      }).success
    ).toBe(false);
  });
});
