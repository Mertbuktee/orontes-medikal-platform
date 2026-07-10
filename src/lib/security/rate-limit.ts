import { isIP } from "node:net";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export interface RateLimiter {
  check(key: string): RateLimitResult;
}

export class InMemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit = 5,
    private readonly windowMs = 15 * 60 * 1000,
    private readonly maxBuckets = 10_000
  ) {}

  check(key: string) {
    const now = Date.now();
    this.cleanup(now);

    if (!this.buckets.has(key) && this.buckets.size >= this.maxBuckets) {
      this.evictOldestBucket();
    }

    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      const resetAt = now + this.windowMs;
      this.buckets.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: this.limit - 1, resetAt };
    }

    if (bucket.count >= this.limit) {
      return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
    }

    bucket.count += 1;
    return {
      allowed: true,
      remaining: this.limit - bucket.count,
      resetAt: bucket.resetAt,
    };
  }

  get size() {
    return this.buckets.size;
  }

  private cleanup(now: number) {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }

  private evictOldestBucket() {
    const oldestKey = this.buckets.keys().next().value as string | undefined;

    if (oldestKey) {
      this.buckets.delete(oldestKey);
    }
  }
}

export const serviceRequestRateLimiter = new InMemoryRateLimiter();

export function getClientIp(headers: Headers) {
  if (process.env.TRUST_PROXY !== "true") {
    return "direct-client";
  }

  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (forwarded && isIP(forwarded)) {
    return forwarded;
  }

  const realIp = headers.get("x-real-ip")?.trim();
  return realIp && isIP(realIp) ? realIp : "trusted-proxy-unknown";
}
