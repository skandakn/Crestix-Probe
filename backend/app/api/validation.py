"""Core Module 9: Validation metrics and comparisons."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import ForecastJob, SensorReading, SimulationJob
from app.schemas import ValidationComparisonsResponse, ValidationMetricsResponse
from app.services.validation_service import (
    compute_validation_comparisons,
    compute_validation_metrics,
)

router = APIRouter(prefix="/api/validation", tags=["Validation Metrics & Analytics"])


def _load_experiment_validation_data(
    db: Session,
    experiment_id: Optional[str],
) -> tuple[str, list[SensorReading], Optional[SimulationJob], Optional[ForecastJob]]:
    target_exp_id = experiment_id
    if not target_exp_id:
        latest_reading = db.scalar(
            select(SensorReading).order_by(desc(SensorReading.timestamp)).limit(1)
        )
        target_exp_id = latest_reading.experiment_id if latest_reading else "EXP001"

    readings = list(
        db.scalars(
            select(SensorReading)
            .where(SensorReading.experiment_id == target_exp_id)
            .order_by(SensorReading.timestamp.asc())
            .limit(200)
        ).all()
    )
    latest_sim = db.scalar(
        select(SimulationJob)
        .where(SimulationJob.experiment_id == target_exp_id)
        .order_by(desc(SimulationJob.created_at))
        .limit(1)
    )
    latest_forecast = db.scalar(
        select(ForecastJob)
        .where(ForecastJob.experiment_id == target_exp_id)
        .order_by(desc(ForecastJob.created_at))
        .limit(1)
    )
    return target_exp_id, readings, latest_sim, latest_forecast


@router.get(
    "/metrics",
    response_model=ValidationMetricsResponse,
    summary="Compute validation metrics (RMSE, MAE, NSE, R², Bias)",
)
def get_validation_metrics(
    experiment_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
) -> ValidationMetricsResponse:
    exp_id, readings, latest_sim, latest_forecast = _load_experiment_validation_data(
        db, experiment_id
    )
    comp = compute_validation_comparisons(exp_id, readings, latest_sim, latest_forecast)
    return compute_validation_metrics(exp_id, comp.comparisons)


@router.get(
    "/comparisons",
    response_model=ValidationComparisonsResponse,
    summary="Get time-aligned observed vs simulated vs forecast comparisons",
)
def get_validation_comparisons(
    experiment_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
) -> ValidationComparisonsResponse:
    exp_id, readings, latest_sim, latest_forecast = _load_experiment_validation_data(
        db, experiment_id
    )
    return compute_validation_comparisons(exp_id, readings, latest_sim, latest_forecast)
