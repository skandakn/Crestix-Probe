# Crestix Probe Backend — API Documentation & Frontend Integration Contracts

This document specifies the HTTP and WebSocket API contracts owned by **Member 9 (Backend, Database & API Engineering)** and shared with **Members 4–8** (Frontend, 3D Terrain Visualization, Hydrodynamic Simulation, AI Flood Forecasting, and Analytics/Validation).

Interactive OpenAPI schemas are also automatically served by FastAPI at:
- Swagger UI: `/docs`
- ReDoc: `/redoc`
- Raw OpenAPI 3.1 JSON: `/openapi.json`

---

## 1. Honest Capability Notice (Simulation & AI Forecast Adapters)

In accordance with project governance:
- **Numerical Hydrodynamic Solver (`POST /api/simulation/run`)**: Currently backed by a deterministic **stub adapter** (`adapter_mode: "stub"`, `is_operational_solver: false`).
- **AI Flood Forecast Model (`POST /api/forecast/predict`)**: Currently backed by a deterministic **stub adapter** (`adapter_mode: "stub"`, `is_operational_model: false`).
- Both endpoints return clear `engine_notice` strings so the UI can display a stub/preview badge until the research engines from Members 5–7 are linked.

---

## 2. Structured Error Format

All validation (`422`), conflict (`409`), not-found (`404`), and authentication (`401`) errors return a consistent JSON envelope:

```json
{
  "error": {
    "code": "DUPLICATE_RESOURCE",
    "message": "Duplicate sensor reading for experiment 'EXP001', position 'P2' at '2026-11-14T10:30:05+00:00'.",
    "details": {
      "experiment_id": "EXP001",
      "position": "P2",
      "timestamp": "2026-11-14T10:30:05+00:00",
      "existing_id": 1
    },
    "path": "/api/sensor/readings",
    "timestamp": "2026-11-14T10:30:06.120000+00:00"
  }
}
```

---

## 3. Endpoint Reference

### Health, Configuration & Authentication
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` or `/api/health` | Service health check, DB status, and engine operational flags |
| `GET` | `/api/config` | Non-secret runtime configuration (CORS origins, calibration defaults, engine modes) |
| `GET` | `/api/auth/session` | Inspect caller authentication principal (`Bearer` token or `X-API-Key` header) |

### Users & Experiments
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/users` | Register a researcher or operator |
| `GET` | `/api/users` | List registered users |
| `POST` | `/api/experiments` | Create a new sandbox flood experiment (`EXP001`, etc.) |
| `GET` | `/api/experiments` | Paginated list of experiments (`?page=1&page_size=20&status=running`) |
| `GET` | `/api/experiments/{id}` | Retrieve experiment metadata and calibration configuration |
| `GET` | `/api/experiments/{id}/report` | Generate comprehensive experiment report (sensor stats, terrain, rainfall, jobs) |

### ESP32 Sensor Telemetry & WebSocket
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/sensor/readings` | Ingest a validated ESP32 ultrasonic & temperature reading |
| `GET` | `/api/sensor/latest` | Latest reading per probe position (`?experiment_id=EXP001`) |
| `GET` | `/api/sensor/history` | Paginated historical readings (`?experiment_id=EXP001&position=P2&page=1&page_size=50`) |
| `WS` | `/api/sensor/ws` | Live WebSocket stream broadcasting `sensor.reading` events |

#### Example `POST /api/sensor/readings` Request
```json
{
  "experiment_id": "EXP001",
  "position": "P2",
  "timestamp": "2026-11-14T10:30:05",
  "distance_cm": 8.2,
  "water_depth_cm": 11.8,
  "temperature_c": 29.0
}
```

#### Example `201 Created` Response
Raw ultrasonic distance (`raw_distance_cm`) and derived water depth (`calculated_water_depth_cm`) are persisted and returned separately alongside calibration metadata and quality scoring:
```json
{
  "id": 1,
  "experiment_id": "EXP001",
  "position": "P2",
  "timestamp": "2026-11-14T10:30:05Z",
  "distance_cm": 8.2,
  "water_depth_cm": 11.8,
  "raw_distance_cm": 8.2,
  "calculated_water_depth_cm": 11.8,
  "temperature_c": 29.0,
  "quality_flag": "GOOD",
  "quality_score": 1.0,
  "calibration_metadata": {
    "mount_height_cm": 20.0,
    "calibration_offset_cm": 0.0,
    "speed_of_sound_m_s": 348.87,
    "temperature_compensated": true,
    "depth_discrepancy_cm": 0.0,
    "sensor_type": "HC-SR04 / JSN-SR04T (ESP32)"
  },
  "ingested_at": "2026-11-14T10:30:05.512000Z"
}
```

### Terrain Metadata & Rainfall Scenarios
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/terrain/upload` | Multipart file upload (`file`, `name`, `crs`, `resolution_cm`, `bounds_json`) |
| `GET` | `/api/terrain/{id}` | Retrieve terrain metadata |
| `POST` | `/api/rainfall/scenarios` | Create a rainfall intensity / hyetograph scenario |
| `GET` | `/api/rainfall/scenarios` | List rainfall scenarios |
| `GET` | `/api/rainfall/scenarios/{id}` | Get rainfall scenario details |

### Numerical Simulation Jobs (Stubbed Adapter)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/simulation/run` | Trigger a stubbed numerical simulation job |
| `GET` | `/api/simulation/{id}` | Retrieve simulation job status and summary |
| `GET` | `/api/simulation/{id}/frames` | Retrieve simulation time-step depth grids and probe depth series |

### AI Forecast Jobs (Stubbed Adapter)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/forecast/predict` | Trigger a stubbed AI flood forecast job |
| `GET` | `/api/forecast/{id}` | Retrieve forecast predictions and confidence bounds |
| `GET` | `/api/forecast/{id}/metrics` | Retrieve forecast evaluation metrics |

### Validation Metrics & Comparisons
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/validation/metrics` | Compute RMSE, MAE, NSE, $R^2$, Bias, and Peak Depth Error (`?experiment_id=EXP001`) |
| `GET` | `/api/validation/comparisons` | Time-aligned observed vs. simulated vs. forecast depth comparisons |
