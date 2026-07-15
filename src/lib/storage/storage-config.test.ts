import { describe, expect, it } from "vitest";

import {
  resolvePrivateStorageRoot,
  resolvePrivateStoragePath,
  validateStorageEnvironment,
} from "./storage-config";

describe("storage config", () => {
  it("uses storage/private when no private root is configured", () => {
    expect(resolvePrivateStorageRoot({} as NodeJS.ProcessEnv)).toMatch(
      /storage[\\/]private$/
    );
    expect(resolvePrivateStoragePath("media", {} as NodeJS.ProcessEnv)).toMatch(
      /storage[\\/]private[\\/]media$/
    );
  });

  it("validates s3-compatible storage requirements", () => {
    const result = validateStorageEnvironment({
      STORAGE_PROVIDER: "s3-compatible",
      S3_BUCKET: "orontes",
    } as NodeJS.ProcessEnv);

    expect(result.provider).toBe("s3-compatible");
    expect(result.errors).toContain("S3_ENDPOINT is required for s3-compatible storage.");
    expect(result.errors).toContain("S3_SECRET_ACCESS_KEY is required for s3-compatible storage.");
  });

  it("rejects unknown providers", () => {
    const result = validateStorageEnvironment({
      STORAGE_PROVIDER: "ftp",
    } as NodeJS.ProcessEnv);

    expect(result.errors).toEqual(["STORAGE_PROVIDER must be local or s3-compatible."]);
  });
});
