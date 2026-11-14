"""Core Module 6: Numerical simulation job management (stubbed adapter)."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.auth import Principal, get_current_principal
from app.core.config import Settings, get_settings
from app.core.errors import ResourceNotFoundError
from app.db.session import get_db
from app.models import Experiment, SimulationJob
from app.schemas import (
    SimulationFramesResponse,
    SimulationJobResponse,
    SimulationRunRequest,
)
from app.services.adapters import SIMULATION_STUB_NOTICE, run_stub_simulation

router = APIRouter(prefix="/api/simulation", tags=["Numerical Simulation (Stub Adapter)"])


def _to_sim_response(job: SimulationJob) -> SimulationJobResponse:
    fc = len(job.frames_json or [])
    return SimulationJobResponse(
        id=job.id,
        simulationId=job.id,
        experiment_id=job.experiment_id,
        terrain_id=job.terrain_id,
        rainfall_scenario_id=job.rainfall_scenario_id,
        status=job.status,
        adapter_mode=job.adapter_mode,
        is_operational_solver=job.is_operational_solver,
        isMock=not job.is_operational_solver,
        engine_notice=SIMULATION_STUB_NOTICE,
        parameters=job.parameters_json,
        summary=job.summary_json,
        frame_count=fc,
        totalSteps=fc,
        created_at=job.created_at,
        createdAt=job.created_at,
        completed_at=job.completed_at,
        completedAt=job.completed_at,
    )


@router.post(
    "/run",
    response_model=SimulationJobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Trigger a numerical simulation job (stubbed solver adapter)",
)
def run_simulation(
    payload: SimulationRunRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    _principal: Principal = Depends(get_current_principal),
) -> SimulationJobResponse:
    """Create and execute a stubbed simulation job. Explicitly reports is_operational_solver=False."""
    experiment = db.get(Experiment, payload.experiment_id)
    if not experiment:
        experiment = Experiment(
            id=payload.experiment_id,
            name=f"Auto-registered Experiment {payload.experiment_id}",
            status="running",
        )
        db.add(experiment)
        db.flush()

    frames, summary = run_stub_simulation(payload)
    sim_id = f"SIM-{uuid.uuid4().hex[:8].upper()}"

    job = SimulationJob(
        id=sim_id,
        experiment_id=payload.experiment_id,
        terrain_id=payload.terrain_id or experiment.terrain_id,
        rainfall_scenario_id=payload.rainfall_scenario_id or experiment.rainfall_scenario_id,
        status="completed_stub",
        adapter_mode=settings.simulation_adapter_mode,
        is_operational_solver=False,
        parameters_json=payload.model_dump(),
        frames_json=frames,
        summary_json=summary,
        completed_at=datetime.now(timezone.utc),
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return _to_sim_response(job)


@router.get(
    "/{simulation_id}",
    response_model=SimulationJobResponse,
    summary="Get numerical simulation job status and metadata",
)
def get_simulation(
    simulation_id: str,
    db: Session = Depends(get_db),
) -> SimulationJobResponse:
    job = db.get(SimulationJob, simulation_id)
    if not job:
        raise ResourceNotFoundError("SimulationJob", simulation_id)
    return _to_sim_response(job)


@router.get(
    "/{simulation_id}/frames",
    response_model=SimulationFramesResponse,
    summary="Get numerical simulation time-step frames",
)
def get_simulation_frames(
    simulation_id: str,
    db: Session = Depends(get_db),
) -> SimulationFramesResponse:
    job = db.get(SimulationJob, simulation_id)
    if not job:
        raise ResourceNotFoundError("SimulationJob", simulation_id)
    frames = job.frames_json or []
    return SimulationFramesResponse(
        simulation_id=job.id,
        simulationId=job.id,
        experiment_id=job.experiment_id,
        adapter_mode=job.adapter_mode,
        is_operational_solver=job.is_operational_solver,
        isMock=not job.is_operational_solver,
        engine_notice=SIMULATION_STUB_NOTICE,
        total_frames=len(frames),
        totalFrames=len(frames),
        frames=frames,
    )
