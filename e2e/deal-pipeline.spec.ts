import { test, expect } from "@playwright/test";
import { loginAs, TEST_USERS, seedTestUsers } from "./helpers/auth";

test.describe("Deal pipeline E2E", () => {
  test.beforeAll(async () => {
    await seedTestUsers();
  });

  test("navigate to deals page renders pipeline", async ({ page }) => {
    await loginAs(page, TEST_USERS.broker.email, TEST_USERS.broker.password);

    // Navigate to deals via sidebar
    await page.getByRole("link", { name: "Deals" }).click();
    await page.waitForURL("**/deals");

    // Verify we're on the deals page
    await expect(page).toHaveURL(/\/deals/);
    // Verify the sidebar link shows as active (has aria-current="page")
    await expect(page.getByRole("link", { name: "Deals" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("navigate to leads page renders leads", async ({ page }) => {
    await loginAs(page, TEST_USERS.broker.email, TEST_USERS.broker.password);

    await page.getByRole("link", { name: "Leads" }).click();
    await page.waitForURL("**/leads");
    await expect(page.getByRole("heading", { name: "Leads" })).toBeVisible();
  });
});
