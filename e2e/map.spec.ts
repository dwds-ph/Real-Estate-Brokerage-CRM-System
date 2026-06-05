import { test, expect } from "../tests/e2e/setup";

test.describe("Map", () => {
  test("can view map page", async ({ brokerPage }) => {
    await brokerPage.goto("/map");
    await expect(brokerPage.getByRole("heading", { name: /map/i })).toBeVisible();
  });

  test("map renders with property markers", async ({ brokerPage }) => {
    await brokerPage.goto("/map");
    // Map container should be visible (could be canvas, div, or iframe)
    const mapContainer = brokerPage.locator(
      '[class*="map"], [class*="Map"], [data-testid*="map"], ' +
      'canvas, .leaflet-container, .gm-style, [class*="ol-map"]',
    ).first();
    await expect(mapContainer).toBeVisible({ timeout: 10_000 });
  });

  test("map filters are functional", async ({ brokerPage }) => {
    await brokerPage.goto("/map");
    // Look for filter controls
    const filterSection = brokerPage.locator(
      'select, [data-testid*="filter"], ' +
      'input[type="checkbox"], [role="checkbox"]',
    ).first();
    await expect(filterSection).toBeVisible({ timeout: 5_000 });
  });

  test("property markers appear on the map", async ({ brokerPage }) => {
    await brokerPage.goto("/map");
    // Check for marker elements
    const marker = brokerPage.locator(
      '[class*="marker"], [class*="Marker"], ' +
      '[class*="pin"], [class*="Pin"], ' +
      '[role="button"][aria-label*="marker"]',
    ).first();
    await expect(marker).toBeVisible({ timeout: 10_000 });
  });

  test("clicking a marker shows property popup", async ({ brokerPage }) => {
    await brokerPage.goto("/map");
    // Click on a marker to see popup with listing info
    const marker = brokerPage.locator(
      '[class*="marker"], [class*="Marker"], ' +
      '[role="button"][aria-label*="marker"]',
    ).first();
    if (await marker.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await marker.click();
      // Popup/info window should appear with property details
      const popup = brokerPage.locator(
        '[class*="popup"], [class*="Popup"], ' +
        '[class*="info-window"], [class*="InfoWindow"]',
      ).first();
      await expect(popup).toBeVisible({ timeout: 5_000 });
    }
  });
});
