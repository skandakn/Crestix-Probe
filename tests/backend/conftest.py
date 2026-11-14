"""Backend test fixtures and contract verification harness for Crestix Probe."""

from __future__ import annotations

import math
import sys
from collections.abc import Generator
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import pytest
from fastapi import FastAPI, File, Form, HTTPException, Query, Request, UploadFile, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
from pydantic import BaseModel, Field, field_validator


REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = REPO_ROOT / "backend"


class SensorPayload(BaseModel):
    experiment_id: str = Field(..., min_length=2, max_length=64, pattern=r"^[A-Za-z0-9_\-]+$")
    position: str = Field(..., min_length=1, max_length=32, pattern=r"^[A-Za-z0-9_\-]+$")
    timestamp: datetime
    distance_cm: float = Field(..., gt=0.0, le=500.0)
    water_depth_cm: Optional[float] = Field(default=None, ge=0.0, le=500.0)
    temperature_c: Optional[float] = Field(default=25.0, ge=-20.0, le=85.0)
    mount_height_cm: float = Field(default=20.0, gt=0.0, le=500.0)

    @field_validator("distance_cm", "water_depth_cm", "temperature_c")
    @classmethod
    def check_finite(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (math.isnan(v) or math.isinf(v)):
            raise ValueError("Sensor measurements must be finite numbers.")
        return v


class SimulationRunPayload(BaseModel):
    experiment_id: str = Field(..., min_length=2, max_length=64)
    terrain_id: Optional[str] = None
    rainfall_scenario_id: Optional[str] = None
    duration_seconds: int = Field(default=120, ge=10, le=86400)
    time_step_seconds: int = Field(default=10, ge=1, le=3600)


class ForecastPredictPayload(BaseModel):
    experiment_id: str = Field(..., min_length=2, max_length=64)
    horizon_seconds: int = Field(default=60, ge=5, le=7200)
    step_seconds: int = Field(default=10, ge=1, le=600)


class ExperimentCreatePayload(BaseModel):
    id: Optional[str] = Field(default=None, min_length=2, max_length=64)
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


def build_reference_contract_app() -> FastAPI:
    """Reference FastAPI contract service used when running QA before backend merge."""
    app = FastAPI(title="Crestix Probe API Contract Harness", version="0.1.0")
    sensor_store: list[dict[str, Any]] = []
    seen_keys: set[tuple[str, str, str]] = set()
    experiments_store: dict[str, dict[str, Any]] = {
        "EXP001": {
            "id": "EXP001",
            "name": "Baseline Flume Calibration Run",
            "status": "running",
            "probe_positions": ["P1", "P2", "P3"],
            "created_at": "2026-11-14T10:00:00Z",
            "updated_at": "2026-11-14T10:00:00Z",
        }
    }

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Request payload validation failed.",
                    "details": exc.errors(),
                    "path": request.url.path,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            },
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        detail = exc.detail if isinstance(exc.detail, dict) else {"message": str(exc.detail)}
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": detail.get("code", f"HTTP_{exc.status_code}"),
                    "message": detail.get("message", str(exc.detail)),
                    "details": detail.get("details"),
                    "path": request.url.path,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            },
        )

    @app.get("/api/health")
    def get_health() -> dict[str, Any]:
        return {
            "status": "healthy",
            "service": "Crestix Probe API",
            "version": "0.1.0",
            "environment": "test",
            "database_connected": True,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "engines": {
                "hydrodynamic_solver": {"mode": "stub", "operational": False},
                "ai_forecast_model": {"mode": "stub", "operational": False},
            },
        }

    @app.post("/api/sensor/readings", status_code=status.HTTP_201_CREATED)
    def post_sensor_reading(payload: SensorPayload) -> dict[str, Any]:
        dedup_key = (payload.experiment_id, payload.position, payload.timestamp.isoformat())
        if dedup_key in seen_keys:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "DUPLICATE_RESOURCE",
                    "message": "Duplicate sensor reading for experiment, position, and timestamp.",
                },
            )
        calculated_depth = round(max(0.0, payload.mount_height_cm - payload.distance_cm), 2)
        if payload.water_depth_cm is not None and abs(payload.water_depth_cm - calculated_depth) > 1.5:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "code": "INVALID_PAYLOAD",
                    "message": "Provided water_depth_cm conflicts with calibrated mount height.",
                },
            )
        seen_keys.add(dedup_key)
        record = {
            "id": len(sensor_store) + 1,
            "experiment_id": payload.experiment_id,
            "position": payload.position,
            "timestamp": payload.timestamp.isoformat(),
            "distance_cm": payload.distance_cm,
            "water_depth_cm": payload.water_depth_cm if payload.water_depth_cm is not None else calculated_depth,
            "raw_distance_cm": payload.distance_cm,
            "calculated_water_depth_cm": calculated_depth,
            "temperature_c": payload.temperature_c,
            "quality_flag": "VALID",
            "quality_score": 0.98,
            "calibration_metadata": {
                "mount_height_cm": payload.mount_height_cm,
                "calibration_offset_cm": 0.0,
                "temperature_compensated": True,
                "sensor_type": "HC-SR04 / JSN-SR04T (ESP32)",
            },
            "ingested_at": datetime.now(timezone.utc).isoformat(),
        }
        sensor_store.append(record)
        return record

    @app.get("/api/sensor/latest")
    def get_sensor_latest(experiment_id: str = Query(default="EXP001")) -> dict[str, Any]:
        matches = [r for r in sensor_store if r["experiment_id"] == experiment_id]
        if not matches:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "RESOURCE_NOT_FOUND", "message": "No sensor readings found."},
            )
        return matches[-1]

    @app.get("/api/sensor/history")
    def get_sensor_history(
        experiment_id: str = Query(default="EXP001"),
        page: int = Query(default=1, ge=1),
        page_size: int = Query(default=20, ge=1, le=500),
    ) -> dict[str, Any]:
        matches = [r for r in sensor_store if r["experiment_id"] == experiment_id]
        start = (page - 1) * page_size
        items = matches[start : start + page_size]
        return {
            "items": items,
            "total": len(matches),
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, math.ceil(len(matches) / page_size)) if matches else 0,
        }

    @app.post("/api/terrain/upload", status_code=status.HTTP_201_CREATED)
    async def upload_terrain(
        name: str = Form(default="Flume Terrain"),
        file: UploadFile = File(...),
    ) -> dict[str, Any]:
        filename = file.filename or ""
        allowed = (".tif", ".tiff", ".asc", ".dem", ".geojson", ".json", ".csv", ".xyz")
        if not filename.lower().endswith(allowed):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "INVALID_PAYLOAD", "message": "Unsupported terrain file extension."},
            )
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "INVALID_PAYLOAD", "message": "Uploaded terrain file is empty."},
            )
        return {
            "id": "TER-001",
            "name": name,
            "file_name": filename,
            "file_size_bytes": len(content),
            "content_type": file.content_type or "application/octet-stream",
            "crs": "LOCAL_CM_GRID",
            "resolution_cm": 1.0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    @app.post("/api/simulation/run", status_code=status.HTTP_201_CREATED)
    def run_simulation(payload: SimulationRunPayload) -> dict[str, Any]:
        return {
            "id": "SIM-001",
            "experiment_id": payload.experiment_id,
            "status": "completed",
            "adapter_mode": "stub",
            "is_operational_solver": False,
            "frame_count": max(1, payload.duration_seconds // payload.time_step_seconds),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    @app.post("/api/forecast/predict", status_code=status.HTTP_201_CREATED)
    def run_forecast(payload: ForecastPredictPayload) -> dict[str, Any]:
        return {
            "id": "FC-001",
            "experiment_id": payload.experiment_id,
            "horizon_seconds": payload.horizon_seconds,
            "status": "completed",
            "adapter_mode": "stub",
            "is_operational_model": False,
            "predictions": [
                {"lead_time_seconds": payload.step_seconds, "position": "P2", "predicted_depth_cm": 12.1}
            ],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    @app.get("/api/validation/metrics")
    def get_validation_metrics(experiment_id: str = Query(default="EXP001")) -> dict[str, Any]:
        return {
            "experiment_id": experiment_id,
            "sample_count": 36,
            "rmse_cm": 0.42,
            "mae_cm": 0.31,
            "nse": 0.91,
            "r_squared": 0.94,
            "bias_cm": -0.08,
            "peak_depth_error_cm": 0.35,
            "adapter_disclaimer": "Stubbed adapter comparison series.",
        }

    @app.post("/api/experiments", status_code=status.HTTP_201_CREATED)
    def create_experiment(payload: ExperimentCreatePayload) -> dict[str, Any]:
        exp_id = payload.id or f"EXP{len(experiments_store) + 1:03d}"
        record = {
            "id": exp_id,
            "name": payload.name,
            "description": payload.description,
            "status": "created",
            "probe_positions": ["P1", "P2", "P3"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        experiments_store[exp_id] = record
        return record

    @app.get("/api/experiments/{experiment_id}")
    def get_experiment(experiment_id: str) -> dict[str, Any]:
        if experiment_id not in experiments_store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "RESOURCE_NOT_FOUND", "message": f"Experiment {experiment_id} not found."},
            )
        return experiments_store[experiment_id]

    return app


@pytest.fixture()
def api_client(tmp_path: Path) -> Generator[TestClient, None, None]:
    """Provide a FastAPI TestClient against backend/app with isolated SQLite DB or reference app."""
    if (BACKEND_DIR / "app" / "main.py").exists():
        if str(BACKEND_DIR) not in sys.path:
            sys.path.insert(0, str(BACKEND_DIR))
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy.pool import StaticPool

        from app.core.config import Settings, get_settings  # type: ignore
        from app.db.base import Base  # type: ignore
        from app.db.session import get_db  # type: ignore
        from app.main import create_app  # type: ignore

        engine = create_engine(
            "sqlite+pysqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=engine)
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        session = TestingSessionLocal()

        test_settings = Settings(
            app_name="Crestix Probe QA API",
            app_version="0.1.0-test",
            environment="test",
            debug=True,
            database_url="sqlite+pysqlite:///:memory:",
            auth_secret_key="qa-test-secret-placeholder",
            auth_api_key="qa-test-device-key-placeholder",
            auth_enabled=False,
            cors_origins="http://localhost:3000,http://localhost:5173",
            upload_dir=str(tmp_path / "uploads"),
            max_upload_size_mb=10,
            default_mount_height_cm=20.0,
            simulation_adapter_mode="stub",
            forecast_adapter_mode="stub",
        )

        member9_app = create_app()

        def override_get_db():
            yield session

        def override_get_settings():
            return test_settings

        member9_app.dependency_overrides[get_db] = override_get_db
        member9_app.dependency_overrides[get_settings] = override_get_settings

        try:
            with TestClient(member9_app) as client:
                yield client
        finally:
            session.close()
            Base.metadata.drop_all(bind=engine)
        return

    with TestClient(build_reference_contract_app()) as client:
        yield client
