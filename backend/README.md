# Crestix Probe — Backend, Database & API Engineering (Member 9)

Maintainable FastAPI backend service with PostgreSQL persistence, Alembic migrations, strict Pydantic v2 validation, ESP32 ultrasonic sensor ingestion, real-time WebSocket telemetry, validation analytics, and stubbed simulation/AI forecast orchestration adapters.

---

## Core Modules Implemented

1. **Health & Configuration (`app/api/health.py`, `app/core/config.py`)**
   - `GET /health` and `GET /api/health` verify database connectivity and report honest engine operational status.
   - `GET /api/config` returns sanitized runtime settings without exposing secrets or credentials.
2. **Authentication Integration Interface (`app/core/auth.py`)**
   - Supports Bearer token (`Authorization: Bearer ...`) and device/service API Key (`X-API-Key: ...`) authentication via `GET /api/auth/session` and protected write endpoints.
3. **User & Experiment Management (`app/api/experiments.py`)**
   - `POST /api/users`, `GET /api/users`
   - `POST /api/experiments`, `GET /api/experiments`, `GET /api/experiments/{id}`
4. **Terrain Metadata & File Upload (`app/api/terrain.py`)**
   - `POST /api/terrain/upload` (multipart DEM/grid upload with extension, size, and resolution validation)
   - `GET /api/terrain/{id}`
5. **Rainfall Scenario Management (`app/api/terrain.py`)**
   - `POST /api/rainfall/scenarios`, `GET /api/rainfall/scenarios`, `GET /api/rainfall/scenarios/{id}`
6. **Numerical Simulation Job Management (`app/api/simulation.py`, `app/services/adapters.py`)**
   - `POST /api/simulation/run`, `GET /api/simulation/{id}`, `GET /api/simulation/{id}/frames`
   - **Honest Capability Status**: Uses a stubbed adapter (`adapter_mode="stub"`, `is_operational_solver=False`) until the 2D shallow-water hydrodynamic solver is integrated.
7. **AI Forecast Job Management (`app/api/forecast.py`, `app/services/adapters.py`)**
   - `POST /api/forecast/predict`, `GET /api/forecast/{id}`, `GET /api/forecast/{id}/metrics`
   - **Honest Capability Status**: Uses a stubbed adapter (`adapter_mode="stub"`, `is_operational_model=False`) until the AI research model is integrated.
8. **ESP32 Sensor Ingestion & WebSocket Stream (`app/api/sensor.py`, `app/services/sensor_service.py`)**
   - `POST /api/sensor/readings`, `GET /api/sensor/latest`, `GET /api/sensor/history`
   - `WS /api/sensor/ws` for live real-time telemetry streaming.
   - Stores `raw_distance_cm` and `calculated_water_depth_cm` in separate columns alongside temperature-compensated speed-of-sound metadata and quality flags (`GOOD`, `CLAMPED_ZERO`, `CALIBRATION_DRIFT`).
   - Rejects duplicate readings (`409 Conflict`) and out-of-range/physically invalid measurements (`422 Unprocessable Entity`).
9. **Validation Metrics (`app/api/validation.py`, `app/services/validation_service.py`)**
   - `GET /api/validation/metrics` (RMSE, MAE, Nash-Sutcliffe Efficiency `NSE`, $R^2$, Bias, Peak Depth Error)
   - `GET /api/validation/comparisons`
10. **Experiment Reporting (`app/api/experiments.py`)**
    - `GET /api/experiments/{id}/report`

---

## Quick Start

### 1. Environment Configuration

Copy `.env.example` to `.env` and adjust values for your local PostgreSQL instance:

```bash
cd backend
cp .env.example .env
```

### 2. Install Dependencies

```bash
python -m pip install -r requirements.txt
```

### 3. Run Database Migrations (Alembic)

```bash
python -m alembic upgrade head
```

### 4. Start the FastAPI Server

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Interactive OpenAPI documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 5. Run Tests

```bash
python -m pytest -v
```
