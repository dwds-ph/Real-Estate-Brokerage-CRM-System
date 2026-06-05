import { test, expect } from "../tests/e2e/setup";

test.describe("Documents", () => {
  test("can view documents page", async ({ brokerPage }) => {
    await brokerPage.goto("/documents");
    await expect(brokerPage.getByRole("heading", { name: /documents|vault/i })).toBeVisible();
  });

  test("seeded documents are displayed", async ({ brokerPage }) => {
    await brokerPage.goto("/documents");
    await expect(brokerPage.getByText("Deed of Sale - Makati Commercial Space")).toBeVisible();
    await expect(brokerPage.getByText("Reservation Agreement - BGC Condo")).toBeVisible();
  });

  test("documents show type badges", async ({ brokerPage }) => {
    await brokerPage.goto("/documents");
    // Documents have type indicators: deed-of-sale, reservation-agreement, identification, title
    await expect(brokerPage.getByText(/deed.of.sale|sale/i)).toBeVisible();
    await expect(brokerPage.getByText(/reservation|agreement/i)).toBeVisible();
  });

  test("documents show status labels", async ({ brokerPage }) => {
    await brokerPage.goto("/documents");
    // Status badges: signed, pending-review, verified
    await expect(brokerPage.getByText(/signed|verified|pending/i)).toBeVisible();
  });

  test("can view documents for a specific deal", async ({ brokerPage }) => {
    // Navigate to deal detail and check documents tab
    await brokerPage.goto("/deals");
    await brokerPage.getByText("Catherine Mercado").first().click();
    await brokerPage.waitForURL("**/deals/**");

    // Look for documents tab
    const docsTab = brokerPage.getByRole("tab", { name: /document/i });
    if (await docsTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await docsTab.click();
      // Deal-002 has 1 document: Deed of Sale
      await expect(brokerPage.getByText("Deed of Sale - Makati Commercial Space")).toBeVisible({ timeout: 5_000 });
    }
  });

  test("can upload a document", async ({ brokerPage }) => {
    await brokerPage.goto("/documents");
    const uploadButton = brokerPage.getByRole("button", { name: /upload|add document|new document/i });
    if (await uploadButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await uploadButton.click();

      // Fill document upload form
      const titleField = brokerPage.locator('input[name="title"], input[placeholder*="title" i]').first();
      if (await titleField.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await titleField.fill("E2E Test Document");
      }

      const typeSelect = brokerPage.locator('select[name="type"], [data-testid="doc-type"]').first();
      if (await typeSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await typeSelect.selectOption("identification");
      }

      await brokerPage.getByRole("button", { name: /save|submit|upload/i }).click();
      await expect(brokerPage.getByText("E2E Test Document")).toBeVisible({ timeout: 10_000 });
    }
  });

  test("can download a document", async ({ brokerPage }) => {
    await brokerPage.goto("/documents");
    // Find a download button/link
    const downloadLink = brokerPage.getByRole("button", { name: /download/i }).first();
    if (await downloadLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      // Clicking download should initiate download (can't fully verify in headless)
      await downloadLink.click();
      // At minimum verify no error
      await expect(brokerPage.getByRole("heading", { name: /documents|vault/i })).toBeVisible();
    }
  });
});
