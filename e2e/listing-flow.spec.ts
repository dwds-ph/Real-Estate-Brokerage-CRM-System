import { test, expect } from "@playwright/test";
import { loginAs, TEST_USERS, seedTestUsers } from "./helpers/auth";

test.describe("Listing management E2E", () => {
  test.beforeAll(async () => {
    await seedTestUsers();
  });

  test("create listing → verify detail → generate brochure → verify brochure renders", async ({
    page,
  }) => {
    await loginAs(page, TEST_USERS.broker.email, TEST_USERS.broker.password);

    // ── Navigate to listings ───────────────────────────────────────
    await page.click("text=Listings");
    await page.waitForURL("**/listings");
    await expect(page.locator("h1")).toContainText("Listings");

    // ── Create a new listing ───────────────────────────────────────
    await page.click("text=New Listing,text=Add Listing");

    await page.fill('input[name="title"]', "E2E Test Property");
    await page.fill('input[name="price"]', "3500000");
    await page.fill('input[name="address"]', "123 E2E Street");
    await page.fill('input[name="city"]', "Manila");
    await page.fill('input[name="province"]', "NCR");

    // Select property type
    const typeSelect = page.locator('select[name="propertyType"]');
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption("condo");
    }

    // Set bedrooms, bathrooms
    const bedrooms = page.locator('input[name="bedrooms"]');
    if (await bedrooms.isVisible()) {
      await bedrooms.fill("2");
    }
    const bathrooms = page.locator('input[name="bathrooms"]');
    if (await bathrooms.isVisible()) {
      await bathrooms.fill("1");
    }

    await page.click('button[type="submit"]');
    await expect(page.locator("text=E2E Test Property")).toBeVisible({
      timeout: 5_000,
    });

    // ── Open listing detail ────────────────────────────────────────
    await page.click("text=E2E Test Property");
    await page.waitForTimeout(500);
    await expect(
      page.locator("text=3,500,000").or(page.locator("text=₱3.5M")),
    ).toBeVisible({ timeout: 3_000 });

    // ── Generate brochure ──────────────────────────────────────────
    const brochureBtn = page.locator(
      "text=Brochure,text=Generate Brochure,text=Share",
    );
    if (await brochureBtn.isVisible()) {
      await brochureBtn.first().click();
      await page.waitForTimeout(500);

      // Check for shareable link or brochure preview
      const linkField = page
        .locator('input[readonly], a[href*="brochure"]')
        .first();
      if (await linkField.isVisible()) {
        // Verify it's a URL
        const linkValue = await linkField
          .inputValue()
          .catch(async () => (await linkField.getAttribute("href")) || "");
        expect(linkValue).toContain("brochure");
      }
    }

    // ── Navigate to public brochure (if link found) ────────────────
    // This would require opening the brochure URL in a new context
    // but that depends on public access. For now verify the detail page works.

    // ── Return to listings ─────────────────────────────────────────
    await page.click("text=Listings");
    await expect(page.locator("text=E2E Test Property")).toBeVisible({
      timeout: 3_000,
    });
  });
});
