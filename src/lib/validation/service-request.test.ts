import { describe, expect, it } from "vitest";

import { parseServiceRequestFields } from "@/lib/validation/service-request";

describe("parseServiceRequestFields", () => {
  it("rejects missing required fields", () => {
    const result = parseServiceRequestFields(new FormData());

    expect(result.success).toBe(false);
  });

  it("accepts common Turkish phone formats", () => {
    for (const phone of [
      "0553 606 57 03",
      "5536065703",
      "+90 553 606 57 03",
      "0090 553 606 57 03",
      "(0216) 555 44 33",
    ]) {
      const result = parseServiceRequestFields(validFormData({ phone }));

      expect(result.success).toBe(true);
    }
  });

  it("rejects malformed phone numbers", () => {
    for (const phone of [
      "0535+564",
      "abc05536065703",
      "12345",
      "+90 +553 606 57 03",
      "0553 606 57 0300",
    ]) {
      const result = parseServiceRequestFields(validFormData({ phone }));

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path[0] === "phone")).toBe(
          true
        );
      }
    }
  });
});

function validFormData(overrides: { phone?: string } = {}) {
  const formData = new FormData();
  formData.set("fullName", "Test Kullanici");
  formData.set("company", "Test Hastanesi");
  formData.set("phone", overrides.phone ?? "0553 606 57 03");
  formData.set("email", "test@example.com");
  formData.set("message", "Cihaz arizasi hakkinda servis talebi olusturmak istiyorum.");
  formData.set("formStartedAt", String(Date.now() - 3000));
  return formData;
}
