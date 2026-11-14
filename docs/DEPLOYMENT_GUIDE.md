# Crestix Probe — Production Deployment & Operations Guide

**Owner:** Member 10 (QA, Integration & Deployment)  
**Branch:** `feature/member-10-qa-deployment`

---

## 1. Deployment Architecture Overview

Crestix Probe uses a decoupled cloud deployment topology with zero committed secrets:

```
┌─────────────────────────────────────────────────────────────────┐
│                   Users & ESP32 Flood Probe                     │
└───────────────┬─────────────────────────────────┬───────────────┘
                │ HTTPS (Browser UI)              │ HTTPS POST / WSS
                ▼                                 ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐
│     Frontend — Vercel         │ │      Backend — Render         │
│  Next.js 16 App Router        │ │  FastAPI + Uvicorn (Python)   │
│  https://crestix-probe...     ├─►  https://crestix-probe-api... │
└───────────────────────────────┘ └───────────────┬───────────────┘
                                                  │ TLS (sslmode=require)
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │   Managed PostgreSQL 16 DB    │
                                  │   (Render Postgres / Neon)    │
                                  └───────────────────────────────┘
```

---

## 2. Frontend Deployment on Vercel

### 2.1 Project Setup
1. Sign in to [Vercel](https://vercel.com) and click **Add New... → Project**.
2. Import the GitHub repository `skandakn/Crestix-Probe`.
3. Configure the build settings:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `./` (repository root)
   - **Install Command:** `npm ci`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next` (default)
   - **Node.js Version:** `22.x`

### 2.2 Frontend Environment Variables (Vercel Dashboard → Settings → Environment Variables)
Configure the following variables for **Production**, **Preview**, and **Development** environments (never commit real secrets to Git):

| Variable Name | Example Production Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | `https://crestix-probe-api.onrender.com/api` | Base URL for REST API calls to the FastAPI backend. |
| `NEXT_PUBLIC_WS_BASE_URL` | `wss://crestix-probe-api.onrender.com/api/ws` | Secure WebSocket endpoint for live ESP32 sensor streaming. |
| `NEXT_PUBLIC_APP_ENV` | `production` | Runtime environment identifier (`development`, `staging`, `production`). |

### 2.3 Reference `vercel.json` Configuration
If custom security headers or API proxy rewrites are desired, use the following reference configuration:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "installCommand": "npm ci",
  "buildCommand": "npm run build",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

---

## 3. Backend Deployment on Render

### 3.1 Service Configuration
1. Sign in to [Render](https://render.com) and click **New + → Web Service**.
2. Connect the GitHub repository `skandakn/Crestix-Probe`.
3. Set the service parameters:
   - **Name:** `crestix-probe-api`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Python Version:** `3.12.x`
   - **Build Command:** `pip install --upgrade pip && pip install -r requirements.txt`
   - **Pre-Deploy Command (Database Migrations):** `alembic upgrade head`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2`
   - **Health Check Path:** `/api/health`

### 3.2 Reference `render.yaml` Blueprint
```yaml
services:
  - type: web
    name: crestix-probe-api
    runtime: python
    rootDir: backend
    plan: starter
    buildCommand: pip install --upgrade pip && pip install -r requirements.txt
    preDeployCommand: alembic upgrade head
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /api/health
    envVars:
      - key: ENVIRONMENT
        value: production
      - key: DEBUG
        value: "false"
      - key: DATABASE_URL
        fromDatabase:
          name: crestix-probe-db
          property: connectionString
      - key: AUTH_SECRET_KEY
        generateValue: true
      - key: AUTH_API_KEY
        sync: false
      - key: CORS_ORIGINS
        value: https://crestix-probe.vercel.app
      - key: SIMULATION_ADAPTER_MODE
        value: stub
      - key: FORECAST_ADAPTER_MODE
        value: stub

databases:
  - name: crestix-probe-db
    plan: basic-256mb
    databaseName: crestix_probe
    user: crestix_user
```

---

## 4. Managed PostgreSQL Database Setup

### 4.1 Provisioning
1. Create a managed **PostgreSQL 16** instance on Render (or Neon / Supabase).
2. Copy the **Internal Database URL** (for Render-to-Render connections) or **External Database URL** (with `?sslmode=require` for cross-cloud connections).
3. Ensure the SQLAlchemy dialect prefix uses `postgresql+psycopg2://`:
   ```text
   postgresql+psycopg2://<user>:<password>@<host>:5432/crestix_probe?sslmode=require
   ```

### 4.2 Running Alembic Migrations
Migrations run automatically via `preDeployCommand: alembic upgrade head`. To execute or verify migrations manually:
```bash
cd backend
export DATABASE_URL="postgresql+psycopg2://<user>:<password>@<host>:5432/crestix_probe?sslmode=require"
alembic current
alembic upgrade head
```

---

## 5. Environment-Variable Reference

**Security Policy:** Never commit `.env` or production credentials to Git. Only placeholder values belong in `.env.example`.

| Variable | Service | Required | Default / Placeholder | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Backend | Yes | `postgresql+psycopg2://postgres:placeholder@localhost:5432/crestix_probe` | PostgreSQL connection string. |
| `AUTH_SECRET_KEY` | Backend | Yes | `replace_with_random_32_byte_hex_secret` | Signing key for researcher session tokens. |
| `AUTH_API_KEY` | Backend | Yes | `replace_with_esp32_ingest_api_key` | API key used by the ESP32 hardware node when posting `/api/sensor/readings`. |
| `AUTH_ENABLED` | Backend | No | `true` (prod) / `false` (dev) | Enforces authentication on write endpoints. |
| `CORS_ORIGINS` | Backend | Yes | `https://crestix-probe.vercel.app` | Comma-separated list of allowed frontend origins. |
| `DEFAULT_MOUNT_HEIGHT_CM` | Backend | No | `20.0` | Reference ultrasonic transducer mount height ($H_{\text{mount}}$) used to compute $d_{\text{water}} = H_{\text{mount}} - d_{\text{sensor}}$. |
| `SIMULATION_ADAPTER_MODE` | Backend | No | `stub` | Declares simulation solver status (`stub` until operational solver is integrated). |
| `FORECAST_ADAPTER_MODE` | Backend | No | `stub` | Declares AI forecast model status (`stub` until trained model is integrated). |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend | Yes | `https://crestix-probe-api.onrender.com/api` | Public REST API URL consumed by the Next.js client. |
| `NEXT_PUBLIC_WS_BASE_URL` | Frontend | No | `wss://crestix-probe-api.onrender.com/api/ws` | Public WebSocket URL for live sensor telemetry. |

---

## 6. CORS & Production URLs Configuration

1. **Strict Origin Allowlist:** Set `CORS_ORIGINS` on Render to the exact Vercel production domain (and optional preview domain):
   ```text
   CORS_ORIGINS=https://crestix-probe.vercel.app,https://crestix-probe-git-main-skandakn.vercel.app
   ```
   Do **not** use `*` wildcard origins with `allow_credentials=True` in production.
2. **HTTPS & Secure WebSockets (`wss://`):** Vercel serves the frontend over HTTPS. Browsers block mixed-content requests (`http://` or `ws://`) from HTTPS pages; always configure `NEXT_PUBLIC_API_BASE_URL` with `https://` and `NEXT_PUBLIC_WS_BASE_URL` with `wss://`.
3. **ESP32 Firmware Endpoint:** Flash the ESP32 telemetry node with the HTTPS endpoint `https://crestix-probe-api.onrender.com/api/sensor/readings` and include the `X-API-Key: <AUTH_API_KEY>` header.

---

## 7. Pre-Release & Post-Deploy Verification Checklist

- [ ] GitHub Actions CI (`frontend-qa`, `backend-qa`, `e2e-playwright`) passes on `main`.
- [ ] `npm run build` succeeds locally and on Vercel with zero TypeScript or ESLint errors.
- [ ] `GET https://crestix-probe-api.onrender.com/api/health` returns `200 OK` with `"database_connected": true`.
- [ ] `OPTIONS https://crestix-probe-api.onrender.com/api/sensor/latest` from Origin `https://crestix-probe.vercel.app` returns matching `Access-Control-Allow-Origin` header.
- [ ] Sample ESP32 sensor POST creates a record with distinct `raw_distance_cm` and `calculated_water_depth_cm`.
