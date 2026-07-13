export function isSameOriginHeaders(headers: Headers) {
  const origin = headers.get("origin");
  if (!origin) return true;

  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) return false;

  const allowed = new Set<string>();
  for (const value of (process.env.APP_ORIGIN ?? "").split(",")) {
    const normalized = normalizeOrigin(value);
    if (normalized) allowed.add(normalized);
  }

  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const protocol = headers.get("x-forwarded-proto") ?? "http";
  if (host) {
    const normalized = normalizeOrigin(`${protocol}://${host}`);
    if (normalized) allowed.add(normalized);
  }

  if (process.env.NODE_ENV === "development") {
    allowed.add("http://localhost:3000");
  }

  return allowed.has(normalizedOrigin);
}

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}
