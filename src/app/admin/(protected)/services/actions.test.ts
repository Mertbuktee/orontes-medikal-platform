import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("service admin actions", () => {
  it("invalidates the services cache tag after mutations", () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/app/admin/(protected)/services/actions.ts"
      ),
      "utf8"
    );

    expect(source).toContain("revalidateTag(SERVICES_CACHE_TAG, \"max\")");
    expect(source.match(/revalidateServices\(\)/g)?.length).toBeGreaterThanOrEqual(
      7
    );
  });
});
