import { defineConfig, devices } from "@playwright/test";

const useExternalServer = process.env.PLAYWRIGHT_EXTERNAL_SERVER === "true";

export default defineConfig({
  testDir: "./tests/visual",
  timeout: 300_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    browserName: "chromium",
    ...devices["Desktop Chrome"],
  },
  ...(useExternalServer
    ? {}
    : {
        webServer: {
          command: "node scripts/visual-qa-server.mjs",
          url: "http://localhost:3000",
          env: {
            ...process.env,
            ADMIN_DEV_BYPASS: "true",
          },
          reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "true",
          timeout: 180_000,
        },
      }),
});
