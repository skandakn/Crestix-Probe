import { Page } from "@playwright/test";
import {
  createApiErrorEnvelope,
  MOCK_FORECAST_JOB,
  MOCK_HEALTH_RESPONSE,
  MOCK_SENSOR_HISTORY,
  MOCK_SENSOR_LATEST,
  MOCK_SIMULATION_FRAMES,
  MOCK_SIMULATION_JOB,
  MOCK_TERRAIN_METADATA,
  MOCK_VALIDATION_COMPARISONS,
  MOCK_VALIDATION_METRICS,
} from "../../tests/mocks/api-contracts";

export interface MockApiOptions {
  failEndpoint?: string;
  failStatus?: number;
  failCode?: string;
  failMessage?: string;
}

export async function registerMockApiRoutes(page: Page, options: MockApiOptions = {}) {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;

    if (options.failEndpoint && pathname.includes(options.failEndpoint)) {
      const status = options.failStatus ?? 503;
      const envelope = createApiErrorEnvelope(
        options.failCode ?? "SERVICE_UNAVAILABLE",
        options.failMessage ?? "Upstream flood telemetry service is temporarily unavailable.",
        pathname
      );
      await route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(envelope),
      });
      return;
    }

    if (pathname.endsWith("/api/health")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_HEALTH_RESPONSE),
      });
      return;
    }

    if (pathname.endsWith("/api/sensor/latest")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SENSOR_LATEST),
      });
      return;
    }

    if (pathname.endsWith("/api/sensor/history")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SENSOR_HISTORY),
      });
      return;
    }

    if (pathname.endsWith("/api/terrain/upload")) {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(MOCK_TERRAIN_METADATA),
      });
      return;
    }

    if (pathname.endsWith("/api/validation/metrics")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_VALIDATION_METRICS),
      });
      return;
    }

    if (pathname.endsWith("/api/validation/comparisons")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_VALIDATION_COMPARISONS),
      });
      return;
    }

    if (pathname.endsWith("/api/simulation/run")) {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SIMULATION_JOB),
      });
      return;
    }

    if (pathname.endsWith("/frames") && pathname.includes("/api/simulation/")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SIMULATION_FRAMES),
      });
      return;
    }

    if (pathname.endsWith("/api/forecast/predict") || pathname.includes("/api/forecast/")) {
      // Allow Next.js local forecast API routes to pass through unless mocked
      await route.continue();
      return;
    }

    await route.continue();
  });
}

export async function navigateToCrestixRoute(page: Page, routePath: string) {
  await page.goto(routePath, { waitUntil: "load" });
}
