import React, { Component, ErrorInfo, ReactNode, useState } from "react";
import {
  MOCK_FORECAST_JOB,
  MOCK_SENSOR_HISTORY,
  MOCK_SENSOR_LATEST,
  MOCK_SIMULATION_JOB,
  MOCK_TERRAIN_METADATA,
  MOCK_VALIDATION_COMPARISONS,
  MOCK_VALIDATION_METRICS,
  validateTerrainUploadFile,
} from "../mocks/api-contracts";

export interface RouteDefinition {
  path: string;
  label: string;
  requiresAuth?: boolean;
  memberOwner: string;
}

export const CRESTIX_ROUTES: RouteDefinition[] = [
  { path: "/", label: "Overview", memberOwner: "Member 1" },
  { path: "/login", label: "Login", memberOwner: "Member 2" },
  { path: "/register", label: "Register", memberOwner: "Member 2" },
  { path: "/terrain", label: "Terrain & DEM", memberOwner: "Member 4" },
  { path: "/simulation", label: "Simulation", memberOwner: "Member 5" },
  { path: "/forecast", label: "AI Forecast", memberOwner: "Member 6" },
  { path: "/sensors", label: "Live Sensors", memberOwner: "Member 7" },
  { path: "/analytics", label: "Validation & Analytics", memberOwner: "Member 8" },
];

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export class CrestixErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || "Unexpected rendering failure in module.",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[CrestixErrorBoundary]", error.message, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <section
          role="alert"
          aria-live="assertive"
          data-testid="error-boundary-fallback"
          className="rounded-xl border border-red-300 bg-red-50 p-6 text-red-950"
        >
          <h2 className="text-lg font-semibold">
            {this.props.fallbackTitle ?? "Module Subsystem Unavailable"}
          </h2>
          <p className="mt-2 text-sm" data-testid="error-boundary-message">
            {this.state.errorMessage}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            data-testid="error-boundary-retry"
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white"
          >
            Retry Module
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}

export function CrestixNavigationShell({
  initialPath = "/",
  onNavigate,
}: {
  initialPath?: string;
  onNavigate?: (path: string) => void;
}) {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (path: string) => {
    setCurrentPath(path);
    setMobileMenuOpen(false);
    onNavigate?.(path);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" data-testid="app-shell">
      <a
        href="#main-workspace"
        className="sr-only focus:not-sr-only focus:p-2 focus:bg-blue-700 focus:text-white"
      >
        Skip to main workspace
      </a>
      <header className="border-b border-slate-800 bg-slate-950 px-4 py-3 text-slate-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="text-lg font-bold tracking-tight">Crestix Probe</span>
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
            data-testid="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden rounded border border-slate-700 px-3 py-1.5 text-sm"
          >
            {mobileMenuOpen ? "Close Menu" : "Menu"}
          </button>
          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-2">
            {CRESTIX_ROUTES.map((route) => {
              const active = currentPath === route.path;
              return (
                <button
                  key={route.path}
                  type="button"
                  onClick={() => handleNav(route.path)}
                  aria-current={active ? "page" : undefined}
                  data-testid={`nav-link-${route.path === "/" ? "home" : route.path.slice(1)}`}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    active ? "bg-cyan-600 text-white" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {route.label}
                </button>
              );
            })}
          </nav>
        </div>

        {mobileMenuOpen && (
          <nav
            id="mobile-nav-drawer"
            aria-label="Mobile navigation"
            data-testid="mobile-nav-drawer"
            className="mt-3 flex flex-col gap-1 border-t border-slate-800 pt-3 md:hidden"
          >
            {CRESTIX_ROUTES.map((route) => (
              <button
                key={route.path}
                type="button"
                onClick={() => handleNav(route.path)}
                aria-current={currentPath === route.path ? "page" : undefined}
                data-testid={`mobile-nav-${route.path === "/" ? "home" : route.path.slice(1)}`}
                className="rounded px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
              >
                {route.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main id="main-workspace" className="flex-1 p-4 md:p-8" data-testid="active-route-view">
        <RouteModuleView path={currentPath} onNavigate={handleNav} />
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-400">
        Crestix Probe Physical & Computational Flood Twin — QA Validated Build
      </footer>
    </div>
  );
}

export function RouteModuleView({
  path,
  onNavigate,
}: {
  path: string;
  onNavigate?: (path: string) => void;
}) {
  if (path === "/") {
    return (
      <section aria-labelledby="home-heading" className="space-y-4">
        <h1 id="home-heading" className="text-2xl font-bold">
          Crestix Probe Flood Research Platform
        </h1>
        <p className="text-slate-600">
          Integrated physical miniature flood prototype, ESP32 ultrasonic depth telemetry, numerical
          simulation, and AI flood forecasting workbench.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onNavigate?.("/terrain")}
            className="rounded bg-cyan-600 px-4 py-2 text-sm font-medium text-white"
          >
            Open Terrain Studio
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.("/sensors")}
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium"
          >
            View Live Sensors
          </button>
        </div>
      </section>
    );
  }

  if (path === "/login" || path === "/register") {
    const isRegister = path === "/register";
    return (
      <section aria-labelledby="auth-heading" className="mx-auto max-w-md space-y-4">
        <h1 id="auth-heading" className="text-2xl font-bold">
          {isRegister ? "Create Researcher Account" : "Researcher Sign In"}
        </h1>
        <form
          aria-label={isRegister ? "Registration form" : "Login form"}
          onSubmit={(e) => e.preventDefault()}
          className="space-y-3"
        >
          {isRegister && (
            <div>
              <label htmlFor="full-name" className="block text-sm font-medium">
                Full Name
              </label>
              <input
                id="full-name"
                name="fullName"
                type="text"
                required
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </div>
          )}
          <div>
            <label htmlFor="email-input" className="block text-sm font-medium">
              Institutional Email
            </label>
            <input
              id="email-input"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="password-input" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password-input"
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded bg-cyan-600 px-4 py-2 font-medium text-white"
          >
            {isRegister ? "Register Account" : "Sign In"}
          </button>
        </form>
      </section>
    );
  }

  if (path === "/terrain") {
    return <TerrainValidationHarness />;
  }

  if (path === "/simulation") {
    return <SimulationControlHarness />;
  }

  if (path === "/forecast") {
    return <ForecastInterfaceHarness />;
  }

  if (path === "/sensors") {
    return <SensorTelemetryHarness />;
  }

  if (path === "/analytics") {
    return <AnalyticsValidationHarness />;
  }

  return (
    <section role="alert" aria-labelledby="not-found-heading">
      <h1 id="not-found-heading" className="text-xl font-bold">
        404 — Route Not Found
      </h1>
    </section>
  );
}

export function TerrainValidationHarness() {
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = validateTerrainUploadFile({ name: file.name, size: file.size, type: file.type });
    if (!res.valid) {
      setIsError(true);
      setValidationMessage(res.error ?? "Invalid terrain file.");
    } else {
      setIsError(false);
      setValidationMessage(`Validated ${file.name} (${MOCK_TERRAIN_METADATA.crs})`);
    }
  };

  return (
    <section aria-labelledby="terrain-heading" className="space-y-4">
      <h1 id="terrain-heading" className="text-2xl font-bold">
        Terrain & Digital Elevation Model (DEM)
      </h1>
      <p className="text-sm text-slate-600">
        Active Dataset: {MOCK_TERRAIN_METADATA.name} ({MOCK_TERRAIN_METADATA.resolution_cm} cm grid)
      </p>
      <div>
        <label htmlFor="terrain-upload-input" className="block text-sm font-medium">
          Upload Terrain Elevation File (.tif, .asc, .dem, .geojson, .csv)
        </label>
        <input
          id="terrain-upload-input"
          data-testid="terrain-upload-input"
          type="file"
          onChange={handleFileChange}
          className="mt-1 block"
        />
      </div>
      {validationMessage && (
        <div
          role={isError ? "alert" : "status"}
          data-testid={isError ? "terrain-upload-error" : "terrain-upload-success"}
          className={`rounded p-3 text-sm ${
            isError ? "bg-red-50 text-red-900" : "bg-emerald-50 text-emerald-900"
          }`}
        >
          {validationMessage}
        </div>
      )}
    </section>
  );
}

export function SimulationControlHarness() {
  const [status, setStatus] = useState<"idle" | "running" | "paused" | "completed">("idle");
  const [inflowRate, setInflowRate] = useState(5.0);

  return (
    <section aria-labelledby="sim-heading" className="space-y-4">
      <h1 id="sim-heading" className="text-2xl font-bold">
        2D Shallow-Water Simulation Workbench
      </h1>
      <p className="rounded bg-amber-50 p-3 text-xs text-amber-900" data-testid="sim-stub-notice">
        {MOCK_SIMULATION_JOB.engine_notice}
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <label htmlFor="inflow-input" className="text-sm font-medium">
          Inflow Rate (L/min):
        </label>
        <input
          id="inflow-input"
          type="number"
          min={0}
          max={100}
          step={0.5}
          value={inflowRate}
          onChange={(e) => setInflowRate(Number(e.target.value))}
          className="rounded border px-2 py-1"
        />
        <button
          type="button"
          data-testid="sim-run-btn"
          onClick={() => setStatus("running")}
          className="rounded bg-cyan-600 px-4 py-2 text-sm font-medium text-white"
        >
          Run Simulation
        </button>
        <button
          type="button"
          data-testid="sim-pause-btn"
          onClick={() => setStatus("paused")}
          className="rounded border px-4 py-2 text-sm font-medium"
        >
          Pause
        </button>
        <button
          type="button"
          data-testid="sim-reset-btn"
          onClick={() => setStatus("idle")}
          className="rounded border px-4 py-2 text-sm font-medium"
        >
          Reset
        </button>
      </div>
      <div data-testid="sim-status-badge" className="text-sm font-semibold">
        Simulation Status: {status.toUpperCase()} | Peak Depth:{" "}
        {MOCK_SIMULATION_JOB.summary.max_depth_cm} cm
      </div>
    </section>
  );
}

export function ForecastInterfaceHarness() {
  const [horizon, setHorizon] = useState(60);

  return (
    <section aria-labelledby="forecast-heading" className="space-y-4">
      <h1 id="forecast-heading" className="text-2xl font-bold">
        AI Flood Depth Forecasting Interface
      </h1>
      <p className="rounded bg-amber-50 p-3 text-xs text-amber-900">
        {MOCK_FORECAST_JOB.engine_notice}
      </p>
      <div>
        <label htmlFor="horizon-select" className="mr-2 text-sm font-medium">
          Forecast Horizon:
        </label>
        <select
          id="horizon-select"
          data-testid="forecast-horizon-select"
          value={horizon}
          onChange={(e) => setHorizon(Number(e.target.value))}
          className="rounded border px-3 py-1.5 text-sm"
        >
          <option value={30}>30 seconds</option>
          <option value={60}>60 seconds</option>
          <option value={120}>120 seconds</option>
        </select>
      </div>
      <ul data-testid="forecast-predictions-list" className="space-y-2 text-sm">
        {MOCK_FORECAST_JOB.predictions.map((p) => (
          <li key={p.lead_time_seconds} className="rounded border p-2">
            +{p.lead_time_seconds}s ({p.position}): {p.predicted_depth_cm} cm (95% CI:{" "}
            {p.lower_ci_cm}–{p.upper_ci_cm} cm)
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SensorTelemetryHarness() {
  const [selectedPosition, setSelectedPosition] = useState<"P1" | "P2" | "P3">("P2");
  const reading =
    MOCK_SENSOR_HISTORY.items.find((r) => r.position === selectedPosition) ?? MOCK_SENSOR_LATEST;

  return (
    <section aria-labelledby="sensors-heading" className="space-y-4">
      <h1 id="sensors-heading" className="text-2xl font-bold">
        ESP32 Ultrasonic Live Sensor Telemetry
      </h1>
      <div className="flex items-center gap-2" role="group" aria-label="Probe position selector">
        {(["P1", "P2", "P3"] as const).map((pos) => (
          <button
            key={pos}
            type="button"
            data-testid={`sensor-pos-${pos}`}
            aria-pressed={selectedPosition === pos}
            onClick={() => setSelectedPosition(pos)}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              selectedPosition === pos ? "bg-cyan-600 text-white" : "border"
            }`}
          >
            Probe {pos}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded border p-4" data-testid="sensor-distance-card">
          <div className="text-xs text-slate-500">Measured Ultrasonic Distance</div>
          <div className="text-xl font-bold">{reading.raw_distance_cm} cm</div>
        </div>
        <div className="rounded border p-4" data-testid="sensor-depth-card">
          <div className="text-xs text-slate-500">Calculated Water Depth (Ref 20.0 cm)</div>
          <div className="text-xl font-bold">{reading.calculated_water_depth_cm} cm</div>
        </div>
        <div className="rounded border p-4" data-testid="sensor-temp-card">
          <div className="text-xs text-slate-500">Ambient Temperature</div>
          <div className="text-xl font-bold">{reading.temperature_c} °C</div>
        </div>
      </div>
    </section>
  );
}

export function AnalyticsValidationHarness() {
  return (
    <section aria-labelledby="analytics-heading" className="space-y-4">
      <h1 id="analytics-heading" className="text-2xl font-bold">
        Validation Metrics & Model Comparison Analytics
      </h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" data-testid="analytics-kpi-grid">
        <div className="rounded border p-3">
          <div className="text-xs text-slate-500">RMSE</div>
          <div className="text-lg font-bold">{MOCK_VALIDATION_METRICS.rmse_cm} cm</div>
        </div>
        <div className="rounded border p-3">
          <div className="text-xs text-slate-500">MAE</div>
          <div className="text-lg font-bold">{MOCK_VALIDATION_METRICS.mae_cm} cm</div>
        </div>
        <div className="rounded border p-3">
          <div className="text-xs text-slate-500">NSE</div>
          <div className="text-lg font-bold">{MOCK_VALIDATION_METRICS.nse}</div>
        </div>
        <div className="rounded border p-3">
          <div className="text-xs text-slate-500">R²</div>
          <div className="text-lg font-bold">{MOCK_VALIDATION_METRICS.r_squared}</div>
        </div>
      </div>
      <figure aria-label="Observed vs Simulated vs Forecast Water Depth Chart">
        <svg
          role="img"
          aria-label="Validation comparison chart"
          data-testid="analytics-chart-svg"
          viewBox="0 0 400 140"
          className="w-full rounded border bg-slate-950 p-2"
        >
          <title>Observed vs Simulated vs Forecast Water Depth</title>
          <polyline
            fill="none"
            stroke="#22d3ee"
            strokeWidth="3"
            points="20,110 180,65 360,40"
          />
          <polyline
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
            strokeDasharray="4 4"
            points="20,114 180,70 360,45"
          />
        </svg>
        <figcaption className="mt-1 text-xs text-slate-500">
          Samples compared: {MOCK_VALIDATION_COMPARISONS.comparisons.length} checkpoints
        </figcaption>
      </figure>
    </section>
  );
}
