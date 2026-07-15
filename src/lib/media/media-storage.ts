import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { MediaVariantType } from "@prisma/client";

import { resolveStorageTarget } from "../security/storage.ts";
import { resolvePrivateStoragePath } from "../storage/storage-config.ts";

export type MediaStoredFile = {
  storageKey: string;
  mimeType: string;
  size: number;
};

export type MediaFileToStore = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  variant: MediaVariantType;
};

const directoryByVariant: Record<MediaVariantType, string> = {
  ORIGINAL: "originals",
  THUMBNAIL: "thumbnails",
  MEDIUM: "medium",
  LARGE: "large",
};

export class LocalMediaStorageAdapter {
  private readonly root: string;

  constructor(root = resolvePrivateStoragePath("media")) {
    this.root = root;
  }

  async save(file: MediaFileToStore): Promise<MediaStoredFile> {
    const directory = directoryByVariant[file.variant];
    const resolvedDirectory = path.resolve(this.root, directory);
    await mkdir(resolvedDirectory, { recursive: true });

    const safeName = path.basename(file.fileName);
    const targetPath = resolveStorageTarget(resolvedDirectory, safeName);
    await writeFile(targetPath, file.buffer, { flag: "wx" });

    return {
      storageKey: `${directory}/${safeName}`,
      mimeType: file.mimeType,
      size: file.buffer.length,
    };
  }

  async read(storageKey: string) {
    const targetPath = this.resolveStorageKey(storageKey);
    return readFile(targetPath);
  }

  async remove(storageKey: string) {
    const targetPath = this.resolveStorageKey(storageKey);
    await rm(targetPath, { force: true, maxRetries: 1 });
  }

  async exists(storageKey: string) {
    try {
      await this.read(storageKey);
      return true;
    } catch {
      return false;
    }
  }

  private resolveStorageKey(storageKey: string) {
    const normalized = storageKey.replaceAll("\\", "/");
    const [directory, fileName] = normalized.split("/");

    if (!directory || !fileName || normalized.split("/").length !== 2) {
      throw new Error("Invalid media storage key");
    }

    const resolvedDirectory = path.resolve(this.root, directory);
    return resolveStorageTarget(resolvedDirectory, path.basename(fileName));
  }
}
