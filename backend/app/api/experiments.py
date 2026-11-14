"""Core Module 3 & 10: User management, Experiment management, and Experiment reporting."""

import math
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.auth import Principal, get_current_principal
from app.core.errors import DuplicateResourceError, ResourceNotFoundError
from app.db.session import get_db
from app.models import (
    Experiment,
    ForecastJob,
    RainfallScenario,
    SensorReading,
    SimulationJob,
    TerrainModel,
    User,
)
from app.schemas import (
    ExperimentCreate,
    ExperimentResponse,
    PaginatedResponse,
    UserCreate,
    UserResponse,
)

router = APIRouter(prefix="/api", tags=["Users & Experiments"])


def _to_experiment_response(exp: Experiment) -> ExperimentResponse:
    return ExperimentResponse(
        id=exp.id,
        name=exp.name,
        description=exp.description,
        status=exp.status,
        terrain_id=exp.terrain_id,
        rainfall_scenario_id=exp.rainfall_scenario_id,
        owner_id=exp.owner_id,
        probe_positions=exp.probe_positions_json or ["P1", "P2", "P3", "P4"],
        calibration_config=exp.calibration_config_json,
        created_at=exp.created_at,
        updated_at=exp.updated_at,
    )


@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a user",
)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _principal: Principal = Depends(get_current_principal),
) -> User:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise DuplicateResourceError(
            resource="User",
            message=f"User with email '{payload.email}' already exists.",
            details={"email": payload.email},
        )
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/users", response_model=list[UserResponse], summary="List users")
def list_users(db: Session = Depends(get_db)) -> list[User]:
    return list(db.scalars(select(User).order_by(User.created_at.desc())).all())


@router.post(
    "/experiments",
    response_model=ExperimentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an experiment",
)
def create_experiment(
    payload: ExperimentCreate,
    db: Session = Depends(get_db),
    _principal: Principal = Depends(get_current_principal),
) -> ExperimentResponse:
    exp_id = payload.id or f"EXP-{uuid.uuid4().hex[:8].upper()}"
    existing = db.get(Experiment, exp_id)
    if existing:
        raise DuplicateResourceError(
            resource="Experiment",
            message=f"Experiment '{exp_id}' already exists.",
            details={"experiment_id": exp_id},
        )

    exp = Experiment(
        id=exp_id,
        name=payload.name,
        description=payload.description,
        status=payload.status,
        terrain_id=payload.terrain_id,
        rainfall_scenario_id=payload.rainfall_scenario_id,
        owner_id=payload.owner_id,
        probe_positions_json=payload.probe_positions,
        calibration_config_json=payload.calibration_config,
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return _to_experiment_response(exp)


@router.get(
    "/experiments",
    response_model=PaginatedResponse[ExperimentResponse],
    summary="List experiments with pagination",
)
def list_experiments(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=200),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
) -> PaginatedResponse[ExperimentResponse]:
    stmt = select(Experiment)
    count_stmt = select(func.count()).select_from(Experiment)
    if status_filter:
        stmt = stmt.where(Experiment.status == status_filter)
        count_stmt = count_stmt.where(Experiment.status == status_filter)

    total = db.scalar(count_stmt) or 0
    rows = db.scalars(
        stmt.order_by(Experiment.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    return PaginatedResponse[ExperimentResponse](
        items=[_to_experiment_response(e) for e in rows],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/experiments/{experiment_id}",
    response_model=ExperimentResponse,
    summary="Get experiment details",
)
def get_experiment(
    experiment_id: str,
    db: Session = Depends(get_db),
) -> ExperimentResponse:
    exp = db.get(Experiment, experiment_id)
    if not exp:
        raise ResourceNotFoundError("Experiment", experiment_id)
    return _to_experiment_response(exp)


@router.get(
    "/experiments/{experiment_id}/report",
    summary="Generate comprehensive experiment report (Module 10)",
)
def get_experiment_report(
    experiment_id: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Aggregate sensor statistics, terrain, rainfall, and job summaries for an experiment."""
    exp = db.get(Experiment, experiment_id)
    if not exp:
        raise ResourceNotFoundError("Experiment", experiment_id)

    readings = list(
        db.scalars(
            select(SensorReading)
            .where(SensorReading.experiment_id == experiment_id)
            .order_by(SensorReading.timestamp.asc())
        ).all()
    )
    sims = list(
        db.scalars(
            select(SimulationJob)
            .where(SimulationJob.experiment_id == experiment_id)
            .order_by(SimulationJob.created_at.desc())
        ).all()
    )
    forecasts = list(
        db.scalars(
            select(ForecastJob)
            .where(ForecastJob.experiment_id == experiment_id)
            .order_by(ForecastJob.created_at.desc())
        ).all()
    )

    depths = [r.calculated_water_depth_cm for r in readings]
    distances = [r.raw_distance_cm for r in readings]
    by_position: dict[str, dict[str, Any]] = {}
    for r in readings:
        pos_stat = by_position.setdefault(
            r.position,
            {"count": 0, "max_depth_cm": 0.0, "min_depth_cm": r.calculated_water_depth_cm},
        )
        pos_stat["count"] += 1
        pos_stat["max_depth_cm"] = max(pos_stat["max_depth_cm"], r.calculated_water_depth_cm)
        pos_stat["min_depth_cm"] = min(pos_stat["min_depth_cm"], r.calculated_water_depth_cm)

    terrain = db.get(TerrainModel, exp.terrain_id) if exp.terrain_id else None
    rainfall = (
        db.get(RainfallScenario, exp.rainfall_scenario_id)
        if exp.rainfall_scenario_id
        else None
    )

    return {
        "report_generated_at": datetime.now(timezone.utc).isoformat(),
        "experiment": _to_experiment_response(exp).model_dump(mode="json"),
        "terrain": (
            {"id": terrain.id, "name": terrain.name, "resolution_cm": terrain.resolution_cm}
            if terrain
            else None
        ),
        "rainfall_scenario": (
            {
                "id": rainfall.id,
                "name": rainfall.name,
                "intensity_mm_hr": rainfall.intensity_mm_hr,
                "duration_minutes": rainfall.duration_minutes,
            }
            if rainfall
            else None
        ),
        "sensor_summary": {
            "total_readings": len(readings),
            "peak_water_depth_cm": max(depths) if depths else 0.0,
            "mean_water_depth_cm": round(sum(depths) / len(depths), 4) if depths else 0.0,
            "min_raw_distance_cm": min(distances) if distances else None,
            "positions": by_position,
        },
        "simulation_jobs_count": len(sims),
        "forecast_jobs_count": len(forecasts),
        "engine_disclaimer": (
            "Simulation and AI forecast jobs in this report are generated by stubbed "
            "adapters until the research engines are integrated."
        ),
    }
