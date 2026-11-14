# Crestix Probe — ML Backend Integration Guide (XGBoost & PINO)

## 1. Architecture Overview

The unified ML backend (`backend/app/api/ml.py`) exposes both **XGBoost** (point/station tabular forecasting) and **PINO** (Physics-Informed Neural Operator 2D spatio-temporal flood field forecasting) behind a consistent FastAPI + Pydantic v2 interface:

```text
Crestix-Probe/
├── ml/
│   ├── xgboost/               # Submodule: https://github.com/skandakn/XGBoost-Crestix-Probe.git
│   ├── pino/                  # Submodule: https://github.com/skandakn/PINO-Crestix-Probe.git
│   ├── linear-regression/     # Submodule: https://github.com/skandakn/Linear-Regression---Crestix-Probe.git
│   └── random-forest/         # Submodule: https://github.com/skandakn/Random-Forest---Crestix-Probe.git
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

## 2. Git Submodule Setup & Pinned Commits

All four model and evaluation repositories are attached and pinned on `main`:

| Submodule Path | Upstream Repository | Pinned Commit (`main`) | Key Capabilities Included |
| :--- | :--- | :--- | :--- |
| `ml/xgboost` | `https://github.com/skandakn/XGBoost-Crestix-Probe.git` | `cbc47a6bc156135571182efa98703805f6857abe` | `src/crestix_xgb/` training/inference, Person 9 common contract & integration tests |
| `ml/pino` | `https://github.com/skandakn/PINO-Crestix-Probe.git` | `79c20675316f393eb196089f0e8340b9f250ca98` | `src/crestix_pino/` model/loader/predictor, LarNO data pipeline, `physics_validation/` & diagnostics (`6de65e1`), checkpoint CLI |
| `ml/linear-regression` | `https://github.com/skandakn/Linear-Regression---Crestix-Probe.git` | `bf28ee548d81a739171f3b1511dc330a9e24743e` | Shared evaluation framework (`evaluation_metrics.py`, `evaluate_model.py`, `plotting_utils.py`), LR pipeline & Person 9 contract |
| `ml/random-forest` | `https://github.com/skandakn/Random-Forest---Crestix-Probe.git` | `0e904e72de88766ac78a2b4b06a251ed58ce59c9` | Random Forest pipeline, committed `artifacts/random_forest_model.joblib`, Person 9 contract & integration tests |

### Initializing & Updating Submodules (For Contributors & CI)

```bash
# After cloning Crestix-Probe (or when cloning fresh):
git clone --recurse-submodules https://github.com/skandakn/Crestix-Probe.git

# Inside an existing clone:
git submodule sync --recursive
git submodule update --init --recursive

# To update submodules to latest remote tracked commits (`main`):
git submodule update --remote --merge
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
