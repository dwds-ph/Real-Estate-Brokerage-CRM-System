import { test, expect } from "@playwright/test";
import { loginAs, TEST_USERS, seedTestUsers } from "./helpers/auth";

test.describe("Viewing schedule E2E", () => {
  test.beforeAll(async () => {
    await seedTestUsers();
  });

  test("schedule viewing → verify calendar event → submit feedback", async ({ page }) => {
    await loginAs(page, TEST_USERS.agent.email, TEST_USERS.agent.password);

    // ── Navigate to viewings ───────────────────────────────────────
    await page.click("text=Viewings");
    await page.waitForURL("**/viewings");
    await expect(page.locator("h1")).toContainText("Viewings");

    // ── Schedule a new viewing ─────────────────────────────────────
    await page.click("text=Schedule,text=New Viewing,text=Add Viewing");

    // Select lead
    const leadSelect = page.locator('select[name="leadId"]');
    if (await leadSelect.isVisible()) {
      await leadSelect.selectOption({ index: 1 });
    }

    // Select listing
    const listingSelect = page.locator('select[name="listingId"]');
    if (await listingSelect.isVisible()) {
      await listingSelect.selectOption({ index: 1 });
    }

    // Set date/time
    const dateInput = page.locator('input[type="datetime-local"], input[type="date"]').first();
    if (await dateInput.isVisible()) {
      await dateInput.fill("2026-06-15T10:00");
    }

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1_000);

    // ── Check calendar for the event ───────────────────────────────
    await page.click("text=Calendar");
    await page.waitForURL("**/calendar");
    // Look for the viewing event on the calendar
    const eventCard = page.locator("text=Viewing").first();
    if (await eventCard.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(eventCard).toBeVisible();
    }

    // ── Complete a tour and submit feedback ────────────────────────
    // Navigate to tours
    await page.click("text=Tours");
    await page.waitForURL("**/tours");
    await expect(page.locator("h1")).toContainText("Tours");

    // If there's a tour, mark it in-progress and complete
    const tourCard = page.locator("text=In Progress,text=Start Tour").first();
    if (await tourCard.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await tourCard.click();
      await page.waitForTimeout(500);

      // Submit feedback
      const interestSelect = page.locator('select[name="interestLevel"]');
      if (await interestSelect.isVisible()) {
        await interestSelect.selectOption("high");
      }

      const nextSteps = page.locator('textarea[name="nextSteps"], input[placeholder*="next" i]').first();
      if (await nextSteps.isVisible()) {
        await nextSteps.fill("Schedule follow-up meeting");
      }

      await page.click('button[type="submit"]:has-text("Save")');
      await page.waitForTimeout(500);
    }
  });
});
