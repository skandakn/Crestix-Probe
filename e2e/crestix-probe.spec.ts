import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  navigateToCrestixRoute,
  registerMockApiRoutes,
} from "./fixtures/mock-api-and-harness";

test.describe("Crestix Probe End-to-End QA Suite", () => {
  test("1. Homepage loads without console errors and passes accessibility scan", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await registerMockApiRoutes(page);
    await navigateToCrestixRoute(page, "/");

    await expect(page.locator("h1")).toContainText(/Crestix Probe/i);
    expect(consoleErrors).toEqual([]);

    const axeResults = await new AxeBuilder({ page }).analyze();
    expect(axeResults.violations).toEqual([]);
  });

  test("2. Navigation works across core platform modules", async ({ page, isMobile }) => {
    await registerMockApiRoutes(page);
    await navigateToCrestixRoute(page, "/");

    if (isMobile) {
      await page.locator("#mobile-menu-toggle").click();
      await page.locator('#mobile-nav-drawer a[data-route="/terrain"]').click();
    } else {
      await page.locator('nav.desktop-nav a[data-route="/terrain"]').click();
    }
    await expect(page.locator("h1")).toContainText(/Terrain/i);

    if (isMobile) {
      await page.locator("#mobile-menu-toggle").click();
      await page.locator('#mobile-nav-drawer a[data-route="/sensors"]').click();
    } else {
      await page.locator('nav.desktop-nav a[data-route="/sensors"]').click();
    }
    await expect(page.locator("h1")).toContainText(/Sensor/i);
  });

  test("3. User can access login and registration forms", async ({ page }) => {
    await registerMockApiRoutes(page);
    await navigateToCrestixRoute(page, "/login");

    await expect(page.locator("h1")).toContainText(/Sign In|Login/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    await navigateToCrestixRoute(page, "/register");
    await expect(page.locator("h1")).toContainText(/Register|Create Researcher Account/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("4. Terrain page loads", async ({ page }) => {
    await registerMockApiRoutes(page);
    await navigateToCrestixRoute(page, "/terrain");

    await expect(page.locator("h1")).toContainText(/Terrain/i);
    await expect(page.getByTestId("terrain-file-input")).toBeVisible();
  });

  test("5. Terrain upload validation works for invalid and valid DEM files", async ({ page }) => {
    await registerMockApiRoutes(page);
    await navigateToCrestixRoute(page, "/terrain");

    const fileInput = page.getByTestId("terrain-file-input");

    await fileInput.setInputFiles({
      name: "invalid_image.png",
      mimeType: "image/png",
      buffer: Buffer.from("invalid-binary-payload"),
    });
    await expect(page.getByTestId("terrain-error")).toContainText(/Unsupported terrain format/i);

    await fileInput.setInputFiles({
      name: "flume_basin_v1.tif",
      mimeType: "image/tiff",
      buffer: Buffer.from("TIFF_DEM_GRID_DATA"),
    });
    await expect(page.getByTestId("terrain-success")).toContainText(/Validated flume_basin_v1\.tif/i);
  });

  test("6. Simulation controls function (Run, Pause, Reset)", async ({ page }) => {
    await registerMockApiRoutes(page);
    await navigateToCrestixRoute(page, "/simulation");

    await expect(page.getByTestId("simulation-stub-notice")).toContainText(/STUBBED ADAPTER/i);
    await expect(page.getByTestId("sim-status-text")).toContainText(/IDLE/i);

    await page.getByTestId("sim-run-btn").click();
    await expect(page.getByTestId("sim-status-text")).toContainText(/COMPLETED.*13\.4 cm/i);

    await page.getByTestId("sim-pause-btn").click();
    await expect(page.getByTestId("sim-status-text")).toContainText(/PAUSED/i);

    await page.getByTestId("sim-reset-btn").click();
    await expect(page.getByTestId("sim-status-text")).toContainText(/IDLE/i);
  });

  test("7. Forecasting interface loads and displays horizon predictions", async ({ page }) => {
    await registerMockApiRoutes(page);
    await navigateToCrestixRoute(page, "/forecast");

    await expect(page.locator("h1")).toContainText(/Forecast/i);
    await expect(page.getByTestId("forecast-horizon-select")).toBeVisible();
    await expect(page.getByTestId("forecast-predictions")).toContainText(/12\.1 cm/i);
  });

  test("8. Sensor readings display with separate ultrasonic distance and calibrated water depth", async ({
    page,
  }) => {
    await registerMockApiRoutes(page);
    await navigateToCrestixRoute(page, "/sensors");

    await expect(page.getByTestId("sensor-distance-card")).toContainText("8.2 cm");
    await expect(page.getByTestId("sensor-depth-card")).toContainText("11.8 cm");
    await expect(page.getByTestId("sensor-temperature-card")).toContainText("29 °C");
  });

  test("9. Analytics charts and validation metrics render", async ({ page }) => {
    await registerMockApiRoutes(page);
    await navigateToCrestixRoute(page, "/analytics");

    await expect(page.getByTestId("analytics-kpi-cards")).toContainText("0.42 cm");
    await expect(page.getByTestId("analytics-kpi-cards")).toContainText("0.91");
    await expect(page.getByTestId("analytics-chart-svg")).toBeVisible();
  });

  test("10. API errors are handled gracefully with accessible alert feedback", async ({ page }) => {
    await registerMockApiRoutes(page, {
      failEndpoint: "/api/sensor/latest",
      failStatus: 503,
      failCode: "SENSOR_INGESTION_OFFLINE",
      failMessage: "ESP32 telemetry gateway is unreachable (503).",
    });

    await navigateToCrestixRoute(page, "/sensors");
    const errorBanner = page.getByTestId("api-error-banner");
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText(/ESP32 telemetry gateway is unreachable/i);
  });

  test("11. Mobile layout works without horizontal overflow and supports drawer navigation", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await registerMockApiRoutes(page);
    await navigateToCrestixRoute(page, "/");

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    const toggle = page.locator("#mobile-menu-toggle");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page.locator('#mobile-nav-drawer a[data-route="/analytics"]').click();
    await expect(page.locator("h1")).toContainText(/Analytics/i);
  });
});
