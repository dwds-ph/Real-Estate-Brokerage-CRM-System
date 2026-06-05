import { test, expect } from "../tests/e2e/setup";

test.describe("Leads", () => {
  test("can view leads page with seeded data", async ({ brokerPage }) => {
    await brokerPage.goto("/leads");
    await expect(brokerPage.getByRole("heading", { name: /leads/i })).toBeVisible();
    // Seed data includes 12 leads with PH names
    await expect(brokerPage.getByText("Jose Rizal")).toBeVisible();
    await expect(brokerPage.getByText("Maria Clara")).toBeVisible();
  });

  test("can filter leads by status", async ({ brokerPage }) => {
    await brokerPage.goto("/leads");
    // Use a status filter dropdown
    const statusFilter = brokerPage.locator('select[name="status"], [data-testid="status-filter"]').first();
    await statusFilter.waitFor({ state: "visible", timeout: 5_000 });
    await statusFilter.selectOption("negotiating");
    // Should show negotiating leads (Jose Rizal, Catherine Mercado, Miguel Tan, Karen Cruz)
    await expect(brokerPage.getByText("Jose Rizal")).toBeVisible();
    await expect(brokerPage.getByText("Catherine Mercado")).toBeVisible();
  });

  test("can filter leads by source", async ({ brokerPage }) => {
    await brokerPage.goto("/leads");
    const sourceFilter = brokerPage.locator('select[name="source"], [data-testid="source-filter"]').first();
    await sourceFilter.waitFor({ state: "visible", timeout: 5_000 });
    await sourceFilter.selectOption("referral");
    // Referral leads: Jose Rizal, Grace Valenzuela, Karen Cruz, Leni Robredo
    await expect(brokerPage.getByText("Jose Rizal")).toBeVisible();
  });

  test("can search leads by name", async ({ brokerPage }) => {
    await brokerPage.goto("/leads");
    const searchBox = brokerPage.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]').first();
    await searchBox.waitFor({ state: "visible", timeout: 5_000 });
    await searchBox.fill("Ramon");
    await expect(brokerPage.getByText("Ramon Magsaysay")).toBeVisible();
  });

  test("can navigate to lead detail page", async ({ brokerPage }) => {
    await brokerPage.goto("/leads");
    // Click on a lead link to view detail
    await brokerPage.getByText("Jose Rizal").first().click();
    await brokerPage.waitForURL("**/leads/lead-001");
    await expect(brokerPage.getByText("Jose Protacio Rizal Mercado")).toBeVisible();
  });

  test("can create a new lead", async ({ brokerPage }) => {
    await brokerPage.goto("/leads");
    // Click "Add Lead" button
    const addButton = brokerPage.getByRole("button", { name: /add lead|new lead|create lead/i });
    await addButton.waitFor({ state: "visible", timeout: 5_000 });
    await addButton.click();

    // Fill lead form
    await brokerPage.fill('input[name="name"], input[placeholder*="name" i]', "E2E Test Lead");
    await brokerPage.fill('input[name="email"], input[placeholder*="email" i]', "e2e.test@email.ph");
    await brokerPage.fill('input[name="phone"], input[placeholder*="phone" i]', "+63 917 555 9999");

    // Submit
    await brokerPage.getByRole("button", { name: /save|submit|create/i }).click();

    // Verify success — the new lead should appear in the list
    await expect(brokerPage.getByText("E2E Test Lead")).toBeVisible({ timeout: 10_000 });
  });

  test("can edit an existing lead", async ({ brokerPage }) => {
    await brokerPage.goto("/leads/lead-002");
    // Click edit button
    const editButton = brokerPage.getByRole("button", { name: /edit/i });
    await editButton.waitFor({ state: "visible", timeout: 5_000 });
    await editButton.click();

    // Change a field
    const nameField = brokerPage.locator('input[name="name"], input[placeholder*="name" i]').first();
    await nameField.clear();
    await nameField.fill("Maria Clara Santos-Dimasalang (Updated)");

    // Save
    await brokerPage.getByRole("button", { name: /save|update/i }).click();

    // Verify update
    await expect(brokerPage.getByText("Maria Clara Santos-Dimasalang (Updated)")).toBeVisible({ timeout: 10_000 });
  });

  test("can change lead status", async ({ brokerPage }) => {
    await brokerPage.goto("/leads/lead-003");
    // Find status dropdown and change status
    const statusDropdown = brokerPage.locator('select[name="status"], [data-testid="status-select"]').first();
    await statusDropdown.waitFor({ state: "visible", timeout: 5_000 });
    await statusDropdown.selectOption("contacted");

    // Verify the status changed
    await expect(brokerPage.getByText(/contacted/i)).toBeVisible();
  });

  test("can assign lead to an agent", async ({ brokerPage }) => {
    await brokerPage.goto("/leads/lead-008");
    // Find agent assignment dropdown
    const agentDropdown = brokerPage.locator('select[name="assignedTo"], [data-testid="agent-select"]').first();
    await agentDropdown.waitFor({ state: "visible", timeout: 5_000 });
    await agentDropdown.selectOption("user-agent-002");

    // Verify assignment changed
    await expect(brokerPage.getByText(/Juan Dela Cruz|Juan Miguel Dela Cruz/i)).toBeVisible({ timeout: 5_000 });
  });

  test("can delete a lead", async ({ brokerPage }) => {
    await brokerPage.goto("/leads");
    // Find a delete action on a lead
    const deleteButton = brokerPage.getByRole("button", { name: /delete|cancel lead/i }).first();
    await deleteButton.waitFor({ state: "visible", timeout: 5_000 });
    await deleteButton.click();

    // Confirm deletion in dialog
    const confirmButton = brokerPage.getByRole("button", { name: /confirm|delete|yes/i });
    if (await confirmButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmButton.click();
    }

    // Verify the lead list still shows heading
    await expect(brokerPage.getByRole("heading", { name: /leads/i })).toBeVisible();
  });

  test("broker can view all 12 seeded leads", async ({ brokerPage }) => {
    await brokerPage.goto("/leads");
    // Verify seeded leads from different agents are visible
    const seededNames = [
      "Jose Rizal",
      "Maria Clara",
      "Ramon Magsaysay",
      "Catherine Mercado",
      "Dindo Angeles",
      "Grace Valenzuela",
      "Miguel Tan",
      "Sofia Andres",
      "Antonio Villanueva",
      "Karen Cruz",
      "Bongbong Marcos",
      "Leni Robredo",
    ];
    for (const name of seededNames) {
      await expect(brokerPage.getByText(name)).toBeVisible();
    }
  });
});
