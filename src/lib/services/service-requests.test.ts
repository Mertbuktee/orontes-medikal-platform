import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { LocalServiceRequestRepository } from "@/lib/services/service-requests";
import type { ServiceRequestInput } from "@/lib/validation/service-request";

const input: ServiceRequestInput = {
  fullName: "Test User",
  company: "Test Hospital",
  phone: "0553 606 57 03",
  email: "test@example.com",
  deviceBrand: "Mindray",
  deviceModel: "BeneView T5",
  deviceSerialNumber: "SN-12345",
  message: "Cihaz arızası hakkında servis talebi oluşturmak istiyorum.",
  formStartedAt: Date.now() - 3000,
};

describe("LocalServiceRequestRepository", () => {
  it("stores private JSON metadata with a UUID id", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "service-requests-"));
    const repository = new LocalServiceRequestRepository(root);
    const result = await repository.save(input, {
      storageKey: "file.png",
      mimeType: "image/png",
      size: 42,
    });
    const json = JSON.parse(await readFile(path.join(root, `${result.id}.json`), "utf8"));

    expect(result.id).toMatch(/^[a-f0-9-]+$/);
    expect(json.deviceBrand).toBe("Mindray");
    expect(json.deviceModel).toBe("BeneView T5");
    expect(json.deviceSerialNumber).toBe("SN-12345");
    expect(json.attachment).toEqual({
      storageKey: "file.png",
      mimeType: "image/png",
      size: 42,
    });
    expect(json.attachment.buffer).toBeUndefined();
  });
});
