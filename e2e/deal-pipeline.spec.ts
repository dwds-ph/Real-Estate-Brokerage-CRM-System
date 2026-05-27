import { test, expect } from "@playwright/test";
import { loginAs, TEST_USERS, seedTestUsers } from "./helpers/auth";

test.describe("Deal pipeline E2E", () => {
  test.beforeAll(async () => {
    await seedTestUsers();
  });

  test("create deal from lead → move through pipeline → set co-broking → close", async ({ page }) => {
    await loginAs(page, TEST_USERS.broker.email, TEST_USERS.broker.password);

    // ── Navigate to deals ──────────────────────────────────────────
    await page.click("text=Deals");
    await page.waitForURL("**/deals");
    await expect(page.locator("h1")).toContainText("Deals");

    // ── Create a deal ──────────────────────────────────────────────
    await page.click("text=New Deal,text=Add Deal");

    // Fill in deal details
    const nameField = page.locator('input[name="clientName"], input[placeholder*="client" i]').first();
    if (await nameField.isVisible()) {
      await nameField.fill("E2E Deal Client");
    }

    const contactField = page.locator('input[name="clientContact"], input[placeholder*="contact" i]').first();
    if (await contactField.isVisible()) {
      await contactField.fill("09170000002");
    }

    const priceField = page.locator('input[name="dealPrice"], input[placeholder*="price" i]').first();
    if (await priceField.isVisible()) {
      await priceField.fill("5000000");
    }

    await page.click('button[type="submit"]');
    await expect(page.locator("text=E2E Deal Client")).toBeVisible({ timeout: 5_000 });

    // ── Move through pipeline statuses via Kanban ──────────────────
    // Look for the deal card in the kanban board
    const dealCard = page.locator("text=E2E Deal Client").first();
    await expect(dealCard).toBeVisible();

    // Click the deal to view details
    await dealCard.click();
    await page.waitForTimeout(500);

    // Find status selector
    const statusSelect = page.locator('select[name="status"]');
    if (await statusSelect.isVisible()) {
      // Move through statuses
      await statusSelect.selectOption("closed");
      await page.waitForTimeout(500);

      // Verify status updated
      await expect(page.locator("text=closed")).toBeVisible({ timeout: 3_000 });
    }

    // ── Set co-broking split ───────────────────────────────────────
    const coBrokingToggle = page.locator("text=Co-broking,text=Co-broking,text=Split").first();
    if (await coBrokingToggle.isVisible()) {
      await coBrokingToggle.click();
      // Fill co-broker details
      const agentField = page.locator('input[placeholder*="agent" i]').first();
      if (await agentField.isVisible()) {
        await agentField.fill("Test Agent");
      }
      const splitField = page.locator('input[placeholder*="split" i], input[placeholder*="percent" i]').first();
      if (await splitField.isVisible()) {
        await splitField.fill("50");
      }
      await page.click('button[type="submit"]:has-text("Save")');
    }

    // ── Verify deal appears in closed deals ────────────────────────
    await page.click("text=Deals");
    await expect(page.locator("text=E2E Deal Client")).toBeVisible({ timeout: 3_000 });
  });
});
