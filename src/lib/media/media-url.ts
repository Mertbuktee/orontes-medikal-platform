import type { MediaVariantType } from "@prisma/client";

export function getMediaVariantUrl(mediaId: string, variant: MediaVariantType) {
  return `/media/${encodeURIComponent(mediaId)}/${variant}`;
}
