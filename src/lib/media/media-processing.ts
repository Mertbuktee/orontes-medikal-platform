import { createHash, randomUUID } from "node:crypto";
import path from "node:path";

import type { MediaVariantType } from "@prisma/client";
import { fileTypeFromBuffer } from "file-type";

import {
  maxImagePixels,
  maxUploadSizeBytes,
  sanitizeOriginalFilename,
} from "@/lib/security/file-upload";

export class MediaValidationError extends Error {
  constructor(message = "Invalid media upload") {
    super(message);
    this.name = "MediaValidationError";
  }
}

export type ProcessedMediaVariant = {
  variant: MediaVariantType;
  buffer: Buffer;
  mimeType: string;
  extension: string;
  width: number;
  height: number;
};

export type ProcessedMediaUpload = {
  originalName: string;
  mimeType: string;
  contentHash: string;
  width: number;
  height: number;
  variants: ProcessedMediaVariant[];
};

const allowedImageTypes = {
  jpg: { extension: "jpg", mimeType: "image/jpeg" },
  png: { extension: "png", mimeType: "image/png" },
  webp: { extension: "webp", mimeType: "image/webp" },
} as const;

const extensionAliases: Record<string, keyof typeof allowedImageTypes> = {
  ".jpg": "jpg",
  ".jpeg": "jpg",
  ".jfif": "jpg",
  ".png": "png",
  ".webp": "webp",
};

export async function processAdminMediaUpload(
  file: File
): Promise<ProcessedMediaUpload> {
  if (file.size > maxUploadSizeBytes) {
    throw new MediaValidationError("Media file is too large");
  }

  const originalBuffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(originalBuffer);
  const originalName = sanitizeOriginalFilename(file.name || "media");
  const extension = path.extname(originalName).toLowerCase();
  const expectedKey = extensionAliases[extension];

  if (!detected || !expectedKey || !(detected.ext in allowedImageTypes)) {
    throw new MediaValidationError();
  }

  const detectedKey = detected.ext as keyof typeof allowedImageTypes;
  const approved = allowedImageTypes[detectedKey];

  if (expectedKey !== detectedKey || file.type !== approved.mimeType) {
    throw new MediaValidationError();
  }

  const { default: sharp } = await import("sharp");
  const baseImage = sharp(originalBuffer, {
    failOn: "error",
    limitInputPixels: maxImagePixels,
    pages: 1,
  }).rotate();
  const metadata = await baseImage.metadata();

  if (!metadata.width || !metadata.height) {
    throw new MediaValidationError();
  }

  const variants = await Promise.all([
    createVariant(originalBuffer, "ORIGINAL", detectedKey, metadata.width),
    createVariant(originalBuffer, "THUMBNAIL", detectedKey, 320),
    createVariant(originalBuffer, "MEDIUM", detectedKey, 1024),
    createVariant(originalBuffer, "LARGE", detectedKey, 1920),
  ]);
  const original = variants.find((variant) => variant.variant === "ORIGINAL");

  if (!original) {
    throw new MediaValidationError();
  }

  return {
    originalName,
    mimeType: approved.mimeType,
    contentHash: createHash("sha256").update(original.buffer).digest("hex"),
    width: original.width,
    height: original.height,
    variants,
  };
}

export function createMediaFileName(extension: string) {
  return `${randomUUID()}.${extension}`;
}

async function createVariant(
  buffer: Buffer,
  variant: MediaVariantType,
  type: keyof typeof allowedImageTypes,
  maxWidth: number
): Promise<ProcessedMediaVariant> {
  const { default: sharp } = await import("sharp");
  const image = sharp(buffer, {
    failOn: "error",
    limitInputPixels: maxImagePixels,
    pages: 1,
  }).rotate();

  if (variant !== "ORIGINAL") {
    image.resize({ width: maxWidth, withoutEnlargement: true });
  }

  const encoded = await encodeImage(image, type);
  const metadata = await sharp(encoded).metadata();

  if (!metadata.width || !metadata.height || encoded.length > maxUploadSizeBytes) {
    throw new MediaValidationError();
  }

  return {
    variant,
    buffer: encoded,
    mimeType: allowedImageTypes[type].mimeType,
    extension: allowedImageTypes[type].extension,
    width: metadata.width,
    height: metadata.height,
  };
}

async function encodeImage(
  image: import("sharp").Sharp,
  type: keyof typeof allowedImageTypes
) {
  if (type === "jpg") {
    return image.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  }

  if (type === "png") {
    return image.png({ compressionLevel: 9 }).toBuffer();
  }

  return image.webp({ quality: 88 }).toBuffer();
}
