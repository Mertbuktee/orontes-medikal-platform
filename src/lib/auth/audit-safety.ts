import type { JsonValue } from "@/lib/database/repositories/content";

const sensitiveKeyFragments = [
  "password",
  "token",
  "secret",
  "hash",
  "body",
  "credential",
];

export function containsSensitiveAuditMetadata(value: JsonValue): boolean {
  if (Array.isArray(value)) {
    return value.some(containsSensitiveAuditMetadata);
  }

  if (typeof value !== "object" || value === null) {
    return false;
  }

  return Object.entries(value).some(([key, child]) => {
    const normalizedKey = key.toLowerCase();

    return (
      sensitiveKeyFragments.some((fragment) =>
        normalizedKey.includes(fragment)
      ) || containsSensitiveAuditMetadata(child)
    );
  });
}
