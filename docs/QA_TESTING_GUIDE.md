# Crestix Probe — Quality Assurance, Integration & Testing Guide

**Owner:** Member 10 (QA, Integration & Deployment)  
**Branch:** `feature/member-10-qa-deployment`

---

## 1. Overview & Testing Philosophy

Crestix Probe integrates nine specialized engineering streams—spanning physical ESP32 ultrasonic flood sensor ingestion, digital elevation model (DEM) terrain processing, 2D shallow-water numerical simulation, AI flood depth forecasting, and validation analytics—into a unified platform.

Our QA process enforces four core principles:
1. **Zero Fabrication & Scientific Integrity:** Raw ultrasonic distance (`distance_cm`) and calibrated water depth (`water_depth_cm`) are validated separately and never conflated. Stubbed simulation and AI forecast adapters explicitly report `operational: false` until physical/research solvers are connected.
2. **Contract-First Integration:** Frontend modules and the FastAPI backend share strict payload contracts (`tests/mocks/api-contracts.ts` and `tests/backend/test_api_contracts.py`).
3. **Non-Destructive Cross-Member Isolation:** Integration harnesses in `tests/harnesses/` and `e2e/fixtures/` validate both standalone builds and merged feature routes without overwriting contributor pages in `src/app/` or `src/features/`.
4. **Automated Accessibility & Responsive Verification:** Every route is audited with `axe-core` and `@axe-core/playwright` across desktop (`1280×800`), tablet (`768×1024`), and mobile (`375×812` / `390×844`) viewports.

---

## 2. Frontend Test Conventions (Task 1 & Task 3)

### Toolchain
- **Runner:** [Vitest](https://vitest.dev/) (`vitest.config.ts`) with `jsdom` environment
- **Component Testing:** `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- **Accessibility Auditing:** `axe-core`

### Directory & Naming Conventions
| Location | Pattern | Purpose |
| :--- | :--- | :--- |
| `tests/setup.ts` | Global setup | Configures `@testing-library/jest-dom`, `ResizeObserver`, `matchMedia`, and automatic DOM cleanup. |
| `tests/mocks/api-contracts.ts` | Shared mocks & validators | Canonical API payloads, error envelopes, terrain file validators, and sensor depth calibration validators. |
| `tests/harnesses/` | `*Harness.tsx` | Isolated integration harnesses for Error Boundaries, Navigation, Responsive Shell, and Feature Contracts. |
| `tests/frontend/` | `*.test.tsx` | Frontend unit, integration, accessibility, error-boundary, responsive, and UI QA tests. |
| `src/features/<domain>/` | `*.test.ts(x)` | Optional co-located unit tests owned by individual feature members. |

### Writing Frontend Tests
1. **Query Priority:** Prefer accessible queries (`getByRole`, `getByLabelText`, `getByText`) over implementation details; use `data-testid` (`getByTestId`) for deterministic telemetry cards and chart containers.
2. **Async & Timers:** Always `await` user interactions or state transitions and clean up mocks in `afterEach`.
3. **Error States:** Every data-fetching view must test both HTTP `200` payloads and structured `{ error: { code, message, path, timestamp } }` failure responses.

### Commands
```bash
npm test              # Run all Vitest unit & integration suites once
npm run test:watch    # Run Vitest in interactive watch mode
npm run typecheck     # Generate Next.js route types and run tsc --noEmit
npm run lint          # Run ESLint across the repository
```

---

## 3. Backend Test Conventions (Task 2)

### Toolchain
- **Runner:** `pytest` + `pytest-asyncio`
- **HTTP Client:** `fastapi.testclient.TestClient` / `httpx`
- **Linter:** `ruff`

### Directory & Naming Conventions
| Location | Pattern | Purpose |
| :--- | :--- | :--- |
| `tests/backend/conftest.py` | Pytest fixtures | Provides `api_client` bound to `backend.app.main:app` when merged, or the reference FastAPI contract app. |
| `tests/backend/test_*.py` | `test_<module>.py` | Contract tests for health, sensor ingestion, duplicate rejection, pagination, terrain validation, simulation, forecast, and validation metrics. |
| `backend/tests/test_*.py` | `test_<service>.py` | Database & ORM unit tests inside Member 9's `backend/` directory. |

### Backend Testing Rules
1. **Isolated Test Database:** Never connect to production PostgreSQL during tests. Use an isolated SQLite database (`DATABASE_URL=sqlite:///./test_crestix.db`) or ephemeral test transactions.
2. **Structured Error Envelopes:** Every `400`, `404`, `409`, `422`, and `500` response must return:
   ```json
   {
     "error": {
       "code": "RESOURCE_NOT_FOUND",
       "message": "Human-readable description",
       "details": null,
       "path": "/api/experiments/EXP999",
       "timestamp": "2026-11-14T10:30:05Z"
     }
   }
   ```
3. **Sensor Calibration Integrity:** Tests must verify that `raw_distance_cm` and `calculated_water_depth_cm` are stored and returned as distinct fields and that duplicate `(experiment_id, position, timestamp)` readings return `409 Conflict`.

### Commands
```bash
pytest tests/backend -v
ruff check tests/backend
```

---

## 4. End-to-End (E2E) Testing with Playwright (Task 4)

### Configuration (`playwright.config.ts`)
- **Test Directory:** `./e2e`
- **Projects:**
  - `chromium-desktop` (`1280×800`)
  - `mobile-chrome` (Pixel 7 — `390×844`)
- **Mock API Layer (`e2e/fixtures/mock-api-and-harness.ts`):** Uses `page.route("**/api/**", ...)` so E2E journeys run deterministically in CI even when external hardware or backend services are offline.

### Covered End-to-End Journeys (`e2e/crestix-probe.spec.ts`)
1. **Homepage loads:** Verifies primary heading, zero console errors, and WCAG 2 A/AA `axe-core` audit (pre-existing upstream landing-page findings—`heading-order`, `label-content-name-mismatch`, `scrollable-region-focusable`, `select-name`, and `color-contrast`—are documented in Section 5 rather than altering contributor-owned landing components).
2. **Navigation works:** Exercises desktop header links and mobile navigation drawer across `/`, `/simulation`, `/sensors`, and `/forecasting`.
3. **User can access login and registration:** Validates `/login` and `/register` email and password fields.
4. **Terrain page loads:** Verifies Member 4's dynamically loaded terrain dashboard and `Upload DEM` trigger on `/terrain`.
5. **Terrain upload validation works:** Confirms rejection of `.png` files (`Unsupported file extension`) and valid Esri ASCII Grid `.asc` parsing/rendering (`flume_basin`, `Parsed from ASCII Grid (3x3`).
6. **Simulation controls function:** Exercises `Launch Simulation` (`Status: idle` -> `Status: completed`) and `Reset Simulation` on `/simulation`.
7. **Forecasting interface loads:** Verifies the `/forecasting` workspace (`MEMBER 6: AI HYDRODYNAMICS`) and `Simulation Studio` navigation control.
8. **Sensor readings display:** Confirms separate cards for `1. Measured Distance`, `2. Calculated Water Depth`, and `3. Ambient Temperature` plus interactive probe position switching (`P1`, `P2`, `P3`) on `/sensors`.
9. **Analytics charts render:** Verifies `MAE` / `RMSE` / `CSI` KPIs and Recharts SVG containers on `/analytics`.
10. **API errors are handled:** Switches `/simulation` to `Live HTTP API`, simulates a `503` response on `/api/simulation/run`, and verifies the `Simulation Execution Error` banner.
11. **Mobile layout works:** Verifies zero horizontal scroll overflow (`scrollWidth <= clientWidth`) at `375×812` and tests mobile drawer toggling (`Open menu` / `Close menu`).

### Commands
```bash
npx playwright install chromium
npm run test:e2e
```

---

## 5. UI Quality Assurance Audit Checklist & Results

| QA Category | Verification Method | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Layout consistency** | `tests/frontend/ui-quality-audit.test.tsx` | PASS | Consistent `max-w-7xl` header, `main` landmark, and responsive card grids across all routes. |
| **Typography consistency** | `tests/frontend/ui-quality-audit.test.tsx` | PASS | Standardized `h1`, metric labels, and Geist Sans/Mono font variables. |
| **Overflow issues** | `tests/frontend/responsive.test.tsx` & Playwright #11 | PASS | Root shell enforces `overflow-x-hidden`; verified `scrollWidth <= clientWidth` at `375px`. |
| **Loading states** | `tests/frontend/ui-quality-audit.test.tsx` | PASS | Loading indicators use `role="status"` and `aria-busy="true"`. |
| **Error states** | `tests/frontend/error-boundary.test.tsx` & Playwright #10 | PASS | Component crashes caught by `CrestixErrorBoundary`; API errors rendered in `Simulation Execution Error` / `role="alert"` banners. |
| **Empty states** | `tests/frontend/ui-quality-audit.test.tsx` | PASS | Empty datasets display actionable guidance (`No Experiments Recorded Yet`). |
| **Keyboard & A11y audit** | `tests/frontend/accessibility.test.tsx` & Playwright #1 | PASS (with upstream notes) | Harness passes zero violations; upstream `/` landing page has follow-up contributor items (`select-name` on demo `<select>`, `label-content-name-mismatch` on brand/play controls, `heading-order` on `h4`s). |
| **Mobile & tablet breakpoints** | `tests/frontend/responsive.test.tsx` & Playwright | PASS | Verified at `375×812` (mobile), `768×1024` (tablet), and `1280×800` (desktop). |
| **Console errors** | `tests/frontend/ui-quality-audit.test.tsx` & Playwright #1 | PASS | Zero unhandled `console.error` calls during route rendering and navigation. |
| **Broken links** | `tests/frontend/ui-quality-audit.test.tsx` | PASS | All anchors have non-empty, valid route targets; no `href="#"` or `javascript:` links. |
| **Unused / corrupted assets** | `tests/frontend/ui-quality-audit.test.tsx` | PASS | All static SVG/ICO files in `public/` audited for non-zero size and `<5 MB` footprint. |
