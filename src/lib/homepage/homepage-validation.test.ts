import { describe, expect, it } from "vitest";

import { defaultHomepageSections } from "@/lib/homepage/homepage-defaults";
import {
  finalCtaContentSchema,
  homepageSectionKeySchema,
  isSafeHomepageUrl,
  parseHomepageSectionContent,
  processContentSchema,
  whyUsContentSchema,
} from "@/lib/homepage/homepage-validation";

describe("homepage content validation", () => {
  it("keeps section keys allowlisted", () => {
    expect(homepageSectionKeySchema.safeParse("WHY_US").success).toBe(true);
    expect(homepageSectionKeySchema.safeParse("ARBITRARY_COMPONENT").success).toBe(
      false
    );
  });

  it("parses seeded section payloads with typed schemas", () => {
    for (const section of defaultHomepageSections) {
      expect(() =>
        parseHomepageSectionContent(section.key, section.content)
      ).not.toThrow();
    }
  });

  it("rejects unsafe CTA URL schemes", () => {
    expect(isSafeHomepageUrl("/servis-talebi")).toBe(true);
    expect(isSafeHomepageUrl("tel:+905536065703")).toBe(true);
    expect(isSafeHomepageUrl("mailto:info@orontesteknoloji.com")).toBe(true);
    expect(isSafeHomepageUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHomepageUrl("data:text/html,owned")).toBe(false);
  });

  it("requires at least one active why-us item", () => {
    const result = whyUsContentSchema.safeParse({
      title: "Neden Orontes?",
      description:
        "Teknik servis sürecinde şeffaflık ve kontrollü uygulama yaklaşımı.",
      items: [
        {
          title: "Pasif madde",
          description: "Bu madde görünür değildir.",
          iconKey: "ShieldCheck",
          order: 1,
          isActive: false,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("requires at least two active process steps", () => {
    const result = processContentSchema.safeParse({
      title: "Servis Süreci",
      description:
        "Cihaz kabulünden teslim aşamasına kadar planlı bir teknik süreç uygulanır.",
      steps: [
        {
          title: "Cihaz Kabul",
          description: "Cihaz kayıt altına alınır.",
          iconKey: "ClipboardCheck",
          order: 1,
          isActive: true,
        },
        {
          title: "Pasif Adım",
          description: "Bu adım public tarafta görünmez.",
          iconKey: "Wrench",
          order: 2,
          isActive: false,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("allows tel links for final CTA secondary action", () => {
    const result = finalCtaContentSchema.safeParse({
      badge: "Teknik Servis",
      title: "Medikal Cihazınız İçin Teknik Destek Alın",
      description:
        "Servis kapsamı, arıza ve bakım süreçleri hakkında ekibimizle iletişime geçin.",
      primaryLabel: "Servis Talebi",
      primaryHref: "/servis-talebi",
      secondaryLabel: "Telefon",
      secondaryHref: "tel:+905536065703",
      trustItems: ["Teknik Servis"],
    });

    expect(result.success).toBe(true);
  });
});
