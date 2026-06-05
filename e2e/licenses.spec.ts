import { test, expect } from "../tests/e2e/setup";

test.describe("Licenses", () => {
  test("can view licenses page", async ({ brokerPage }) => {
    await brokerPage.goto("/licenses");
    await expect(brokerPage.getByRole("heading", { name: /licenses/i })).toBeVisible();
  });

  test("broker license information is displayed", async ({ brokerPage }) => {
    await brokerPage.goto("/licenses");
    // Broker has license: PRC-BRKR-2019-00421
    await expect(brokerPage.getByText(/PRC-BRKR|Antonio.*Dimagiba/i)).toBeVisible();
  });

  test("agent licenses are listed", async ({ brokerPage }) => {
    await brokerPage.goto("/licenses");
    // Agents have licenses: PRC-AGT-2020-00987, PRC-AGT-2021-00543, PRC-AGT-2022-00215
    await expect(brokerPage.getByText(/PRC-AGT/i)).toBeVisible();
  });
});
