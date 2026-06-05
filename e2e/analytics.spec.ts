import { test, expect } from "../tests/e2e/setup";

test.describe("Analytics", () => {
  test("can view analytics page", async ({ brokerPage }) => {
    await brokerPage.goto("/analytics");
    await expect(brokerPage.getByRole("heading", { name: /analytics|reports/i })).toBeVisible();
  });

  test("analytics page renders chart containers", async ({ brokerPage }) => {
    await brokerPage.goto("/analytics");
    // Chart components should be present
    const chart = brokerPage.locator("canvas, [class*='chart'], [data-testid*='chart'], [class*='recharts']").first();
    await expect(chart).toBeVisible({ timeout: 10_000 });
  });

  test("analytics shows lead source breakdown", async ({ brokerPage }) => {
    await brokerPage.goto("/analytics");
    // Seeded leads have sources: referral, facebook, website, walk-in, sms, email, open-house, call
    await expect(brokerPage.getByText(/source|referral/i)).toBeVisible();
  });

  test("analytics shows deal stage distribution", async ({ brokerPage }) => {
    await brokerPage.goto("/analytics");
    // Deal stages: negotiation, closed-won, documentation
    const stageSection = brokerPage.getByText(/stage|pipeline|negotiation|closed/i);
    await expect(stageSection).toBeVisible();
  });

  test("analytics shows property type breakdown", async ({ brokerPage }) => {
    await brokerPage.goto("/analytics");
    // Property types from listings: condo, house-lot, lot-only, commercial, townhouse
    await expect(brokerPage.getByText(/property|type|condo|house/i)).toBeVisible();
  });

  test("analytics shows revenue/commission trends", async ({ brokerPage }) => {
    await brokerPage.goto("/analytics");
    // Commission/revenue trends
    const revenueSection = brokerPage.getByText(/revenue|commission|trend|ytd/i);
    await expect(revenueSection).toBeVisible();
  });
});
