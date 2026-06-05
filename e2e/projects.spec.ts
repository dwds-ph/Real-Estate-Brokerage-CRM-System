import { test, expect } from "../tests/e2e/setup";

test.describe("Projects", () => {
  test("can view projects page", async ({ brokerPage }) => {
    await brokerPage.goto("/projects");
    await expect(brokerPage.getByRole("heading", { name: /projects/i })).toBeVisible();
  });

  test("can view project detail", async ({ brokerPage }) => {
    await brokerPage.goto("/projects");
    // If there's a project link, click it to view detail
    const projectLink = brokerPage.locator('a[href*="/projects/"], [role="link"]').filter({ hasText: /project/i }).first();
    if (await projectLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await projectLink.click();
      await brokerPage.waitForURL("**/projects/**");
      await expect(brokerPage.getByRole("heading")).toBeVisible();
    }
  });
});
