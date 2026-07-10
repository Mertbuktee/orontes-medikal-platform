import { afterEach, describe, expect, it, vi } from "vitest";

import { isSameOriginRequest } from "@/lib/security/origin";

afterEach(() => {
  vi.unstubAllEnvs();
});

function request(origin: string) {
  return new Request("https://internal.example/api/service-requests", {
    method: "POST",
    headers: { origin },
  });
}

describe("isSameOriginRequest", () => {
  it("allows configured APP_ORIGIN", () => {
    vi.stubEnv("APP_ORIGIN", "https://orontesteknoloji.com");

    expect(isSameOriginRequest(request("https://orontesteknoloji.com"))).toBe(true);
  });

  it("rejects unconfigured origins", () => {
    vi.stubEnv("APP_ORIGIN", "https://orontesteknoloji.com");

    expect(isSameOriginRequest(request("https://attacker.example"))).toBe(false);
  });

  it("rejects malformed origin headers", () => {
    expect(isSameOriginRequest(request("not a valid origin"))).toBe(false);
  });
});
