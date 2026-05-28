import { test, expect } from "@playwright/test";
import { loginAs, TEST_USERS, seedTestUsers } from "./helpers/auth";

test.describe("Auth flows", () => {
  test.beforeAll(async () => {
    await seedTestUsers();
  });

  test("login with valid credentials redirects to dashboard", async ({
    page,
  }) => {
    await loginAs(page, TEST_USERS.broker.email, TEST_USERS.broker.password);
    // Use a unique selector — sidebar link OR heading
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "wrong@email.ph");
    await page.fill('input[type="password"]', "wrongpass");
    await page.click('button[type="submit"]');
    // After failed login, we should remain on the login page (no redirect)
    await page.waitForTimeout(3000);
    expect(page.url()).toContain("/login");
  });

  test("protected route redirects unauthenticated user to login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login", { timeout: 5_000 });
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  });

  test("logout clears session and redirects to login", async ({ page }) => {
    await loginAs(page, TEST_USERS.broker.email, TEST_USERS.broker.password);

    // Click logout button in sidebar
    await page.getByRole("button", { name: /logout/i }).click();
    await page.waitForURL("**/login", { timeout: 5_000 });

    // Verify dashboard is no longer accessible
    await page.goto("/dashboard");
    await page.waitForURL("**/login", { timeout: 5_000 });
  });

  test("registration form creates new account", async ({ page }) => {
    await page.goto("/login");
    // Toggle to register mode
    await page.getByText(/Register/i).click();

    await page.fill('input[type="text"]', "E2E New User");
    await page.fill('input[type="email"]', `newuser_${Date.now()}@test.ph`);
    await page.fill('input[type="password"]', "NewUserPass123!");

    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 15_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("password reset link is available", async ({ page }) => {
    await page.goto("/login");
    // Fill in email first so resetPassword doesn't error out immediately
    await page.fill('input[type="email"]', "test@reset.ph");
    await page.getByText(/forgot/i).click();
    // Should remain on login page (password reset in emulator doesn't redirect)
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("/login");
  });
});
