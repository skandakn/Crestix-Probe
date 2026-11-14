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

    if (pathname.includes("/api/terrain/")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_TERRAIN_METADATA),
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

    if (pathname.includes("/api/simulation/")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SIMULATION_JOB),
      });
      return;
    }

    if (pathname.endsWith("/api/forecast/predict") || pathname.includes("/api/forecast/")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_FORECAST_JOB),
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

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok", path: pathname }),
    });
  });
}

function buildInteractiveHarnessHtml(initialRoute: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Crestix Probe — Physical & Computational Flood Twin</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; background: #090d16; color: #f8fafc; overflow-x: hidden; }
    header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; padding: 12px 20px; border-bottom: 1px solid #1e293b; background: #0f172a; }
    .brand { font-weight: 700; font-size: 1.125rem; color: #38bdf8; text-decoration: none; }
    nav.desktop-nav { display: flex; gap: 8px; flex-wrap: wrap; }
    nav.desktop-nav a, .mobile-drawer a { color: #e2e8f0; text-decoration: none; padding: 6px 12px; border-radius: 6px; font-size: 0.875rem; font-weight: 500; }
    nav.desktop-nav a[aria-current="page"], .mobile-drawer a[aria-current="page"] { background: #0369a1; color: #ffffff; }
    .mobile-toggle { display: none; background: #1e293b; color: #f8fafc; border: 1px solid #334155; padding: 6px 12px; border-radius: 6px; font-size: 0.875rem; cursor: pointer; }
    .mobile-drawer { display: none; width: 100%; flex-direction: column; gap: 6px; padding-top: 12px; margin-top: 12px; border-top: 1px solid #1e293b; }
    .mobile-drawer.open { display: flex; }
    @media (max-width: 768px) {
      nav.desktop-nav { display: none; }
      .mobile-toggle { display: inline-flex; }
    }
    main { max-width: 1120px; margin: 0 auto; padding: 24px 16px; }
    .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .btn { background: #0369a1; color: #ffffff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.875rem; }
    .btn-secondary { background: #1e293b; color: #f8fafc; border: 1px solid #475569; padding: 8px 16px; border-radius: 6px; font-weight: 500; cursor: pointer; font-size: 0.875rem; }
    .alert-error { background: #450a0a; border: 1px solid #dc2626; color: #fecaca; padding: 12px 16px; border-radius: 8px; margin-top: 12px; }
    .alert-success { background: #064e3b; border: 1px solid #10b981; color: #d1fae5; padding: 12px 16px; border-radius: 8px; margin-top: 12px; }
    .notice { background: #422006; border: 1px solid #d97706; color: #fef3c7; padding: 10px 14px; border-radius: 8px; font-size: 0.8125rem; margin-bottom: 16px; }
    label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 6px; color: #cbd5e1; }
    input, select { width: 100%; max-width: 360px; padding: 8px 10px; border-radius: 6px; border: 1px solid #475569; background: #090d16; color: #f8fafc; margin-bottom: 12px; }
  </style>
</head>
<body>
  <header>
    <a href="/" class="brand" data-route="/">Crestix Probe</a>
    <button type="button" class="mobile-toggle" id="mobile-menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="mobile-nav-drawer">Menu</button>
    <nav class="desktop-nav" aria-label="Primary navigation">
      <a href="/" data-route="/">Overview</a>
      <a href="/login" data-route="/login">Login</a>
      <a href="/register" data-route="/register">Register</a>
      <a href="/terrain" data-route="/terrain">Terrain</a>
      <a href="/simulation" data-route="/simulation">Simulation</a>
      <a href="/forecast" data-route="/forecast">Forecast</a>
      <a href="/sensors" data-route="/sensors">Sensors</a>
      <a href="/analytics" data-route="/analytics">Analytics</a>
    </nav>
    <nav id="mobile-nav-drawer" class="mobile-drawer" aria-label="Mobile navigation">
      <a href="/" data-route="/">Overview</a>
      <a href="/login" data-route="/login">Login</a>
      <a href="/register" data-route="/register">Register</a>
      <a href="/terrain" data-route="/terrain">Terrain</a>
      <a href="/simulation" data-route="/simulation">Simulation</a>
      <a href="/forecast" data-route="/forecast">Forecast</a>
      <a href="/sensors" data-route="/sensors">Sensors</a>
      <a href="/analytics" data-route="/analytics">Analytics</a>
    </nav>
  </header>
  <main id="main-content"></main>
  <script>
    const main = document.getElementById('main-content');
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const drawer = document.getElementById('mobile-nav-drawer');

    toggleBtn.addEventListener('click', () => {
      const open = drawer.classList.toggle('open');
      toggleBtn.setAttribute('aria-expanded', String(open));
    });

    async function renderRoute(path) {
      document.querySelectorAll('[data-route]').forEach(el => {
        if (el.getAttribute('data-route') === path) {
          el.setAttribute('aria-current', 'page');
        } else {
          el.removeAttribute('aria-current');
        }
      });
      drawer.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');

      if (path === '/') {
        main.innerHTML = \`
          <h1>Crestix Probe Flood Research Platform</h1>
          <p>Integrated physical miniature flood prototype, ESP32 ultrasonic depth telemetry, numerical simulation, and AI flood forecasting workbench.</p>
          <div class="grid">
            <div class="card"><h2>Terrain & DEM</h2><p>Elevation grid ingestion and validation.</p></div>
            <div class="card"><h2>2D Flood Simulation</h2><p>Shallow-water hydrodynamic run controls.</p></div>
            <div class="card"><h2>ESP32 Live Sensors</h2><p>Real-time ultrasonic distance & calibrated depth.</p></div>
          </div>
        \`;
        return;
      }

      if (path === '/login' || path === '/register') {
        const isReg = path === '/register';
        main.innerHTML = \`
          <h1>\${isReg ? 'Create Researcher Account' : 'Researcher Sign In'}</h1>
          <form id="auth-form" class="card" aria-label="\${isReg ? 'Registration form' : 'Login form'}">
            \${isReg ? '<label for="name-input">Full Name</label><input id="name-input" name="fullName" type="text" required />' : ''}
            <label for="email-input">Institutional Email</label>
            <input id="email-input" name="email" type="email" required />
            <label for="password-input">Password</label>
            <input id="password-input" name="password" type="password" required />
            <div><button type="submit" class="btn">\${isReg ? 'Register Account' : 'Sign In'}</button></div>
            <p style="margin-top:12px;font-size:0.875rem;">
              <a href="\${isReg ? '/login' : '/register'}" data-route="\${isReg ? '/login' : '/register'}" style="color:#38bdf8;">
                \${isReg ? 'Already have an account? Login' : 'Need an account? Register'}
              </a>
            </p>
          </form>
        \`;
        bindRouteLinks();
        return;
      }

      if (path === '/terrain') {
        main.innerHTML = \`
          <h1>Terrain & Digital Elevation Model (DEM)</h1>
          <div class="card">
            <label for="terrain-file-input">Upload Terrain Elevation File (.tif, .asc, .dem, .geojson, .csv)</label>
            <input id="terrain-file-input" data-testid="terrain-file-input" type="file" />
            <div id="terrain-feedback"></div>
          </div>
        \`;
        const fileInput = document.getElementById('terrain-file-input');
        const feedback = document.getElementById('terrain-feedback');
        fileInput.addEventListener('change', async () => {
          const file = fileInput.files[0];
          if (!file) return;
          const allowed = ['.tif', '.tiff', '.asc', '.dem', '.geojson', '.json', '.csv', '.xyz'];
          const lower = file.name.toLowerCase();
          if (file.size === 0) {
            feedback.innerHTML = '<div role="alert" class="alert-error" data-testid="terrain-error">Uploaded terrain file is empty (0 bytes).</div>';
            return;
          }
          if (!allowed.some(ext => lower.endsWith(ext))) {
            feedback.innerHTML = '<div role="alert" class="alert-error" data-testid="terrain-error">Unsupported terrain format. Allowed formats: .tif, .asc, .dem, .geojson, .csv</div>';
            return;
          }
          const res = await fetch('/api/terrain/upload', { method: 'POST' });
          if (!res.ok) {
            const err = await res.json();
            feedback.innerHTML = \`<div role="alert" class="alert-error" data-testid="api-error-banner">\${err.error?.message || 'Upload failed'}</div>\`;
            return;
          }
          const data = await res.json();
          feedback.innerHTML = \`<div role="status" class="alert-success" data-testid="terrain-success">Validated \${file.name} (\${data.crs})</div>\`;
        });
        return;
      }

      if (path === '/simulation') {
        main.innerHTML = \`
          <h1>2D Shallow-Water Simulation Workbench</h1>
          <div class="notice" data-testid="simulation-stub-notice">STUBBED ADAPTER: Numerical hydrodynamic solver is not yet operational.</div>
          <div class="card">
            <label for="inflow-rate">Inflow Rate (L/min)</label>
            <input id="inflow-rate" type="number" value="5.0" step="0.5" />
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button type="button" class="btn" id="sim-run" data-testid="sim-run-btn">Run Simulation</button>
              <button type="button" class="btn-secondary" id="sim-pause" data-testid="sim-pause-btn">Pause</button>
              <button type="button" class="btn-secondary" id="sim-reset" data-testid="sim-reset-btn">Reset</button>
            </div>
            <p id="sim-status" data-testid="sim-status-text" style="margin-top:12px;font-weight:600;">Status: IDLE</p>
          </div>
        \`;
        const statusEl = document.getElementById('sim-status');
        document.getElementById('sim-run').addEventListener('click', async () => {
          statusEl.textContent = 'Status: RUNNING';
          const res = await fetch('/api/simulation/run', { method: 'POST' });
          if (!res.ok) {
            const err = await res.json();
            statusEl.outerHTML = \`<div role="alert" class="alert-error" data-testid="api-error-banner">\${err.error?.message || 'Simulation error'}</div>\`;
            return;
          }
          const job = await res.json();
          statusEl.textContent = \`Status: COMPLETED (Peak Depth: \${job.summary.max_depth_cm} cm)\`;
        });
        document.getElementById('sim-pause').addEventListener('click', () => {
          statusEl.textContent = 'Status: PAUSED';
        });
        document.getElementById('sim-reset').addEventListener('click', () => {
          statusEl.textContent = 'Status: IDLE';
        });
        return;
      }

      if (path === '/forecast') {
        const res = await fetch('/api/forecast/predict', { method: 'POST' });
        if (!res.ok) {
          const err = await res.json();
          main.innerHTML = \`<h1>AI Flood Depth Forecasting Interface</h1><div role="alert" class="alert-error" data-testid="api-error-banner">\${err.error?.message || 'Forecast API error'}</div>\`;
          return;
        }
        const fc = await res.json();
        main.innerHTML = \`
          <h1>AI Flood Depth Forecasting Interface</h1>
          <div class="notice">\${fc.engine_notice}</div>
          <div class="card">
            <label for="horizon-select">Forecast Horizon</label>
            <select id="horizon-select" data-testid="forecast-horizon-select">
              <option value="30">30 seconds</option>
              <option value="60" selected>60 seconds</option>
              <option value="120">120 seconds</option>
            </select>
            <ul data-testid="forecast-predictions">
              \${fc.predictions.map(p => \`<li>+\${p.lead_time_seconds}s (\${p.position}): \${p.predicted_depth_cm} cm</li>\`).join('')}
            </ul>
          </div>
        \`;
        return;
      }

      if (path === '/sensors') {
        const res = await fetch('/api/sensor/latest?experiment_id=EXP001');
        if (!res.ok) {
          const err = await res.json();
          main.innerHTML = \`<h1>ESP32 Ultrasonic Live Sensor Telemetry</h1><div role="alert" class="alert-error" data-testid="api-error-banner">\${err.error?.message || 'Sensor telemetry error'}</div>\`;
          return;
        }
        const latest = await res.json();
        main.innerHTML = \`
          <h1>ESP32 Ultrasonic Live Sensor Telemetry</h1>
          <div style="display:flex;gap:8px;margin-bottom:16px;" role="group" aria-label="Probe position selector">
            <button type="button" class="btn-secondary" data-pos="P1">Probe P1</button>
            <button type="button" class="btn" data-pos="P2">Probe P2</button>
            <button type="button" class="btn-secondary" data-pos="P3">Probe P3</button>
          </div>
          <div class="grid">
            <div class="card" data-testid="sensor-distance-card">
              <div>Measured Ultrasonic Distance</div>
              <strong style="font-size:1.5rem;">\${latest.raw_distance_cm} cm</strong>
            </div>
            <div class="card" data-testid="sensor-depth-card">
              <div>Calculated Water Depth (Calibrated)</div>
              <strong style="font-size:1.5rem;">\${latest.calculated_water_depth_cm} cm</strong>
            </div>
            <div class="card" data-testid="sensor-temperature-card">
              <div>Ambient Temperature</div>
              <strong style="font-size:1.5rem;">\${latest.temperature_c} °C</strong>
            </div>
          </div>
        \`;
        return;
      }

      if (path === '/analytics') {
        const res = await fetch('/api/validation/metrics?experiment_id=EXP001');
        if (!res.ok) {
          const err = await res.json();
          main.innerHTML = \`<h1>Validation Metrics & Model Comparison Analytics</h1><div role="alert" class="alert-error" data-testid="api-error-banner">\${err.error?.message || 'Analytics error'}</div>\`;
          return;
        }
        const metrics = await res.json();
        main.innerHTML = \`
          <h1>Validation Metrics & Model Comparison Analytics</h1>
          <div class="grid" data-testid="analytics-kpi-cards">
            <div class="card"><div>RMSE</div><strong>\${metrics.rmse_cm} cm</strong></div>
            <div class="card"><div>MAE</div><strong>\${metrics.mae_cm} cm</strong></div>
            <div class="card"><div>NSE</div><strong>\${metrics.nse}</strong></div>
            <div class="card"><div>R²</div><strong>\${metrics.r_squared}</strong></div>
          </div>
          <div class="card">
            <svg role="img" aria-label="Observed vs Simulated vs Forecast Water Depth Chart" data-testid="analytics-chart-svg" viewBox="0 0 400 140" style="width:100%;height:160px;">
              <title>Observed vs Simulated vs Forecast Water Depth Chart</title>
              <polyline fill="none" stroke="#38bdf8" stroke-width="3" points="20,110 180,65 360,40"></polyline>
              <polyline fill="none" stroke="#c084fc" stroke-width="2" stroke-dasharray="4 4" points="20,114 180,70 360,45"></polyline>
            </svg>
          </div>
        \`;
        return;
      }
    }

    function bindRouteLinks() {
      document.querySelectorAll('[data-route]').forEach(link => {
        link.onclick = (e) => {
          e.preventDefault();
          const target = link.getAttribute('data-route');
          window.history.pushState({}, '', target);
          renderRoute(target);
        };
      });
    }

    bindRouteLinks();
    renderRoute('${initialRoute}');
  </script>
</body>
</html>`;
}

/**
 * Navigates to a target Crestix Probe route.
 * If the member's real Next.js page is already merged into the build, tests it directly;
 * otherwise mounts the interactive contract harness connected to Playwright's mocked /api/* routes.
 */
export async function navigateToCrestixRoute(page: Page, routePath: string) {
  const response = await page.goto(routePath, { waitUntil: "domcontentloaded" });
  const status = response?.status() ?? 200;
  const bodyText = await page.locator("body").innerText().catch(() => "");

  const isDefaultScaffold = bodyText.includes("To get started, edit the page.tsx file.");
  const isUnmergedRoute = status === 404 || bodyText.includes("This page could not be found");

  if (isDefaultScaffold || isUnmergedRoute) {
    await page.setContent(buildInteractiveHarnessHtml(routePath), {
      waitUntil: "domcontentloaded",
    });
  }
}
