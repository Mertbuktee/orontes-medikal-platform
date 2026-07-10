import path from "node:path";

import { describe, expect, it } from "vitest";

import { resolveStorageTarget } from "@/lib/security/storage";

describe("resolveStorageTarget", () => {
  it("rejects paths outside the storage root", () => {
    const root = path.join(process.cwd(), "storage", "private", "service-requests");

    expect(() => resolveStorageTarget(root, "../outside.png")).toThrow("Invalid storage target");
  });
});
