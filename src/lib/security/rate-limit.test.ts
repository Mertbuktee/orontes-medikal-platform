import { afterEach, describe, expect, it, vi } from "vitest";

import { getClientIp, InMemoryRateLimiter } from "@/lib/security/rate-limit";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("InMemoryRateLimiter", () => {
  it("blocks requests after the configured limit", () => {
    const limiter = new InMemoryRateLimiter(2, 60_000);

    expect(limiter.check("127.0.0.1").allowed).toBe(true);
    expect(limiter.check("127.0.0.1").allowed).toBe(true);
    expect(limiter.check("127.0.0.1").allowed).toBe(false);
  });

  it("cleans expired buckets during checks", () => {
    vi.useFakeTimers();
    const limiter = new InMemoryRateLimiter(2, 100);

    limiter.check("one");
    expect(limiter.size).toBe(1);

    vi.advanceTimersByTime(101);
    limiter.check("two");

    expect(limiter.size).toBe(1);
    vi.useRealTimers();
  });

  it("evicts the oldest bucket when the maximum size is reached", () => {
    const limiter = new InMemoryRateLimiter(5, 60_000, 2);

    limiter.check("one");
    limiter.check("two");
    limiter.check("three");

    expect(limiter.size).toBe(2);
    expect(limiter.check("one").remaining).toBe(4);
  });

  it("does not trust forwarded IP headers unless TRUST_PROXY is enabled", () => {
    const headers = new Headers({
      "x-forwarded-for": "1.2.3.4",
      "x-real-ip": "5.6.7.8",
    });

    expect(getClientIp(headers)).toBe("direct-client");
  });

  it("uses the first valid forwarded IP when TRUST_PROXY is enabled", () => {
    vi.stubEnv("TRUST_PROXY", "true");
    const headers = new Headers({
      "x-forwarded-for": "1.2.3.4, 5.6.7.8",
    });

    expect(getClientIp(headers)).toBe("1.2.3.4");
  });
});
