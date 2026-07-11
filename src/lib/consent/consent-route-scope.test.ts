import { describe, expect, it } from "vitest";

import { shouldRenderCookieConsentUi } from "./consent-route-scope";

describe("consent route scope", () => {
  it("renders cookie consent UI on public routes", () => {
    expect(shouldRenderCookieConsentUi("/")).toBe(true);
    expect(shouldRenderCookieConsentUi("/cerez-politikasi")).toBe(true);
    expect(shouldRenderCookieConsentUi("/gizlilik-politikasi")).toBe(true);
  });

  it("does not render cookie consent UI on admin routes", () => {
    expect(shouldRenderCookieConsentUi("/admin")).toBe(false);
    expect(shouldRenderCookieConsentUi("/admin/")).toBe(false);
    expect(shouldRenderCookieConsentUi("/admin/service-requests")).toBe(false);
  });

  it("does not accidentally block public routes with admin-like names", () => {
    expect(shouldRenderCookieConsentUi("/admin-panel-info")).toBe(true);
  });
});
