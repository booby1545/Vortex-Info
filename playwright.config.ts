import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
    // The site auto-detects RU vs EN from the browser's own locale when
    // there's no saved preference — Chromium's default locale varies by
    // machine/runner, which flips the page to English and breaks every
    // RU-text assertion below. Pin it to match what the tests assert.
    locale: "ru-RU",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Serves out/, not `next dev` — see scripts/serve-out.mjs. The dev server
    // is a different program producing a different bundle, so a suite run
    // against it says nothing about the static export that actually deploys
    // (basePath handling in particular only exists in the export).
    // npm run test:e2e builds first.
    command: "node scripts/serve-out.mjs",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
