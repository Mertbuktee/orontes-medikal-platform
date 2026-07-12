import { defineConfig, devices } from "@playwright/test";

const useExternalServer = process.env.PLAYWRIGHT_EXTERNAL_SERVER === "true";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/visual",
  timeout: 300_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    browserName: "chromium",
    ...devices["Desktop Chrome"],
  },
  ...(useExternalServer
    ? {}
    : {
        webServer: {
          command: "node scripts/visual-qa-server.mjs",
          url: baseURL,
          env: {
            ...process.env,
            ADMIN_DEV_BYPASS: "true",
          },
          reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "true",
          timeout: 180_000,
        },
      }),
});
