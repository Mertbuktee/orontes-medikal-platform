import { describe, expect, it } from "vitest";

import {
  createDeviceSlug,
  deviceGroupInputSchema,
  deviceListQuerySchema,
} from "@/lib/devices/device-validation";

const validDeviceInput = {
  title: "Test Cihaz Grubu",
  slug: "test-cihaz-grubu",
  shortDescription:
    "Teknik servis kapsamı için yeterli uzunlukta kısa açıklama.",
  fullDescription:
    "Teknik servis kapsamı, arıza analizi, bakım ve test süreçlerini açıklayan yeterli uzunlukta detaylı açıklama.",
  iconKey: "stethoscope",
  imageId: "",
  openGraphImageId: "",
  capabilities: ["Elektronik"],
  isFeatured: true,
  isActive: true,
  order: 1,
  seoTitle: "Test Cihaz Grubu Teknik Servisi",
  seoDescription:
    "Test cihaz grubu için bakım, onarım ve teknik servis süreçlerini açıklayan SEO metni.",
};

describe("device group validation", () => {
  it("normalizes Turkish titles into URL-safe slugs", () => {
    expect(createDeviceSlug("Tansiyon ve SpO2 Ölçerler")).toBe(
      "tansiyon-ve-spo2-olcerler"
    );
  });

  it("accepts valid device group input", () => {
    expect(deviceGroupInputSchema.safeParse(validDeviceInput).success).toBe(true);
  });

  it("rejects unknown icon keys", () => {
    const parsed = deviceGroupInputSchema.safeParse({
      ...validDeviceInput,
      iconKey: "script-tag",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects unknown capabilities and empty capability lists", () => {
    expect(
      deviceGroupInputSchema.safeParse({
        ...validDeviceInput,
        capabilities: ["HTML"],
      }).success
    ).toBe(false);

    expect(
      deviceGroupInputSchema.safeParse({
        ...validDeviceInput,
        capabilities: [],
      }).success
    ).toBe(false);
  });

  it("allows only supported admin page sizes", () => {
    expect(deviceListQuerySchema.safeParse({ pageSize: "50" }).success).toBe(
      true
    );
    expect(deviceListQuerySchema.safeParse({ pageSize: "999" }).success).toBe(
      false
    );
  });
});
