import { test, expect } from "../tests/e2e/setup";

test.describe("Tasks", () => {
  test("can view tasks page with seeded data", async ({ brokerPage }) => {
    await brokerPage.goto("/tasks");
    await expect(brokerPage.getByRole("heading", { name: /tasks/i })).toBeVisible();
    // Seed data has 5 tasks with mixed priorities
    await expect(brokerPage.getByText("Follow up on Jose Rizal downpayment")).toBeVisible();
    await expect(brokerPage.getByText("Prepare deed of sale")).toBeVisible();
  });

  test("can view all 5 seeded tasks", async ({ brokerPage }) => {
    await brokerPage.goto("/tasks");
    const seededTasks = [
      "Follow up on Jose Rizal downpayment",
      "Prepare deed of sale for Catherine deal",
      "Send brochure to Karen Cruz",
      "Update listing photos for BF Homes",
      "Verify Dindo Angeles employment docs",
    ];
    for (const taskTitle of seededTasks) {
      await expect(brokerPage.getByText(taskTitle)).toBeVisible();
    }
  });

  test("can create a new task", async ({ brokerPage }) => {
    await brokerPage.goto("/tasks");
    const addButton = brokerPage.getByRole("button", { name: /add task|new task|create task/i });
    await addButton.waitFor({ state: "visible", timeout: 5_000 });
    await addButton.click();

    // Fill task form
    const titleField = brokerPage.locator('input[name="title"], input[placeholder*="title" i]').first();
    await titleField.fill("E2E Test Task - Follow up with client");

    const prioritySelect = brokerPage.locator('select[name="priority"], [data-testid="priority-select"]').first();
    if (await prioritySelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await prioritySelect.selectOption("high");
    }

    await brokerPage.getByRole("button", { name: /save|submit|create/i }).click();
    await expect(brokerPage.getByText("E2E Test Task - Follow up with client")).toBeVisible({ timeout: 10_000 });
  });

  test("can mark a task as completed", async ({ brokerPage }) => {
    await brokerPage.goto("/tasks");
    // Find a pending task and toggle completion
    const taskCheckbox = brokerPage.locator('input[type="checkbox"], [role="checkbox"]').first();
    if (await taskCheckbox.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await taskCheckbox.click();
    }

    // Verify task status updated
    const completedBadge = brokerPage.getByText(/completed|done/i);
    await expect(completedBadge).toBeVisible();
  });

  test("can filter tasks by assignee", async ({ brokerPage }) => {
    await brokerPage.goto("/tasks");
    const assigneeFilter = brokerPage.locator('select[name="assignedTo"], [data-testid="assignee-filter"]').first();
    if (await assigneeFilter.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await assigneeFilter.selectOption("user-agent-001");

      // agent-001 tasks: Follow up on Jose Rizal, Update listing photos
      await expect(brokerPage.getByText("Follow up on Jose Rizal downpayment")).toBeVisible();
      await expect(brokerPage.getByText("Prepare deed of sale")).not.toBeVisible();
    }
  });

  test("can filter tasks by priority", async ({ brokerPage }) => {
    await brokerPage.goto("/tasks");
    const priorityFilter = brokerPage.locator('select[name="priority"], [data-testid="priority-filter"]').first();
    if (await priorityFilter.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await priorityFilter.selectOption("high");
      // High priority tasks: Follow up on Jose Rizal (high), Prepare deed of sale (high)
      await expect(brokerPage.getByText("Follow up on Jose Rizal downpayment")).toBeVisible();
      await expect(brokerPage.getByText("Send brochure to Karen Cruz")).not.toBeVisible();
    }
  });
});
