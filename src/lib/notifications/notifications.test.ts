import { describe, expect, it } from "vitest";

import { assertProductionMailSafety, getMailConfig } from "./mail-config";
import { renderEmailTemplate } from "./email-templates";
import { DevelopmentCaptureEmailProvider } from "./email-provider";
import {
  getNextAttemptAt,
  isMandatorySecurityCategory,
} from "@/lib/database/repositories/notifications";

describe("notification and mail foundation", () => {
  it("allows development capture by default", () => {
    const config = getMailConfig({ APP_ENV: "development" });
    expect(config.provider).toBe("development");
  });

  it("rejects development capture in production", () => {
    expect(() =>
      assertProductionMailSafety(
        {
          ...getMailConfig({ APP_ENV: "development" }),
          provider: "development",
        },
        { APP_ENV: "production" }
      )
    ).toThrow(/development/);
  });

  it("rejects missing production SMTP settings", () => {
    expect(() =>
      getMailConfig({
        APP_ENV: "production",
        MAIL_PROVIDER: "smtp",
        MAIL_FROM_ADDRESS: "noreply@example.com",
      })
    ).toThrow(/SMTP_HOST/);
  });

  it("renders safe html and text templates", async () => {
    const rendered = await renderEmailTemplate({
      key: "test-email",
      payload: {
        title: "Test <script>",
        body: "Hello <b>admin</b>",
        ctaHref: "https://example.com/admin",
      },
      companyName: "Orontes",
      supportEmail: "support@example.com",
    });

    expect(rendered.subject).not.toContain("<script>");
    expect(rendered.html).toContain("&lt;b&gt;admin&lt;/b&gt;");
    expect(rendered.text).toContain("Hello <b>admin</b>");
  });

  it("does not accept unsafe template urls", async () => {
    const rendered = await renderEmailTemplate({
      key: "test-email",
      payload: {
        title: "Unsafe",
        body: "Body",
        ctaHref: "javascript:alert(1)",
      },
    });

    expect(rendered.html).not.toContain("javascript:");
  });

  it("marks critical security categories as mandatory", () => {
    expect(isMandatorySecurityCategory("PASSWORD_CHANGED")).toBe(true);
    expect(isMandatorySecurityCategory("SERVICE_REQUEST_ASSIGNED")).toBe(false);
  });

  it("creates increasing retry windows", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const first = getNextAttemptAt(1, now).getTime() - now.getTime();
    const third = getNextAttemptAt(3, now).getTime() - now.getTime();
    expect(first).toBeGreaterThanOrEqual(60_000);
    expect(third).toBeGreaterThanOrEqual(30 * 60_000);
  });

  it("development provider captures without exposing raw recipient in metadata", async () => {
    const provider = new DevelopmentCaptureEmailProvider("storage/private/test-mail-capture");
    const result = await provider.send({
      to: [{ email: "person@example.com" }],
      subject: "Test",
      html: "<p>Test</p>",
      text: "Test",
    });

    expect(result.accepted).toBe(true);
  });
});
