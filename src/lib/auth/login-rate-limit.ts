const defaultLimit = 5;
const defaultWindowMs = 15 * 60 * 1000;
const maxBuckets = 10_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

export function createLoginRateLimitKey(email: string, ipAddress: string) {
  return `${email.toLowerCase()}::${ipAddress}`;
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  cleanup(now);

  if (!buckets.has(key) && buckets.size >= maxBuckets) {
    const oldestKey = buckets.keys().next().value as string | undefined;

    if (oldestKey) {
      buckets.delete(oldestKey);
    }
  }

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + defaultWindowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: defaultLimit - 1, resetAt };
  }

  bucket.count += 1;

  return {
    allowed: bucket.count <= defaultLimit,
    remaining: Math.max(defaultLimit - bucket.count, 0),
    resetAt: bucket.resetAt,
  };
}

export function resetLoginFailures(key: string) {
  buckets.delete(key);
}

export function isLoginRateLimited(key: string) {
  const now = Date.now();
  cleanup(now);
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    return { allowed: true, remaining: defaultLimit, resetAt: now + defaultWindowMs };
  }

  return {
    allowed: bucket.count < defaultLimit,
    remaining: Math.max(defaultLimit - bucket.count, 0),
    resetAt: bucket.resetAt,
  };
}

export function getLoginRateLimitBucketCount() {
  cleanup(Date.now());
  return buckets.size;
}

function cleanup(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}
