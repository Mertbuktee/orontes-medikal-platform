import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { resolvePrivateStoragePath } from "@/lib/storage/storage-config";

import type { StoredUpload } from "./file-upload.ts";

export type StoredFileRecord = {
  storageKey: string;
  mimeType: string;
  size: number;
};

export interface FileStorageAdapter {
  save(file: StoredUpload): Promise<StoredFileRecord>;
  remove(storageKey: string): Promise<void>;
  read(storageKey: string): Promise<Buffer>;
}

export class LocalPrivateStorageAdapter implements FileStorageAdapter {
  private readonly root: string;

  constructor(
    root = resolvePrivateStoragePath("service-requests")
  ) {
    this.root = root;
  }

  async save(file: StoredUpload) {
    const resolvedRoot = path.resolve(this.root);
    await mkdir(resolvedRoot, { recursive: true });

    const safeName = path.basename(file.serverFileName);
    const targetPath = resolveStorageTarget(resolvedRoot, safeName);
    await writeFile(targetPath, file.buffer, { flag: "wx" });

    return {
      storageKey: safeName,
      mimeType: file.detectedMime,
      size: file.buffer.length,
    };
  }

  async remove(storageKey: string) {
    const resolvedRoot = path.resolve(this.root);
    const targetPath = resolveStorageTarget(resolvedRoot, path.basename(storageKey));

    await rm(targetPath, { force: true, maxRetries: 1 });
  }

  async read(storageKey: string) {
    const resolvedRoot = path.resolve(this.root);
    const targetPath = resolveStorageTarget(resolvedRoot, path.basename(storageKey));

    return readFile(targetPath);
  }
}

export interface ObjectStorageAdapter extends FileStorageAdapter {
  readonly provider: "s3-compatible";
}

export function resolveStorageTarget(root: string, fileName: string) {
  const resolvedRoot = path.resolve(root);
  const targetPath = path.resolve(resolvedRoot, fileName);
  const relativePath = path.relative(resolvedRoot, targetPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Invalid storage target");
  }

  return targetPath;
}
