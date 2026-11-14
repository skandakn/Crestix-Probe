"""Integration tests for the unified ML model backend (/api/ml/*).

Tests explicitly verify:
1. Clean `MODEL_NOT_INSTALLED` (HTTP 503) responses when submodules/weights are missing (never fake predictions).
2. Strict Pydantic request validation for both XGBoost and PINO payloads.
3. Explicitly mocked submodule + weight tests verifying one-time model loading, in-memory caching,
   prediction metadata completeness, and runtime metrics tracking.
"""

import json
import sys
from pathlib import Path

from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app
from app.services.ml_service import MLModelRegistry, get_ml_registry


def _build_test_client_with_registry(tmp_path: Path) -> tuple[TestClient, MLModelRegistry]:
    settings = Settings(
        database_url="sqlite+pysqlite:///:memory:",
        ml_xgboost_submodule_dir=str(tmp_path / "ml" / "xgboost"),
        ml_xgboost_weights_path=str(tmp_path / "weights" / "xgboost" / "model.json"),
        ml_pino_submodule_dir=str(tmp_path / "ml" / "pino"),
        ml_pino_weights_path=str(tmp_path / "weights" / "pino" / "model.pt"),
    )
    registry = MLModelRegistry(settings)
    app = create_app()
    app.dependency_overrides[get_ml_registry] = lambda: registry
    return TestClient(app), registry


def test_ml_endpoints_when_models_not_installed(tmp_path: Path) -> None:
    """Verify server starts and returns clear MODEL_NOT_INSTALLED instead of fake predictions."""
    client, _ = _build_test_client_with_registry(tmp_path)

    models_resp = client.get("/api/ml/models")
    assert models_resp.status_code == 200
    models_data = models_resp.json()
    assert len(models_data["models"]) == 2
    for m in models_data["models"]:
        assert m["installed"] is False
        assert m["status"] == "not_installed"
        assert len(m["missing_components"]) == 2

    health_resp = client.get("/api/ml/health")
    assert health_resp.status_code == 200
    health_data = health_resp.json()
    assert health_data["service_status"] == "models_not_installed"
    assert health_data["models"]["xgboost"]["installed"] is False
    assert health_data["models"]["pino"]["installed"] is False

    xgb_pred = client.post(
        "/api/ml/xgboost/predict",
        json={
            "positions": ["P1", "P2"],
            "rainfall_intensity_mm_hr": 85.0,
            "forecast_horizon_hours": 2.0,
        },
    )
    assert xgb_pred.status_code == 503
    assert xgb_pred.json()["error"]["code"] == "MODEL_NOT_INSTALLED"

    pino_pred = client.post(
        "/api/ml/pino/predict",
        json={
            "spatial_dimensions": {"rows": 2, "cols": 2, "resolution_m": 0.5},
            "dem_grid": [[1.0, 0.9], [0.8, 0.7]],
            "rainfall_rate_mm_hr": 95.0,
        },
    )
    assert pino_pred.status_code == 503
    assert pino_pred.json()["error"]["code"] == "MODEL_NOT_INSTALLED"

    metrics_resp = client.get("/api/ml/metrics")
    assert metrics_resp.status_code == 200
    metrics_data = metrics_resp.json()
    assert metrics_data["models"]["xgboost"]["failed_requests"] == 1
    assert metrics_data["models"]["pino"]["failed_requests"] == 1


def test_ml_input_validation_rejects_invalid_payloads(tmp_path: Path) -> None:
    """Verify Pydantic validation rejects negative rainfall and mismatched PINO grid shapes."""
    client, _ = _build_test_client_with_registry(tmp_path)

    bad_xgb = client.post(
        "/api/ml/xgboost/predict",
        json={
            "rainfall_intensity_mm_hr": -10.0,
            "forecast_horizon_hours": 1.0,
        },
    )
    assert bad_xgb.status_code == 422
    assert bad_xgb.json()["error"]["code"] == "VALIDATION_ERROR"

    bad_pino = client.post(
        "/api/ml/pino/predict",
        json={
            "spatial_dimensions": {"rows": 3, "cols": 3},
            "dem_grid": [[1.0, 2.0], [3.0, 4.0]],  # 2x2 does not match 3x3
            "rainfall_rate_mm_hr": 40.0,
        },
    )
    assert bad_pino.status_code == 422
    assert bad_pino.json()["error"]["code"] == "VALIDATION_ERROR"


def test_explicit_mock_xgboost_and_pino_caching_and_metadata(tmp_path: Path) -> None:
    """Explicitly mocked integration test verifying real-adapter invocation, caching, and metadata."""
    # Create mock submodule files & dummy weight files in temp directory
    xgb_dir = tmp_path / "ml" / "xgboost"
    xgb_dir.mkdir(parents=True)
    (xgb_dir / "inference.py").write_text(
        """
LOAD_CALLS = 0
def load_model(weights_path: str):
    global LOAD_CALLS
    LOAD_CALLS += 1
    return {"weights_path": weights_path, "load_seq": LOAD_CALLS}

def predict(model_handle, payload: dict):
    return {
        "predictions": [
            {
                "position": pos,
                "lead_time_minutes": payload["step_minutes"],
                "predicted_water_depth_cm": round(payload["rainfall_intensity_mm_hr"] * 0.12, 3),
                "flood_probability": 0.72,
            }
            for pos in payload["positions"]
        ]
    }
""".strip(),
        encoding="utf-8",
    )
    xgb_weights = tmp_path / "weights" / "xgboost" / "model.json"
    xgb_weights.parent.mkdir(parents=True)
    xgb_weights.write_text('{"mock_checkpoint": true}', encoding="utf-8")
    (xgb_weights.parent / "metrics.json").write_text(
        json.dumps({"rmse_cm": 0.38, "r2": 0.94}), encoding="utf-8"
    )

    pino_dir = tmp_path / "ml" / "pino"
    pino_dir.mkdir(parents=True)
    (pino_dir / "predict.py").write_text(
        """
def load_model(weights_path: str, device: str = "cpu"):
    return {"weights_path": weights_path, "device": device}

def predict(model_handle, payload: dict, device: str = "cpu"):
    rows = payload["spatial_dimensions"]["rows"]
    cols = payload["spatial_dimensions"]["cols"]
    grid = [[round(payload["rainfall_rate_mm_hr"] * 0.05, 3) for _ in range(cols)] for _ in range(rows)]
    return {
        "frames": [
            {
                "step_index": 0,
                "lead_time_minutes": payload["step_minutes"],
                "depth_grid_cm": grid,
                "max_depth_cm": grid[0][0],
                "mass_conservation_residual": 0.0014,
            }
        ]
    }
""".strip(),
        encoding="utf-8",
    )
    pino_weights = tmp_path / "weights" / "pino" / "model.pt"
    pino_weights.parent.mkdir(parents=True)
    pino_weights.write_bytes(b"MOCK_PT_WEIGHTS")

    client, registry = _build_test_client_with_registry(tmp_path)

    try:
        # 1st XGBoost call loads weights (cached_model=False)
        r1 = client.post(
            "/api/ml/xgboost/predict",
            json={
                "positions": ["P1", "P2"],
                "rainfall_intensity_mm_hr": 100.0,
                "forecast_horizon_hours": 1.0,
                "step_minutes": 15,
            },
        )
        assert r1.status_code == 200
        b1 = r1.json()
        assert b1["metadata"]["cached_model"] is False
        assert b1["metadata"]["model_name"] == "Crestix XGBoost Flood Forecaster"
        assert b1["metadata"]["units"]["depth"] == "cm"
        assert b1["metadata"]["provenance"]["weights_sha256"] is not None
        assert b1["predictions"][0]["predicted_water_depth_cm"] == 12.0

        # 2nd XGBoost call MUST reuse cached weights (cached_model=True, load_count remains 1)
        r2 = client.post(
            "/api/ml/xgboost/predict",
            json={
                "positions": ["P1", "P2"],
                "rainfall_intensity_mm_hr": 50.0,
                "forecast_horizon_hours": 1.0,
                "step_minutes": 15,
            },
        )
        assert r2.status_code == 200
        assert r2.json()["metadata"]["cached_model"] is True
        assert registry.xgboost.load_count == 1

        # PINO call using mocked submodule runner
        p1 = client.post(
            "/api/ml/pino/predict",
            json={
                "spatial_dimensions": {"rows": 2, "cols": 2, "resolution_m": 0.5},
                "dem_grid": [[2.0, 1.5], [1.2, 0.8]],
                "rainfall_rate_mm_hr": 80.0,
                "forecast_horizon_hours": 2.0,
                "step_minutes": 30,
            },
        )
        assert p1.status_code == 200
        pb1 = p1.json()
        assert pb1["metadata"]["cached_model"] is False
        assert pb1["metadata"]["spatial_dimensions"] == {
            "rows": 2,
            "cols": 2,
            "resolution_m": 0.5,
            "crs": "LOCAL_SANDBOX_CM",
        }
        assert pb1["frames"][0]["depth_grid_cm"] == [[4.0, 4.0], [4.0, 4.0]]

        p2 = client.post(
            "/api/ml/pino/predict",
            json={
                "spatial_dimensions": {"rows": 2, "cols": 2, "resolution_m": 0.5},
                "dem_grid": [[2.0, 1.5], [1.2, 0.8]],
                "rainfall_rate_mm_hr": 60.0,
                "forecast_horizon_hours": 2.0,
                "step_minutes": 30,
            },
        )
        assert p2.status_code == 200
        assert p2.json()["metadata"]["cached_model"] is True
        assert registry.pino.load_count == 1

        metrics = client.get("/api/ml/metrics").json()
        assert metrics["models"]["xgboost"]["load_count"] == 1
        assert metrics["models"]["xgboost"]["cache_hits"] == 1
        assert metrics["models"]["xgboost"]["successful_requests"] == 2
        assert metrics["models"]["xgboost"]["training_metrics"]["rmse_cm"] == 0.38
        assert metrics["models"]["pino"]["load_count"] == 1
        assert metrics["models"]["pino"]["cache_hits"] == 1
        assert metrics["models"]["pino"]["successful_requests"] == 2
    finally:
        for mod_name in ("inference", "predict"):
            sys.modules.pop(mod_name, None)
        for p in (str(xgb_dir.resolve()), str(pino_dir.resolve())):
            if p in sys.path:
                sys.path.remove(p)
