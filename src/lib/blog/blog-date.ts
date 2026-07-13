export type BlogDateInput = Date | string | null | undefined;

export function parseBlogDate(value: BlogDateInput) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatBlogDate(value: BlogDateInput) {
  return parseBlogDate(value)?.toLocaleDateString("tr-TR") ?? null;
}

export function toBlogIsoString(value: BlogDateInput) {
  return parseBlogDate(value)?.toISOString();
}
