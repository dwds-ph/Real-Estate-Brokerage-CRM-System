import { test, expect } from "@playwright/test";
import { loginAs, TEST_USERS, seedTestUsers } from "./helpers/auth";

test.describe("Key page navigation smoke tests", () => {
  test.beforeAll(async () => {
    await seedTestUsers();
  });

  async function verifyPage(
    page,
    linkText: string,
    headingPattern: RegExp,
    urlPattern: string,
  ) {
    await page.getByText(linkText).click();
    await page.waitForURL(urlPattern);
    await expect(
      page.getByRole("heading", { name: headingPattern }),
    ).toBeVisible();
  }

  test("Leads page loads", async ({ page }) => {
    await loginAs(page, TEST_USERS.broker.email, TEST_USERS.broker.password);
    await verifyPage(page, "Leads", /Leads/, "**/leads");
  });

  test("Listings page loads", async ({ page }) => {
    await loginAs(page, TEST_USERS.broker.email, TEST_USERS.broker.password);
    await verifyPage(page, "Listings", /Listings/, "**/listings");
  });

  test("Projects page loads", async ({ page }) => {
    await loginAs(page, TEST_USERS.broker.email, TEST_USERS.broker.password);
    await verifyPage(page, "Projects", /Projects/, "**/projects");
  });

  test("Viewings page loads", async ({ page }) => {
    await loginAs(page, TEST_USERS.broker.email, TEST_USERS.broker.password);
    await verifyPage(page, "Viewings", /Viewings/, "**/viewings");
  });

  test("Commissions page loads", async ({ page }) => {
    await loginAs(page, TEST_USERS.broker.email, TEST_USERS.broker.password);
    await verifyPage(page, "Commissions", /Commissions/, "**/commissions");
  });

  test("Calendar page loads", async ({ page }) => {
    await loginAs(page, TEST_USERS.broker.email, TEST_USERS.broker.password);
    await verifyPage(page, "Calendar", /Calendar/, "**/calendar");
  });
});
