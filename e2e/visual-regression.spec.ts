/**
 * e2e/visual-regression.spec.ts
 *
 * Visual regression tests using Playwright's toHaveScreenshot.
 * These tests capture full-page screenshots for key pages and compare
 * them against stored baselines to detect unintended UI changes.
 *
 * Tagged with @visual so they can be run selectively via:
 *   yarn e2e:visual   (playwright test --grep @visual)
 */

import { test, expect } from "../tests/e2e/setup";

test.describe("Visual Regression @visual", () => {
  /**
   * Capture a baseline screenshot of the login page.
   * This page is the first point of entry and most likely to
   * be affected by branding/style changes.
   */
  test("login page renders correctly @visual", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Wait for the login form to be fully rendered
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Take a full-page screenshot and compare against the stored baseline
    await expect(page).toHaveScreenshot("login-page.png", {
      fullPage: true,
    });
  });

  /**
   * Capture a baseline screenshot of the dashboard page.
   * Uses the brokerPage fixture (auto-logged-in as broker@test.ph)
   * so the dashboard is shown with real seeded data.
   */
  test("dashboard page renders correctly @visual", async ({ brokerPage }) => {
    await brokerPage.goto("/dashboard");
    await brokerPage.waitForLoadState("networkidle");

    // Wait for dashboard content to fully render (KPI metrics visible)
    await expect(
      brokerPage.getByText(/leads|total leads/i),
    ).toBeVisible({ timeout: 15_000 });

    // Take a full-page screenshot and compare against the stored baseline
    await expect(brokerPage).toHaveScreenshot("dashboard-page.png", {
      fullPage: true,
    });
  });
});
