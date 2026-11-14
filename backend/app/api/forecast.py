"""Core Module 7: AI forecast job management (stubbed adapter)."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.core.auth import Principal, get_current_principal
from app.core.config import Settings, get_settings
from app.core.errors import ResourceNotFoundError
from app.db.session import get_db
from app.models import Experiment, ForecastJob, SensorReading
from app.schemas import (
    ForecastJobResponse,
    ForecastMetricsResponse,
    ForecastPredictRequest,
)
from app.services.adapters import FORECAST_STUB_NOTICE, run_stub_forecast

router = APIRouter(prefix="/api/forecast", tags=["AI Flood Forecast (Stub Adapter)"])


def _to_forecast_response(job: ForecastJob) -> ForecastJobResponse:
    return ForecastJobResponse(
        id=job.id,
        experiment_id=job.experiment_id,
        horizon_seconds=job.horizon_seconds,
        status=job.status,
        adapter_mode=job.adapter_mode,
        is_operational_model=job.is_operational_model,
        engine_notice=FORECAST_STUB_NOTICE,
        input_window=job.input_window_json,
        predictions=job.predictions_json,
        created_at=job.created_at,
        completed_at=job.completed_at,
    )


@router.post(
    "/predict",
    response_model=ForecastJobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Trigger an AI flood forecast job (stubbed model adapter)",
)
def run_forecast_prediction(
    payload: ForecastPredictRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    _principal: Principal = Depends(get_current_principal),
) -> ForecastJobResponse:
    """Create and execute a stubbed AI forecast job. Explicitly reports is_operational_model=False."""
    experiment = db.get(Experiment, payload.experiment_id)
    if not experiment:
        experiment = Experiment(
            id=payload.experiment_id,
            name=f"Auto-registered Experiment {payload.experiment_id}",
            status="running",
        )
        db.add(experiment)
        db.flush()

    recent_readings = list(
        db.scalars(
            select(SensorReading)
            .where(SensorReading.experiment_id == payload.experiment_id)
            .order_by(desc(SensorReading.timestamp))
            .limit(20)
        ).all()
    )

    input_window, predictions, metrics = run_stub_forecast(payload, recent_readings)
    forecast_id = f"FC-{uuid.uuid4().hex[:8].upper()}"

    job = ForecastJob(
        id=forecast_id,
        experiment_id=payload.experiment_id,
        horizon_seconds=payload.horizon_seconds,
        status="completed_stub",
        adapter_mode=settings.forecast_adapter_mode,
        is_operational_model=False,
        input_window_json=input_window,
        predictions_json=predictions,
        metrics_json=metrics,
        completed_at=datetime.now(timezone.utc),
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return _to_forecast_response(job)


@router.get(
    "/{forecast_id}",
    response_model=ForecastJobResponse,
    summary="Get AI forecast job predictions and status",
)
def get_forecast(
    forecast_id: str,
    db: Session = Depends(get_db),
) -> ForecastJobResponse:
    job = db.get(ForecastJob, forecast_id)
    if not job:
        raise ResourceNotFoundError("ForecastJob", forecast_id)
    return _to_forecast_response(job)


@router.get(
    "/{forecast_id}/metrics",
    response_model=ForecastMetricsResponse,
    summary="Get AI forecast job evaluation metrics",
)
def get_forecast_metrics(
    forecast_id: str,
    db: Session = Depends(get_db),
) -> ForecastMetricsResponse:
    job = db.get(ForecastJob, forecast_id)
    if not job:
        raise ResourceNotFoundError("ForecastJob", forecast_id)
    return ForecastMetricsResponse(
        id=job.id,
        forecast_id=job.id,
        experiment_id=job.experiment_id,
        adapter_mode=job.adapter_mode,
        is_operational_model=job.is_operational_model,
        isMock=not job.is_operational_model,
        engine_notice=FORECAST_STUB_NOTICE,
        metrics=job.metrics_json,
    )
