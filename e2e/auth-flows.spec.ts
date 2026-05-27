import { test, expect } from "@playwright/test";
import { loginAs, TEST_USERS, seedTestUsers } from "./helpers/auth";

test.describe("Auth flows", () => {
  test.beforeAll(async () => {
    await seedTestUsers();
  });

  test("login with valid credentials redirects to dashboard", async ({ page }) => {
    await loginAs(page, TEST_USERS.broker.email, TEST_USERS.broker.password);
    await expect(page.locator("text=Dashboard")).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "wrong@email.ph");
    await page.fill('input[type="password"]', "wrongpass");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=error")).toBeVisible({ timeout: 5_000 });
  });

  test("protected route redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login", { timeout: 5_000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("logout clears session and redirects to login", async ({ page }) => {
    await loginAs(page, TEST_USERS.broker.email, TEST_USERS.broker.password);

    // Click logout button in sidebar
    await page.click("text=Logout");
    await page.waitForURL("**/login", { timeout: 5_000 });

    // Verify dashboard is no longer accessible
    await page.goto("/dashboard");
    await page.waitForURL("**/login", { timeout: 5_000 });
  });

  test("registration form creates new account", async ({ page }) => {
    await page.goto("/login");
    await page.click("text=Register");

    const uniqueEmail = `newuser_${Date.now()}@test.ph`;

    // The registration form likely has name, email, password, confirm password fields
    const emailInput = page.locator('input[type="email"]');
    const passwordInputs = page.locator('input[type="password"]');

    await emailInput.fill(uniqueEmail);
    await passwordInputs.first().fill("NewUserPass123!");
    // If there's a confirm password field
    const confirmField = page.locator('input[name="confirmPassword"]');
    if (await confirmField.isVisible()) {
      await confirmField.fill("NewUserPass123!");
    }

    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("password reset link is available", async ({ page }) => {
    await page.goto("/login");
    await page.click("text=Forgot Password");
    // Should show a reset form or confirmation
    await expect(page.locator("text=reset").first()).toBeVisible({ timeout: 5_000 });
  });
});
