/**
 * tests/e2e/setup.ts
 *
 * Shared Playwright test fixtures and setup for E2E tests.
 * Provides:
 *  - Auto-login as broker or agent via Firestore Auth emulator
 *  - Data seeding fixture (runs seed script before test suite)
 *  - Authenticated page fixture
 */

import { test as base, type Page } from "@playwright/test";
import { loginAs, TEST_USERS, seedTestUsers } from "../../e2e/helpers/auth";

// ─── Types ─────────────────────────────────────────────────────────────

export type TestFixtures = {
  /** Page already logged in as the broker user */
  brokerPage: Page;
  /** Page already logged in as an agent user */
  agentPage: Page;
  /** Ensure test users are seeded before running tests */
  seededData: void;
};

// ─── Extended Test ─────────────────────────────────────────────────────

export const test = base.extend<TestFixtures>({
  /**
   * Seed test users and Firestore data once before all tests in a suite.
   * This fixture runs eagerly because { auto: true } is implied when used
   * as a worker fixture — it's shared across tests in the same worker.
   */
  seededData: [
    async ({}, use) => {
      // 1. Create Auth emulator users (broker + agent)
      await seedTestUsers();

      // 2. Firestore data is seeded via a separate script call.
      //    Tests should call `node scripts/seed-e2e-data.cjs` in globalSetup
      //    or as part of the CI pipeline before Playwright runs.
      console.log("[E2E setup] Test users seeded via Auth emulator");
      await use();
    },
    { scope: "worker", auto: true },
  ],

  /**
   * Page fixture pre-authenticated as the broker user.
   * Logs in before each test and provides a ready-to-use page.
   */
  brokerPage: [
    async ({ page }, use) => {
      await loginAs(page, TEST_USERS.broker.email, TEST_USERS.broker.password);
      await use(page);
    },
    { scope: "test" },
  ],

  /**
   * Page fixture pre-authenticated as an agent user.
   * Logs in before each test and provides a ready-to-use page.
   */
  agentPage: [
    async ({ page }, use) => {
      await loginAs(page, TEST_USERS.agent.email, TEST_USERS.agent.password);
      await use(page);
    },
    { scope: "test" },
  ],
});

// ─── Re-export expect for convenience ──────────────────────────────────

export { expect } from "@playwright/test";
