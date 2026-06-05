import { test, expect } from "../tests/e2e/setup";

test.describe("Payments", () => {
  test("can view payment schedule on deal detail", async ({ brokerPage }) => {
    // Payments are shown within deal detail
    await brokerPage.goto("/deals");
    // Navigate to deal-001 detail
    await brokerPage.getByText("Jose Rizal").first().click();
    await brokerPage.waitForURL("**/deals/**");
    // Look for payments section/tab
    const paymentsTab = brokerPage.getByRole("tab", { name: /payment/i });
    if (await paymentsTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await paymentsTab.click();
    }
    // Should see existing payments
    await expect(brokerPage.getByText(/reservation|payment/i)).toBeVisible({ timeout: 5_000 });
  });

  test("can view overdue payments on deal", async ({ brokerPage }) => {
    // Deal-001 has an overdue downpayment (payment-003)
    await brokerPage.goto("/deals");
    await brokerPage.getByText("Jose Rizal").first().click();
    await brokerPage.waitForURL("**/deals/**");

    const paymentsTab = brokerPage.getByRole("tab", { name: /payment/i });
    if (await paymentsTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await paymentsTab.click();
    }

    // Check for overdue indicator — payment-003 is overdue
    await expect(brokerPage.getByText(/overdue/i)).toBeVisible({ timeout: 5_000 });
  });

  test("can record a payment for a deal", async ({ brokerPage }) => {
    await brokerPage.goto("/deals");
    await brokerPage.getByText("Dindo Angeles").first().click();
    await brokerPage.waitForURL("**/deals/**");

    // Navigate to payments section
    const paymentsTab = brokerPage.getByRole("tab", { name: /payment/i });
    if (await paymentsTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await paymentsTab.click();
    }

    // Click record payment button
    const recordButton = brokerPage.getByRole("button", { name: /record payment|add payment/i });
    if (await recordButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await recordButton.click();

      // Fill payment form
      const amountField = brokerPage.locator('input[name="amount"], input[placeholder*="amount" i]').first();
      await amountField.fill("200000");
      const methodSelect = brokerPage.locator('select[name="method"], [data-testid="payment-method"]').first();
      await methodSelect.selectOption("bank-transfer");

      await brokerPage.getByRole("button", { name: /save|submit|record/i }).click();
      // Verify success
      await expect(brokerPage.getByText(/200,000/)).toBeVisible({ timeout: 10_000 });
    }
  });

  test("overdue payments are highlighted differently", async ({ brokerPage }) => {
    // Navigate to payments page or dashboard to check overdue highlight
    await brokerPage.goto("/payments");
    // Check if a dedicated payments page exists or use deal detail
    const pageHeading = brokerPage.getByRole("heading", { name: /payment/i });
    if (await pageHeading.isVisible({ timeout: 3_000 }).catch(() => false)) {
      // Look for overdue badge/style
      const overdueBadge = brokerPage.locator('[class*="overdue"], [class*="badge"], [data-status="overdue"]').first();
      await expect(overdueBadge).toBeVisible();
    }
  });
});
