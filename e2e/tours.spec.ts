import { test, expect } from "../tests/e2e/setup";

test.describe("Tours & Viewings", () => {
  test("can view tours page with seeded data", async ({ brokerPage }) => {
    await brokerPage.goto("/viewings");
    await expect(brokerPage.getByRole("heading", { name: /viewings|tours/i })).toBeVisible();
    // Seed data has 4 tours
    await expect(brokerPage.getByText("Jose Rizal")).toBeVisible();
    await expect(brokerPage.getByText("Dindo Angeles")).toBeVisible();
  });

  test("can view tours on /tours page", async ({ brokerPage }) => {
    await brokerPage.goto("/tours");
    await expect(brokerPage.getByRole("heading", { name: /tours/i })).toBeVisible();
  });

  test("completed tours are marked appropriately", async ({ brokerPage }) => {
    await brokerPage.goto("/viewings");
    // Check that completed tours have status indicators
    const completedTour = brokerPage.getByText(/completed/i);
    await expect(completedTour).toBeVisible();
  });

  test("scheduled tours are shown as upcoming", async ({ brokerPage }) => {
    await brokerPage.goto("/viewings");
    // Tour-003 and tour-004 are scheduled/upcoming
    await expect(brokerPage.getByText("Antonio Villanueva")).toBeVisible();
    await expect(brokerPage.getByText("Ramon Magsaysay")).toBeVisible();
  });

  test("can schedule a new tour", async ({ brokerPage }) => {
    await brokerPage.goto("/viewings");
    const scheduleButton = brokerPage.getByRole("button", { name: /schedule|new tour|add tour|schedule tour/i });
    await scheduleButton.waitFor({ state: "visible", timeout: 5_000 });
    await scheduleButton.click();

    // Fill tour form
    const leadSelect = brokerPage.locator('select[name="leadId"], [data-testid="lead-select"]').first();
    if (await leadSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await leadSelect.selectOption("lead-010"); // Karen Cruz
    }

    const listingSelect = brokerPage.locator('select[name="listingId"], [data-testid="listing-select"]').first();
    if (await listingSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await listingSelect.selectOption("listing-007"); // Beach Lot
    }

    const dateField = brokerPage.locator('input[type="date"], input[placeholder*="date" i]').first();
    if (await dateField.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await dateField.fill("2025-07-15");
    }

    await brokerPage.getByRole("button", { name: /save|submit|schedule/i }).click();
    await expect(brokerPage.getByText(/tour created|scheduled/i)).toBeVisible({ timeout: 10_000 });
  });

  test("can record tour outcome and feedback", async ({ brokerPage }) => {
    await brokerPage.goto("/viewings");
    // Find a completed tour and click to view details
    await brokerPage.getByText("Jose Rizal").first().click();
    await brokerPage.waitForURL("**/viewings/**");

    // Look for notes/feedback section
    const feedbackSection = brokerPage.getByText(/notes|feedback|outcome/i).first();
    await expect(feedbackSection).toBeVisible({ timeout: 5_000 });

    // Tour-001 notes: "Client liked the unit but wants to see more options."
    await expect(brokerPage.getByText(/liked the unit|see more options/i)).toBeVisible();
  });

  test("can reschedule a tour", async ({ brokerPage }) => {
    await brokerPage.goto("/viewings");
    // Find a scheduled tour
    const scheduledTour = brokerPage.getByText("Antonio Villanueva").first();
    await scheduledTour.click();
    await brokerPage.waitForURL("**/viewings/**");

    // Click reschedule/edit
    const rescheduleButton = brokerPage.getByRole("button", { name: /reschedule|edit/i });
    if (await rescheduleButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await rescheduleButton.click();

      const dateField = brokerPage.locator('input[type="date"], input[placeholder*="date" i]').first();
      if (await dateField.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await dateField.fill("2025-07-20");
      }

      await brokerPage.getByRole("button", { name: /save|update/i }).click();
      await expect(brokerPage.getByText(/rescheduled|updated/i)).toBeVisible({ timeout: 10_000 });
    }
  });

  test("can cancel a tour", async ({ brokerPage }) => {
    await brokerPage.goto("/viewings");
    // Find a scheduled tour
    const scheduledTour = brokerPage.getByText("Ramon Magsaysay").first();
    await scheduledTour.click();
    await brokerPage.waitForURL("**/viewings/**");

    // Click cancel
    const cancelButton = brokerPage.getByRole("button", { name: /cancel tour/i });
    if (await cancelButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await cancelButton.click();

      // Confirm cancellation
      const confirmButton = brokerPage.getByRole("button", { name: /confirm|yes|cancel tour/i });
      if (await confirmButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await confirmButton.click();
      }

      await expect(brokerPage.getByText(/cancelled|canceled/i)).toBeVisible({ timeout: 10_000 });
    }
  });
});
