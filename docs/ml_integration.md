# Crestix Probe — ML Backend Integration Guide (XGBoost & PINO)

## 1. Architecture Overview

The unified ML backend (`backend/app/api/ml.py`) exposes both **XGBoost** (point/station tabular forecasting) and **PINO** (Physics-Informed Neural Operator 2D spatio-temporal flood field forecasting) behind a consistent FastAPI + Pydantic v2 interface:

```text
Crestix-Probe/
├── ml/
│   ├── xgboost/               # Submodule: https://github.com/skandakn/XGBoost-Crestix-Probe.git
│   └── pino/                  # Submodule: https://github.com/skandakn/PINO-Crestix-Probe.git
├── backend/
│   ├── app/
│   │   ├── api/ml.py          # Unified FastAPI ML endpoints (/api/ml/*)
│   │   ├── schemas/ml.py      # Pydantic v2 request, response, metadata, health & metrics schemas
│   │   ├── services/
│   │   │   ├── ml_adapters.py # Submodule discovery, checkpoint loading, real inference invocation
│   │   │   └── ml_service.py  # Thread-safe singleton model cache & runtime metrics registry
│   │   └── main.py
│   └── tests/test_ml_api.py   # Validation, missing-weight 503 & mocked-cache integration tests
└── docs/ml_integration.md
```

### Core Integration Guarantees

- **No Fake Predictions in Production:** If either submodule has not been initialized or its checkpoint weights have not been downloaded, prediction endpoints return `HTTP 503` with `error.code = "MODEL_NOT_INSTALLED"` and installation instructions — never random numbers or hardcoded heatmaps.
- **One-Time Model Loading & Caching:** `MLModelRegistry` loads and caches model artifacts inside each adapter under a thread lock (`cached_model: true` on subsequent calls), avoiding per-request checkpoint I/O.
- **No Checkpoints in Git:** Weight directories (`weights/`, `*.pt`, `*.pth`, `*.onnx`, `*.ubj`, `*.safetensors`) are excluded via `.gitignore`.

---

## 2. Git Submodule Setup & Pinning

> **Current Upstream Repository Status Notice:**  
> At the time of this integration PR, `https://github.com/skandakn/XGBoost-Crestix-Probe.git` and `https://github.com/skandakn/PINO-Crestix-Probe.git` exist on GitHub with **0 commits (`size: 0`)**. Because Git cannot create a `.gitmodules` gitlink entry pointing to a repository with no commits, `git submodule add` returns `fatal: You appear to have cloned an empty repository` until the XGBoost and PINO model teams push their initial commits.

Once both model repositories contain at least one commit on `main`, attach and pin tested commits using:

```bash
git submodule add https://github.com/skandakn/XGBoost-Crestix-Probe.git ml/xgboost
git submodule add https://github.com/skandakn/PINO-Crestix-Probe.git ml/pino
git commit -m "chore(ml): pin tested XGBoost and PINO submodule commits"
```

### Initializing & Updating Submodules (For Contributors & CI)

```bash
# After cloning Crestix-Probe:
git submodule update --init --recursive

# To pull newer tested commits from upstream model repos:
git submodule update --remote --merge ml/xgboost ml/pino
```

---

## 3. Installing Model Weights (Without Committing Checkpoints)

Place downloaded checkpoints in `backend/weights/` (or override paths via environment variables):

```bash
mkdir -p backend/weights/xgboost backend/weights/pino

# Download/copy trained artifacts (excluded from Git):
# - backend/weights/xgboost/model.json
# - backend/weights/pino/model.pt
```

### Submodule Adapter Entrypoint Contract

Each model submodule should expose one of `inference.py`, `src/inference.py`, `predict.py`, or `model.py` with:
- `load_model(weights_path: str, ...)`
- `predict(model_handle, payload: dict, ...)`

For XGBoost, if no custom wrapper exists, the adapter automatically falls back to `xgboost.Booster().load_model(weights_path)` when the `xgboost` package is installed.

---

## 4. Environment Configuration (No Secrets)

Configure paths in `backend/.env` (see `backend/.env.example`):

```env
ML_MODELS_BASE_DIR="../ml"
ML_WEIGHTS_BASE_DIR="./weights"
ML_XGBOOST_SUBMODULE_DIR="../ml/xgboost"
ML_XGBOOST_WEIGHTS_PATH="./weights/xgboost/model.json"
ML_XGBOOST_VERSION="1.0.0"
ML_PINO_SUBMODULE_DIR="../ml/pino"
ML_PINO_WEIGHTS_PATH="./weights/pino/model.pt"
ML_PINO_VERSION="1.0.0"
ML_PINO_DEVICE="cpu"
ML_ALLOW_CPU_FALLBACK=true
```

---

## 5. Unified API Endpoints & Schemas

### Endpoints

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ml/xgboost/predict` | Run cached XGBoost point-station water depth forecast |
| `POST` | `/api/ml/pino/predict` | Run cached PINO 2D spatio-temporal flood field forecast |
| `GET` | `/api/ml/models` | List model metadata, units, schemas, and installation status |
| `GET` | `/api/ml/health` | Check submodule code, weight files, and in-memory cache status |
| `GET` | `/api/ml/metrics` | Return runtime inference counts, cache hits, latency, and training metrics |

### Prediction Metadata Returned on Every Forecast

Every `POST /api/ml/*/predict` response includes a `metadata` object containing:
- `model_name` & `model_version`
- `forecast_horizon_hours` & `step_minutes`
- `spatial_dimensions` (`rows`, `cols`, `resolution_m`, `crs`)
- `units` (`depth`, `rainfall_intensity`, `velocity`, `time_step`)
- `inference_duration_ms`
- `provenance` (`repository_url`, `submodule_path`, `pinned_commit`, `dataset`, `checkpoint_path`, `weights_sha256`)
- `cached_model` (`true` when weights were served from memory cache)

### Example Model-Not-Installed Response (`HTTP 503`)

```json
{
  "error": {
    "code": "MODEL_NOT_INSTALLED",
    "message": "Crestix PINO-SWE Spatial Forecaster is not installed on this server...",
    "details": {
      "model_id": "pino",
      "repository_url": "https://github.com/skandakn/PINO-Crestix-Probe.git",
      "submodule_path": "../ml/pino",
      "expected_weights_path": "./weights/pino/model.pt",
      "missing_components": [
        "submodule_code (../ml/pino)",
        "checkpoint_weights (./weights/pino/model.pt)"
      ]
    }
  }
}
```
