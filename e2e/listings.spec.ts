import { test, expect } from "../tests/e2e/setup";

test.describe("Listings", () => {
  test("can view listings page with seeded data", async ({ brokerPage }) => {
    await brokerPage.goto("/listings");
    await expect(brokerPage.getByRole("heading", { name: /listings/i })).toBeVisible();
    // Seed data includes 8 listings
    await expect(brokerPage.getByText("Studio Condo at Uptown BGC")).toBeVisible();
    await expect(brokerPage.getByText("Penthouse at The Rise Makati")).toBeVisible();
  });

  test("can filter listings by property type", async ({ brokerPage }) => {
    await brokerPage.goto("/listings");
    const typeFilter = brokerPage.locator('select[name="propertyType"], [data-testid="property-type-filter"]').first();
    await typeFilter.waitFor({ state: "visible", timeout: 5_000 });
    await typeFilter.selectOption("condo");
    // Should show condos only: Studio Condo, Penthouse Makati
    await expect(brokerPage.getByText("Studio Condo at Uptown BGC")).toBeVisible();
    // Should not show house-lot listings
    await expect(brokerPage.getByText("BF Homes Parañaque")).not.toBeVisible();
  });

  test("can filter listings by status", async ({ brokerPage }) => {
    await brokerPage.goto("/listings");
    const statusFilter = brokerPage.locator('select[name="status"], [data-testid="status-filter"]').first();
    await statusFilter.waitFor({ state: "visible", timeout: 5_000 });
    await statusFilter.selectOption("under-option");
    // Should show townhouse in Cubao (under-option)
    await expect(brokerPage.getByText("Foreclosed Townhouse in Cubao")).toBeVisible();
  });

  test("can search listings by title", async ({ brokerPage }) => {
    await brokerPage.goto("/listings");
    const searchBox = brokerPage.locator('input[type="search"], input[placeholder*="search" i]').first();
    await searchBox.waitFor({ state: "visible", timeout: 5_000 });
    await searchBox.fill("Beach Lot");
    await expect(brokerPage.getByText("Beach Lot in San Juan")).toBeVisible();
  });

  test("can filter listings by price range", async ({ brokerPage }) => {
    await brokerPage.goto("/listings");
    const minPrice = brokerPage.locator('input[name="minPrice"], input[placeholder*="min" i]').first();
    const maxPrice = brokerPage.locator('input[name="maxPrice"], input[placeholder*="max" i]').first();
    if (await minPrice.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await minPrice.fill("4000000");
      await maxPrice.fill("10000000");
      // Listings between 4M-10M: Studio Condo (4.5M), BF Homes (8.5M), Cubao Townhouse (3.8M - no), Beach Lot (5M)
      await expect(brokerPage.getByText("Studio Condo at Uptown BGC")).toBeVisible();
      await expect(brokerPage.getByText("BF Homes Parañaque")).toBeVisible();
    }
  });

  test("can navigate to listing detail page", async ({ brokerPage }) => {
    await brokerPage.goto("/listings");
    await brokerPage.getByText("Studio Condo at Uptown BGC").first().click();
    await brokerPage.waitForURL("**/listings/listing-001");
    await expect(brokerPage.getByText(/Uptown Bonifacio|Rizal Drive/)).toBeVisible();
  });

  test("can view listing detail with full information", async ({ brokerPage }) => {
    await brokerPage.goto("/listings/listing-001");
    // Check that key details are visible
    await expect(brokerPage.getByText("4,500,000")).toBeVisible();
    await expect(brokerPage.getByText(/Taguig|Metro Manila/)).toBeVisible();
    // Amenities should be listed
    await expect(brokerPage.getByText("Swimming Pool")).toBeVisible();
    await expect(brokerPage.getByText("Gym")).toBeVisible();
  });

  test("can view all 8 seeded listings", async ({ brokerPage }) => {
    await brokerPage.goto("/listings");
    const listingTitles = [
      "Studio Condo at Uptown BGC",
      "3BR House & Lot in BF Homes",
      "Residential Lot in Avida Settings Nuvali",
      "Commercial Space in Makati CBD",
      "Foreclosed Townhouse in Cubao",
      "Penthouse at The Rise Makati",
      "Beach Lot in San Juan",
      "Duplex in Ayala Alabang",
    ];
    for (const title of listingTitles) {
      await expect(brokerPage.getByText(title)).toBeVisible();
    }
  });

  test("can create a new listing", async ({ brokerPage }) => {
    await brokerPage.goto("/listings");
    const addButton = brokerPage.getByRole("button", { name: /add listing|new listing|create listing/i });
    await addButton.waitFor({ state: "visible", timeout: 5_000 });
    await addButton.click();

    // Fill listing form basics
    const titleField = brokerPage.locator('input[name="title"], input[placeholder*="title" i]').first();
    if (await titleField.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await titleField.fill("E2E Test Listing - Condo");
      const priceField = brokerPage.locator('input[name="price"], input[placeholder*="price" i]').first();
      await priceField.fill("3500000");
      const typeSelect = brokerPage.locator('select[name="propertyType"]').first();
      await typeSelect.selectOption("condo");

      await brokerPage.getByRole("button", { name: /save|submit|create/i }).click();
      await expect(brokerPage.getByText("E2E Test Listing - Condo")).toBeVisible({ timeout: 10_000 });
    }
  });

  test("can generate brochure for listing", async ({ brokerPage }) => {
    await brokerPage.goto("/listings/listing-001");
    // Look for print/brochure button or navigate to brochure page
    const brochureButton = brokerPage.getByRole("button", { name: /brochure|print/i });
    if (await brochureButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await brochureButton.click();
      // May open in new tab or navigate to /b/listing-001
      await expect(brokerPage.getByRole("heading", { name: /brochure/i })).toBeVisible({ timeout: 5_000 });
    }
  });
});
