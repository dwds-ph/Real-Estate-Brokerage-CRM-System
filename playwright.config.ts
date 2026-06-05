import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"],
    ["json", { outputFile: "playwright-report/test-results.json" }],
  ],
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  // Global setup: seed Firestore emulator data once before all workers
  globalSetup: require.resolve("./tests/e2e/global-setup"),

  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      testDir: "./tests/e2e",
    },
    {
      name: "chromium",
      use: { browserName: "chromium" },
      dependencies: ["setup"],
    },
  ],
});
