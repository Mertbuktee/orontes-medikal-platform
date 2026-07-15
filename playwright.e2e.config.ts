import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.E2E_PORT ?? 3210);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `cmd /c "set PORT=${port}&& set APP_ORIGIN=http://127.0.0.1:${port}&& node scripts/visual-qa-server.mjs"`,
    url: `http://127.0.0.1:${port}/api/health/live`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
