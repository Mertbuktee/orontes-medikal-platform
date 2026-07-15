export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get('origin');

  if (!origin) {
    return isTrustedFetchSite(request.headers);
  }

  const normalizedOrigin = normalizeOrigin(origin);

  if (!normalizedOrigin) {
    return false;
  }

  return getAllowedOrigins(request).includes(normalizedOrigin);
}

export function getAllowedOrigins(request: Request) {
  const configuredOrigins = (process.env.APP_ORIGIN ?? '')
    .split(',')
    .map(normalizeOrigin)
    .filter((value): value is string => Boolean(value));
  const fallbackOrigin = normalizeOrigin(new URL(request.url).origin);
  const developmentOrigin =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : undefined;

  return [
    ...new Set(
      [...configuredOrigins, fallbackOrigin, developmentOrigin].filter(Boolean),
    ),
  ];
}

function isTrustedFetchSite(headers: Headers) {
  const fetchSite = headers.get('sec-fetch-site');
  return (
    fetchSite === 'same-origin' ||
    fetchSite === 'same-site' ||
    fetchSite === 'none'
  );
}

function normalizeOrigin(origin: string) {
  try {
    const url = new URL(origin);
    return url.origin;
  } catch {
    return null;
  }
}
