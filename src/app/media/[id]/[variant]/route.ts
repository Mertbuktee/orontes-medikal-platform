import { createHash } from "node:crypto";

import type { MediaVariantType } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/database/prisma";
import { PrismaMediaRepository } from "@/lib/database/repositories/media";
import { LocalMediaStorageAdapter } from "@/lib/media/media-storage";
import { mediaVariantTypes } from "@/lib/media/media-types";

export const runtime = "nodejs";

type MediaRouteContext = {
  params: Promise<{ id: string; variant: string }>;
};

export async function GET(request: NextRequest, context: MediaRouteContext) {
  const { id, variant } = await context.params;
  const parsedVariant = parseVariant(variant);

  if (!id || !parsedVariant) {
    return notFoundResponse();
  }

  const repository = new PrismaMediaRepository(prisma);
  const mediaVariant = await repository.getVariant({
    mediaId: id,
    variant: parsedVariant,
  });

  if (!mediaVariant || mediaVariant.media.archivedAt) {
    return notFoundResponse();
  }

  try {
    const storage = new LocalMediaStorageAdapter();
    const buffer = await storage.read(mediaVariant.storageKey);
    const etag = `"${createHash("sha256").update(buffer).digest("hex")}"`;

    if (request.headers.get("if-none-match") === etag) {
      return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mediaVariant.mimeType,
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        ETag: etag,
      },
    });
  } catch {
    return notFoundResponse();
  }
}

function parseVariant(value: string): MediaVariantType | null {
  const upper = value.toUpperCase();
  return mediaVariantTypes.some((variant) => variant === upper)
    ? (upper as MediaVariantType)
    : null;
}

function notFoundResponse() {
  return NextResponse.json(
    { success: false, message: "Medya bulunamadı." },
    { status: 404, headers: { "X-Content-Type-Options": "nosniff" } }
  );
}
