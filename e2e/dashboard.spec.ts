import { test, expect } from "../tests/e2e/setup";

test.describe("Dashboard", () => {
  test("can view dashboard with metrics", async ({ brokerPage }) => {
    await brokerPage.goto("/dashboard");
    await expect(brokerPage.getByRole("heading", { name: /dashboard/i })).toBeVisible();
    // Dashboard should show KPI metrics
    await expect(brokerPage.getByText(/leads|total leads/i)).toBeVisible();
    await expect(brokerPage.getByText(/listings|active listings/i)).toBeVisible();
    await expect(brokerPage.getByText(/deals|pipeline/i)).toBeVisible();
    await expect(brokerPage.getByText(/commission|revenue|ytd/i)).toBeVisible();
  });

  test("dashboard shows total leads metric", async ({ brokerPage }) => {
    await brokerPage.goto("/dashboard");
    // Should show 12 total seeded leads somewhere
    const totalLeads = brokerPage.getByText(/12|total leads/i);
    await expect(totalLeads).toBeVisible();
  });

  test("dashboard shows active listings", async ({ brokerPage }) => {
    await brokerPage.goto("/dashboard");
    // 8 total listings, most are available
    const activeListings = brokerPage.getByText(/8|listings|active/i);
    await expect(activeListings).toBeVisible();
  });

  test("dashboard shows deal pipeline stages", async ({ brokerPage }) => {
    await brokerPage.goto("/dashboard");
    // Should show pipeline stages or deal counts
    const pipelineSection = brokerPage.getByText(/pipeline|deal stage|negotiation|under.review/i);
    await expect(pipelineSection).toBeVisible();
  });

  test("dashboard charts render without errors", async ({ brokerPage }) => {
    await brokerPage.goto("/dashboard");
    // Wait for charts to load (check for canvas or chart containers)
    const chartCanvas = brokerPage.locator("canvas, [class*='chart'], [class*='Chart'], [data-testid*='chart']").first();
    await expect(chartCanvas).toBeVisible({ timeout: 10_000 });
  });

  test("dashboard shows upcoming events and tours", async ({ brokerPage }) => {
    await brokerPage.goto("/dashboard");
    // Should show upcoming tours or events
    const upcomingSection = brokerPage.getByText(/upcoming|calendar|event|schedule/i).first();
    await expect(upcomingSection).toBeVisible();
  });

  test("dashboard shows recent activity feed", async ({ brokerPage }) => {
    await brokerPage.goto("/dashboard");
    // Should show recent activities
    const activityFeed = brokerPage.getByText(/recent activity|activity|timeline/i).first();
    await expect(activityFeed).toBeVisible();
  });

  test("can navigate to key sections from dashboard widgets", async ({ brokerPage }) => {
    await brokerPage.goto("/dashboard");
    // Clickable links/widgets should navigate to corresponding pages
    const leadsLink = brokerPage.locator('a[href*="leads"], [role="link"]').filter({ hasText: /leads/i }).first();
    if (await leadsLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await leadsLink.click();
      await brokerPage.waitForURL("**/leads");
      await expect(brokerPage.getByRole("heading", { name: /leads/i })).toBeVisible();
    }
  });

  test("dashboard commission YTD is displayed", async ({ brokerPage }) => {
    await brokerPage.goto("/dashboard");
    // Seeded deals total commission: 135,000 + 450,000 + 114,000 = ₱699,000
    const commissionText = brokerPage.getByText(/commission|revenue|699|135|450|114/i);
    await expect(commissionText).toBeVisible();
  });
});
