import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  MediaValidationError,
  processAdminMediaUpload,
} from "@/lib/media/media-processing";
import { LocalMediaStorageAdapter } from "@/lib/media/media-storage";
import { normalizeMediaPageSize } from "@/lib/database/repositories/media";

async function imageFile(format: "jpeg" | "png" | "webp", name: string, type: string) {
  const buffer = await sharp({
    create: {
      width: 64,
      height: 48,
      channels: 3,
      background: "#ffffff",
    },
  })
    .toFormat(format)
    .toBuffer();

  return new File([buffer], name, { type });
}

describe("media library foundations", () => {
  it("processes a valid image into hardened variants", async () => {
    const file = await imageFile("jpeg", "service.jpg", "image/jpeg");
    const upload = await processAdminMediaUpload(file);

    expect(upload.mimeType).toBe("image/jpeg");
    expect(upload.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(upload.variants.map((variant) => variant.variant)).toEqual([
      "ORIGINAL",
      "THUMBNAIL",
      "MEDIUM",
      "LARGE",
    ]);
  });

  it("rejects SVG media uploads", async () => {
    const file = new File([Buffer.from("<svg></svg>")], "x.svg", {
      type: "image/svg+xml",
    });

    await expect(processAdminMediaUpload(file)).rejects.toBeInstanceOf(
      MediaValidationError
    );
  });

  it("stores media variants inside the media storage root", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "media-storage-"));
    const storage = new LocalMediaStorageAdapter(root);
    const stored = await storage.save({
      variant: "THUMBNAIL",
      buffer: Buffer.from("image"),
      fileName: "thumb.jpg",
      mimeType: "image/jpeg",
    });

    expect(stored.storageKey).toBe("thumbnails/thumb.jpg");
    await expect(storage.read(stored.storageKey)).resolves.toEqual(
      Buffer.from("image")
    );
    await expect(storage.read("../secret.txt")).rejects.toThrow();
  });

  it("allowlists media page sizes", () => {
    expect(normalizeMediaPageSize(24)).toBe(24);
    expect(normalizeMediaPageSize(999)).toBe(24);
  });
});
