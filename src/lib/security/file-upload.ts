import { randomUUID } from "node:crypto";
import path from "node:path";

import { fileTypeFromBuffer } from "file-type";

export const maxUploadSizeBytes = 10 * 1024 * 1024;
export const maxImagePixels = 40_000_000;

const allowedByDetectedExt = {
  jpg: { extension: ".jpg", mime: "image/jpeg", kind: "image" },
  png: { extension: ".png", mime: "image/png", kind: "image" },
  webp: { extension: ".webp", mime: "image/webp", kind: "image" },
} as const;

const extensionAliases: Record<string, keyof typeof allowedByDetectedExt> = {
  ".jpg": "jpg",
  ".jpeg": "jpg",
  ".jfif": "jpg",
  ".png": "png",
  ".webp": "webp",
};

export type StoredUpload = {
  buffer: Buffer;
  detectedMime: string;
  originalName: string;
  originalSize: number;
  serverFileName: string;
};

export class FileValidationError extends Error {
  constructor(message = "Invalid file upload") {
    super(message);
    this.name = "FileValidationError";
  }
}

export type UploadValidationOptions = {
  maxOutputSizeBytes?: number;
};

export function sanitizeOriginalFilename(filename: string) {
  return path.basename(filename).replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 160);
}

export async function validateAndHardenUpload(
  file: File,
  options: UploadValidationOptions = {}
): Promise<StoredUpload> {
  if (file.size > maxUploadSizeBytes) {
    throw new FileValidationError("File is too large");
  }

  const arrayBuffer = await file.arrayBuffer();
  const originalBuffer = Buffer.from(arrayBuffer);
  const detected = await fileTypeFromBuffer(originalBuffer);
  const originalName = sanitizeOriginalFilename(file.name || "attachment");
  const originalExtension = path.extname(originalName).toLowerCase();
  const expectedKey = extensionAliases[originalExtension];

  if (!detected || !expectedKey || !(detected.ext in allowedByDetectedExt)) {
    throw new FileValidationError();
  }

  const detectedKey = detected.ext as keyof typeof allowedByDetectedExt;
  const approved = allowedByDetectedExt[detectedKey];

  if (expectedKey !== detectedKey || file.type !== approved.mime) {
    throw new FileValidationError();
  }

  let buffer = originalBuffer;

  if (isImageType(detectedKey)) {
    try {
      buffer = await reencodeImage(originalBuffer, detectedKey);
    } catch {
      throw new FileValidationError();
    }
  }

  if (buffer.length > (options.maxOutputSizeBytes ?? maxUploadSizeBytes)) {
    throw new FileValidationError();
  }

  return {
    buffer,
    detectedMime: approved.mime,
    originalName,
    originalSize: file.size,
    serverFileName: `${randomUUID()}${approved.extension}`,
  };
}

async function reencodeImage(buffer: Buffer, type: "jpg" | "png" | "webp") {
  const { default: sharp } = await import("sharp");
  const image = sharp(buffer, {
    failOn: "error",
    limitInputPixels: maxImagePixels,
    pages: 1,
  }).rotate();

  if (type === "jpg") {
    return image.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  }

  if (type === "png") {
    return image.png({ compressionLevel: 9 }).toBuffer();
  }

  return image.webp({ quality: 88 }).toBuffer();
}

function isImageType(type: keyof typeof allowedByDetectedExt): type is "jpg" | "png" | "webp" {
  return type === "jpg" || type === "png" || type === "webp";
}
