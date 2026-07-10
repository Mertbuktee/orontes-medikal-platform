import { describe, expect, it } from "vitest";

import { parseServiceRequestFields } from "@/lib/validation/service-request";

describe("parseServiceRequestFields", () => {
  it("rejects missing required fields", () => {
    const result = parseServiceRequestFields(new FormData());

    expect(result.success).toBe(false);
  });
});
