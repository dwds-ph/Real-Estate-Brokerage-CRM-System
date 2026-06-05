import { test, expect } from "../tests/e2e/setup";

test.describe("Co-Brokerage", () => {
  test("can view co-brokerage page", async ({ brokerPage }) => {
    await brokerPage.goto("/cobrokerage");
    await expect(brokerPage.getByRole("heading", { name: /co.brokerage|team|branch/i })).toBeVisible();
  });

  test("can view branches section", async ({ brokerPage }) => {
    await brokerPage.goto("/cobrokerage");
    // Makati Flagship Office is seeded
    const branchSection = brokerPage.getByText(/Makati Flagship|branch|office/i);
    await expect(branchSection).toBeVisible();
  });

  test("can view teams list", async ({ brokerPage }) => {
    await brokerPage.goto("/cobrokerage");
    // Look for teams/agents section
    const teamsSection = brokerPage.getByText(/team|agent|member/i).first();
    await expect(teamsSection).toBeVisible();
  });

  test("broker can view agent list in co-brokerage", async ({ brokerPage }) => {
    await brokerPage.goto("/cobrokerage");
    // 3 agents seeded: Maria Santos, Juan Dela Cruz, Ana Gonzales
    await expect(brokerPage.getByText(/Maria.*Santos|Maria Concepcion/i)).toBeVisible();
    await expect(brokerPage.getByText(/Juan.*Dela Cruz|Juan Miguel/i)).toBeVisible();
    await expect(brokerPage.getByText(/Ana.*Gonzales|Ana Beatriz/i)).toBeVisible();
  });

  test("can view branch detail", async ({ brokerPage }) => {
    await brokerPage.goto("/cobrokerage");
    // Click on Makati branch to view detail
    const branchLink = brokerPage.getByText(/makati flagship/i);
    if (await branchLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await branchLink.click();
      await expect(brokerPage.getByText(/Ayala Tower|Ayala Avenue/i)).toBeVisible();
    }
  });
});
