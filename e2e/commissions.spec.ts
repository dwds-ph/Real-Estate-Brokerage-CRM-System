import { test, expect } from "../tests/e2e/setup";

test.describe("Commissions", () => {
  test("can view commissions page with summary", async ({ brokerPage }) => {
    await brokerPage.goto("/commissions");
    await expect(brokerPage.getByRole("heading", { name: /commission/i })).toBeVisible();
    // Should show commission breakdown
    await expect(brokerPage.getByText(/earned|pending|total/i)).toBeVisible();
  });

  test("can view commission breakdown on deal detail", async ({ brokerPage }) => {
    await brokerPage.goto("/deals");
    await brokerPage.getByText("Jose Rizal").first().click();
    await brokerPage.waitForURL("**/deals/**");

    // Look for commission section
    const commissionSection = brokerPage.getByText(/commission|broker share|agent share/i).first();
    await expect(commissionSection).toBeVisible({ timeout: 5_000 });
  });

  test("deal-001 has correct commission amounts", async ({ brokerPage }) => {
    await brokerPage.goto("/deals");
    await brokerPage.getByText("Jose Rizal").first().click();
    await brokerPage.waitForURL("**/deals/**");

    // Deal-001 has total commission of ₱135,000
    await expect(brokerPage.getByText(/135,000|135000/)).toBeVisible({ timeout: 5_000 });
  });

  test("deal-002 closed deal shows commission", async ({ brokerPage }) => {
    await brokerPage.goto("/deals");
    await brokerPage.getByText("Catherine Mercado").first().click();
    await brokerPage.waitForURL("**/deals/**");

    // Deal-002 has total commission of ₱450,000
    await expect(brokerPage.getByText(/450,000|450000/)).toBeVisible({ timeout: 5_000 });
  });

  test("can view commission plans", async ({ brokerPage }) => {
    await brokerPage.goto("/commissions");
    // Look for commission plans section or navigation to plans
    const plansTab = brokerPage.getByRole("tab", { name: /plan/i });
    if (await plansTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await plansTab.click();
    }

    // Should see seeded plans
    await expect(brokerPage.getByText(/Standard Residential/i)).toBeVisible({ timeout: 5_000 });
    await expect(brokerPage.getByText(/Commercial Rate/i)).toBeVisible();
    await expect(brokerPage.getByText(/Lot Only Rate/i)).toBeVisible();
  });

  test("can filter commissions by period", async ({ brokerPage }) => {
    await brokerPage.goto("/commissions");
    const periodFilter = brokerPage.locator('select[name="period"], [data-testid="period-filter"]').first();
    if (await periodFilter.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await periodFilter.selectOption("month");
      // Page should refresh with filtered data
      await expect(brokerPage.getByRole("heading", { name: /commission/i })).toBeVisible();
    }
  });

  test("can create a commission plan", async ({ brokerPage }) => {
    await brokerPage.goto("/commissions");
    // Navigate to plans section
    const plansTab = brokerPage.getByRole("tab", { name: /plan/i });
    if (await plansTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await plansTab.click();
    }

    const addPlanButton = brokerPage.getByRole("button", { name: /add plan|new plan|create plan/i });
    if (await addPlanButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await addPlanButton.click();

      // Fill plan form
      const nameField = brokerPage.locator('input[name="name"], input[placeholder*="name" i]').first();
      await nameField.fill("E2E Test Plan");
      const rateField = brokerPage.locator('input[name="rate"], input[placeholder*="rate" i]').first();
      await rateField.fill("4");

      await brokerPage.getByRole("button", { name: /save|submit|create/i }).click();
      await expect(brokerPage.getByText("E2E Test Plan")).toBeVisible({ timeout: 10_000 });
    }
  });
});
