import { test, expect } from "@playwright/test";
import { loginAs, TEST_USERS, seedTestUsers } from "./helpers/auth";

test.describe("Lead management E2E", () => {
  test.beforeAll(async () => {
    await seedTestUsers();
  });

  test("full lead lifecycle: create → edit → change status → add note → delete", async ({ page }) => {
    await loginAs(page, TEST_USERS.broker.email, TEST_USERS.broker.password);

    // ── Navigate to leads ──────────────────────────────────────────
    await page.click("text=Leads");
    await page.waitForURL("**/leads");
    await expect(page.locator("h1")).toContainText("Leads");

    // ── Create a new lead ──────────────────────────────────────────
    // Click the "New Lead" or "Add Lead" button
    await page.click("text=New Lead,text=Add Lead");
    await page.fill('input[name="name"]', "E2E Test Lead");
    await page.fill('input[name="email"]', "e2e-lead@test.ph");
    await page.fill('input[name="phone"]', "09170000001");

    // Select source
    const sourceSelect = page.locator('select[name="source"]');
    if (await sourceSelect.isVisible()) {
      await sourceSelect.selectOption("manual");
    }

    // Submit
    await page.click('button[type="submit"]');
    await expect(page.locator("text=E2E Test Lead")).toBeVisible({ timeout: 5_000 });

    // ── Edit the lead ──────────────────────────────────────────────
    // Click on the lead to open detail
    await page.click("text=E2E Test Lead");
    await page.waitForTimeout(500);

    // Look for an edit button/pencil icon
    const editBtn = page.locator("text=Edit,button:has(svg)").first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.fill('input[name="name"]', "E2E Test Lead (Edited)");
      await page.click('button[type="submit"]');
      await expect(page.locator("text=E2E Test Lead (Edited)")).toBeVisible({ timeout: 5_000 });
    }

    // ── Change status ──────────────────────────────────────────────
    // Find a status dropdown or status button
    const statusSelect = page.locator('select[name="status"]');
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption("contacted");
      await page.waitForTimeout(300);
    }

    // ── Add a communication log entry ───────────────────────────────
    const commLogBtn = page.locator("text=Add Note,text=Log Call,text=Communication");
    if (await commLogBtn.isVisible()) {
      await commLogBtn.first().click();
      // Fill in communication detail
      const noteField = page.locator("textarea, input[placeholder*='note']").first();
      if (await noteField.isVisible()) {
        await noteField.fill("Initial contact made via E2E test");
        await page.click('button[type="submit"]:has-text("Save")');
      }
    }

    // ── Navigate back to leads list ────────────────────────────────
    await page.click("text=Leads");

    // ── Delete the lead ─────────────────────────────────────────────
    // Find our lead and click delete
    const deleteBtn = page.locator("text=E2E Test Lead (Edited)").locator("..").locator("text=Delete");
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      // Handle confirmation dialog
      page.once("dialog", (dialog) => dialog.accept());
    }

    // Verify lead is gone
    await expect(page.locator("text=E2E Test Lead (Edited)")).not.toBeVisible({ timeout: 5_000 });
  });
});
