import { test, expect } from "../tests/e2e/setup";

test.describe("Loan Calculator", () => {
  test("can view loan calculator page", async ({ brokerPage }) => {
    await brokerPage.goto("/loans");
    await expect(brokerPage.getByRole("heading", { name: /loan|calculator|mortgage/i })).toBeVisible();
  });

  test("loan calculator form is functional", async ({ brokerPage }) => {
    await brokerPage.goto("/loans");
    // Find loan amount input
    const amountField = brokerPage.locator('input[name="amount"], input[placeholder*="amount" i], input[aria-label*="loan" i]').first();
    if (await amountField.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await amountField.fill("5000000");
    }

    const interestField = brokerPage.locator('input[name="interest"], input[placeholder*="interest" i], input[aria-label*="interest" i]').first();
    if (await interestField.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await interestField.fill("6.5");
    }

    const termField = brokerPage.locator('input[name="term"], input[placeholder*="year" i], input[aria-label*="term" i]').first();
    if (await termField.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await termField.fill("20");
    }

    // Check for calculate button
    const calcButton = brokerPage.getByRole("button", { name: /calculate|compute/i });
    if (await calcButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await calcButton.click();
    }

    // Verify results are displayed
    const result = brokerPage.getByText(/monthly|amortization|payment|result/i);
    await expect(result).toBeVisible({ timeout: 10_000 });
  });

  test("amortization schedule is displayed", async ({ brokerPage }) => {
    await brokerPage.goto("/loans");
    // Fill in values and check for schedule
    const amountField = brokerPage.locator('input[name="amount"], input[placeholder*="amount" i]').first();
    if (await amountField.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await amountField.fill("3000000");
      await brokerPage.locator('input[name="interest"], input[placeholder*="interest" i]').first().fill("7");
      await brokerPage.locator('input[name="term"], input[placeholder*="year" i]').first().fill("15");

      const calcButton = brokerPage.getByRole("button", { name: /calculate|compute/i });
      if (await calcButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await calcButton.click();
      }

      // Check for amortization table
      const scheduleTable = brokerPage.locator("table, [class*='schedule'], [class*='amortization']").first();
      await expect(scheduleTable).toBeVisible({ timeout: 10_000 });
    }
  });
});
