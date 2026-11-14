# Crestix Probe — Member 3: Authentication & User Workspace

## Overview
This module implements the end-to-end authentication and user workspace experience for the Crestix Probe mission telemetry platform. Built with the Crestix Probe dark scientific design language, it provides cryptographic security enclaves, multi-level clearance roles, token-based session persistence, and zero-rewrite provider abstraction.

## Features Delivered
- **Login Experience** (`/login`):
  - Operator telemetry address (email) & security key phrase authentication.
  - Password visibility toggle with full keyboard and ARIA accessibility.
  - "Remember session" persistence toggle.
  - One-click rapid test account autofill buttons for evaluation.
  - Telemetry scanner loading states and clear error alert banners.
- **Registration & Provisioning** (`/register`):
  - Operator registration with custom tactical callsign, mission division, and security clearance level selection (Levels 1–4, Directorate).
  - Real-time password strength entropy meter (4-stage visual telemetry bar + character criteria checklist).
  - Password match verification and Mission Operation Protocol acknowledgment.
- **Forgot Password Dispatch** (`/forgot-password`):
  - Recovery signal request form with rate-limiting countdown timer and retransmission support.
- **Protected User Workspace** (`/dashboard`):
  - Guarded route with radar clearance verification scan during session hydration.
  - Automatic redirect to `/login?redirect=...` preserving return target.
  - Tactical dashboard telemetry pods (planetary target coordinates, security enclave state, data repository metrics, subsystem health matrix).
- **User Profile Menu** (`<UserProfileMenu />`):
  - Top HUD navigation widget with clearance level badge and active session countdown.
  - Interactive operator dossier drawer for updating callsign and organization.
  - Secure session termination (logout) clearing persisted credentials.
- **Authentication Provider Abstraction**:
  - `AuthAdapter` interface decoupling presentation layer from concrete auth services.
  - Isolated `MockAuthAdapter` for local development and demonstration with development advisory banners.
  - Production-ready `ApiAuthAdapter` conforming to Member 9's backend authentication service endpoints.
  - Zero UI code rewrites required to switch via `NEXT_PUBLIC_AUTH_ADAPTER=backend`.

## Architecture & Provider Abstraction
```
src/features/auth/
├── adapters/
│   ├── mock-auth-adapter.ts     # Isolated dev mock with seed accounts & storage
│   ├── api-auth-adapter.ts      # REST client for Member 9 backend
│   └── index.ts                 # Adapter factory (getAuthAdapter / setActiveAdapter)
├── components/
│   ├── AuthLayout.tsx           # Dark scientific frame with telemetry status
│   ├── LoginForm.tsx            # Login form with validation & quick-fill
│   ├── RegisterForm.tsx         # Provisioning form with strength meter
│   ├── ForgotPasswordForm.tsx   # Recovery signal transponder form
│   ├── PasswordInput.tsx        # Accessible toggleable password field
│   ├── UserProfileMenu.tsx      # Operator HUD dossier menu & logout
│   ├── ProtectedRoute.tsx       # Route guard with radar scan & clearance check
│   └── TerrainBackground.tsx    # SVG topographical contour & radar mesh
├── context/
│   └── AuthContext.tsx          # Session state provider & tab synchronization
├── hooks/
│   ├── useAuth.ts               # Hook accessing auth state & actions
│   └── useRequireAuth.ts        # Hook for guarded routes
├── utils/
│   └── validation.ts            # RFC email regex, entropy meter, form validators
├── types.ts                     # TypeScript domain contracts
└── index.ts                     # Public API barrel export
```

## Seed Accounts (Mock Adapter)
| Email | Password | Callsign | Role | Clearance |
|---|---|---|---|---|
| `probe.lead@crestix.space` | `Crestix#2026` | `PROBE-LEAD` | Lead Investigator | Level 4 Restricted |
| `surveyor.analyst@crestix.space` | `Crestix#2026` | `SURVEYOR-9` | Payload Specialist | Level 3 Operations |

*Note: Any newly registered user credentials during local development are also persisted in local storage.*

## Backend Integration (Member 9 Contract)
To switch from Mock Adapter to Member 9's backend API, set:
```env
NEXT_PUBLIC_AUTH_ADAPTER=backend
NEXT_PUBLIC_AUTH_API_URL=https://api.crestix.space/api/v1/auth
```
Endpoints supported:
- `POST /login` -> `{ email, password, rememberMe }`
- `POST /register` -> `{ name, email, password, callsign, clearanceLevel, organization }`
- `POST /forgot-password` -> `{ email }`
- `POST /reset-password` -> `{ token, newPassword }`
- `GET /me` -> returns authenticated operator user record
- `POST /refresh` -> refreshes session token
- `POST /logout` -> terminates backend session
- `PATCH /profile` -> updates operator callsign/organization

## Testing & Quality Assurance
- 32 automated unit and integration tests passing via Vitest:
  - Form validation rules & password entropy scoring (`validation.test.ts`)
  - Mock authentication lifecycle, registration, duplicate checks, session persistence, profile edits (`mock-auth-adapter.test.ts`)
  - API adapter contract, header forwarding, error handling, adapter factory switching (`api-auth-adapter.test.ts`)
  - Password visibility toggle accessibility, empty submission alerts, demo prefill, and protected route radar states (`components.test.tsx`)
- Zero ESLint errors or React Compiler warnings.
- Next.js 16 production build compiles with partial prefetching and static optimization.
