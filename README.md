# Crestix Probe — Mission Architecture & Frontend Foundation

> **Autonomous Planetary Surface Exploration & Telemetry Console**  
> Repository: [https://github.com/skandakn/Crestix-Probe](https://github.com/skandakn/Crestix-Probe)  
> Branch: `feature/member-1-foundation`

---

## 1. Project Overview

**Crestix Probe** is a mission-grade telemetry intelligence and control console designed for autonomous planetary probes. The frontend platform is built on **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**, featuring a dark scientific HUD design system (Charcoal, Slate, Cyan, and Teal).

This foundation was engineered by **Member 1 (Lead Frontend Architect)** to establish uniform architectural contracts, reusable component libraries, responsive navigation, and mock data standards across all feature squads.

---

## 2. Getting Started & Installation

Follow these steps from a fresh clone:

```bash
# 1. Clone repository
git clone https://github.com/skandakn/Crestix-Probe.git
cd Crestix-Probe

# 2. Check out your feature branch
git checkout -b feature/member-<X>-<feature-name>

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the console.

---

## 3. Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `dev` | `npm run dev` | Starts local Next.js Turbopack development server on `localhost:3000` |
| `build` | `npm run build` | Builds optimized production artifacts with static route prerendering |
| `start` | `npm run start` | Boots production server |
| `lint` | `npm run lint` | Runs ESLint validation across all source files |

---

## 4. Environment Variables

Create a `.env.local` file in the root directory (optional in development; defaults to internal fallbacks):

```env
# Base URL for backend telemetry endpoints
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Mission identifier
NEXT_PUBLIC_MISSION_CODE=CX-PROBE-01
```

---

## 5. Directory Structure & Team Ownership

```
src/
├── app/                        # Next.js App Router route shells
│   ├── (public)/               # Public marketing & authentication routes
│   │   ├── page.tsx            # / (Mission Portal / Landing)
│   │   ├── login/page.tsx      # /login (Operator Authentication)
│   │   └── register/page.tsx   # /register (Operator Registration)
│   ├── dashboard/page.tsx      # /dashboard (Mission Telemetry Overview)
│   ├── terrain/page.tsx        # /terrain (Topographic & LiDAR)
│   ├── simulation/page.tsx     # /simulation (Descent Physics & RCS)
│   ├── forecasting/page.tsx    # /forecasting (Atmospheric & Solar)
│   ├── sensors/page.tsx        # /sensors (Multi-Spectral Telemetry)
│   ├── analytics/page.tsx      # /analytics (Longitudinal Analysis)
│   ├── layout.tsx              # Root HTML & dark font configuration
│   ├── globals.css             # Tailwind v4 theme tokens
│   ├── loading.tsx             # Global loading fallback boundary
│   ├── error.tsx               # Global error boundary
│   └── not-found.tsx           # Global 404 handler
├── components/
│   ├── ui/                     # Reusable foundational design tokens & UI library
│   │   ├── button.tsx          # Buttons (primary, secondary, outline, ghost, destructive)
│   │   ├── input.tsx           # Form inputs with icons and error states
│   │   ├── card.tsx            # Charcoal/slate surface cards & glow variants
│   │   ├── tabs.tsx            # Tab switching primitives
│   │   ├── badge.tsx           # Status indicators (cyan, teal, warning, pulse dot)
│   │   ├── modal.tsx           # Accessible dialog overlays
│   │   ├── tooltip.tsx         # Hover tooltips
│   │   ├── loading-state.tsx   # Spinners, skeletons, and radar loaders
│   │   ├── empty-state.tsx     # Empty state placeholder with actions
│   │   ├── error-state.tsx     # Retry-capable alert containers
│   │   └── index.ts            # Barrel export
│   └── layout/                 # Shared shell & navigation components
│       ├── app-shell.tsx       # Main dashboard layout wrapper
│       ├── sidebar.tsx         # Responsive collapsible sidebar
│       ├── header.tsx          # Sticky top bar with mission time & latency
│       ├── user-profile.tsx    # Operator clearance & profile drawer
│       ├── page-header.tsx     # Standard page breadcrumbs & action bar
│       ├── feature-shell.tsx   # Feature scaffolding & preview container
│       └── index.ts            # Barrel export
├── features/                   # Team Feature Ownership Modules
│   ├── landing/                # Member 1 & Landing Team
│   ├── terrain/                # Member 2 (Terrain Elevation & LiDAR)
│   ├── simulation/             # Member 3 (Physics & Descent Trajectories)
│   ├── forecasting/            # Member 4 (Weather, Solar Flux & Dust Storms)
│   ├── sensors/                # Member 5 (Multi-Spectral Sensor Arrays)
│   ├── analytics/              # Member 6 (Mission Reports & Degradation)
│   └── auth/                   # Auth Team (Credentials, RBAC & Enclave)
├── config/
│   ├── navigation.ts           # Route definitions, icons, section links
│   ├── site.ts                 # Probe metadata & mission parameters
│   └── theme.ts                # Design tokens & color constants
├── hooks/
│   ├── use-sidebar.ts          # Sidebar collapse & mobile drawer state
│   ├── use-media-query.ts      # Responsive breakpoint listener (SSR-safe)
│   └── use-mounted.ts          # Client hydration hook (SSR-safe)
├── lib/
│   ├── utils.ts                # cn() class merger & mission time formatter
│   ├── api-client.ts           # Standard fetch client with ApiResponse envelope
│   └── mock-data.ts            # Shared fixtures & delay simulators
└── types/                      # Universal TypeScript declarations
    ├── navigation.ts           # Route paths & NavItem contracts
    ├── api.ts                  # ApiResponse, ApiError envelopes
    ├── user.ts                 # UserProfile & role contracts
    ├── layout.tsx              # Layout & breadcrumb contracts
    └── index.ts                # Barrel export
```

### Feature Ownership Matrix

| Feature Module | Route | Assigned Squad | Primary Deliverable |
| :--- | :--- | :--- | :--- |
| **Foundation & Architecture** | Shared | **Member 1** | Design system, AppShell, contracts, shared components, routing |
| **Landing Portal** | `/` | **Member 1** / Squad | Mission overview, system status, module navigation |
| **Terrain Mapping** | `/terrain` | **Member 2** | 3D surface heightmaps, LiDAR point clouds, geological hazard flags |
| **Probe Simulation** | `/simulation` | **Member 3** | Descent trajectory modeling, RCS thruster burns, delta-V fuel curves |
| **Forecasting** | `/forecasting` | **Member 4** | Surface weather, atmospheric gradients, solar flux & storm risks |
| **Sensors & Telemetry** | `/sensors` | **Member 5** | Sensor array health matrix, live packet decoding, calibration |
| **Mission Analytics** | `/analytics` | **Member 6** | Historical trends, battery degradation curves, automated report export |
| **Authentication** | `/login`, `/register` | **Auth Squad** | Callsign login, RBAC clearance level enforcement, session tokens |

---

## 6. Shared Engineering Contracts

All developers **MUST** adhere to the following 6 shared contracts to prevent regressions and maintain design harmony:

### Contract 1: Common Component Import Paths
Never write duplicate buttons, cards, or inputs. Import directly from `@/components/ui`:

```tsx
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Badge,
  Tabs,
  TabList,
  TabTrigger,
  TabContent,
  Modal,
  Tooltip,
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/components/ui";
```

### Contract 2: Design Tokens & Tailwind Palette
Always use the standardized palette tokens in Tailwind classes:

- **Charcoal (`#07090e`, `#0b0f17`, `#101520`, `#151d2c`)**: Backgrounds, surfaces, cards.
- **Slate (`#1e293b`, `#334155`, `#475569`, `#94a3b8`)**: Borders, dividing lines, secondary text.
- **Cyan (`#06b6d4`, `#22d3ee`, `#0891b2`)**: Primary active accent, telemetry markers, vector highlights.
- **Teal (`#14b8a6`, `#2dd4bf`, `#0d9488`)**: Nominal status indicators, calibrated sensors, success signals.
- **White (`#ffffff`)**: Primary telemetry headings and critical readouts.
- **Muted Grey (`#94a3b8`, `#64748b`)**: Labels, subtext, standby tags.

### Contract 3: Navigation Route Names
Reference routes using the typed `NAVIGATION_ROUTES` constant:

```tsx
import { NAVIGATION_ROUTES } from "@/config/navigation";

// Example:
router.push(NAVIGATION_ROUTES.TERRAIN);
```

### Contract 4: Shared Layout Interface
Wrap all feature pages inside the responsive `AppShell`:

```tsx
import { AppShell, PageHeader } from "@/components/layout";

export default function FeaturePage() {
  return (
    <AppShell title="Module Name">
      <PageHeader
        title="Module Title"
        description="Module operational description"
        breadcrumbs={[
          { label: "Mission Console", href: "/dashboard" },
          { label: "Module Title" },
        ]}
      />
      {/* Feature Content */}
    </AppShell>
  );
}
```

### Contract 5: API Client Conventions
Never use raw `fetch()` or `axios`. Always use `apiClient` which handles response enveloping, parameter serialization, and structured `ProbeApiError` throwing:

```tsx
import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";

interface TerrainElevationData {
  points: number[][];
  maxElevation: number;
}

// GET request
const response = await apiClient.get<TerrainElevationData>("/terrain/elevation-grid", {
  params: { sol: 142, resolution: "high" },
});
console.log(response.data.points);

// POST request
await apiClient.post("/simulation/trajectory", { burnDurationSeconds: 12.5 });
```

### Contract 6: Mock-Data Conventions
Define mock fixtures in your feature folder (e.g. `src/features/<module>/mock-<module>.ts`) and simulate real-world latency using `withMockDelay`:

```tsx
import { withMockDelay } from "@/lib/mock-data";

export async function getMockSensorTelemetry() {
  return withMockDelay({
    lidarHz: 60,
    spectrometerActive: true,
  }, 350);
}
```

---

## 7. GitHub Workflow & Pull Request Rules

- **Foundation Branch**: `feature/member-1-foundation`
- **Feature Branches**: `feature/member-<id>-<feature>`
- **Target Branch**: Always open PRs targeting `main`.
- **Never push directly to `main`**.
- **Do not modify files in another member's feature directory (`src/features/<other-member>/`)**.
- Ensure `npm run build` and `npm run lint` pass cleanly with zero errors before opening a PR.

---

*Crestix Probe Mission Architecture &bull; Deep Space Telemetry Division*
