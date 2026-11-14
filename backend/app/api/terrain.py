"""Core Module 4 & 5: Terrain metadata/file upload and Rainfall scenario management."""

import json
import os
import re
import uuid
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import Principal, get_current_principal
from app.core.config import Settings, get_settings
from app.core.errors import InvalidPayloadError, ResourceNotFoundError
from app.db.session import get_db
from app.models import RainfallScenario, TerrainModel
from app.schemas import (
    RainfallScenarioCreate,
    RainfallScenarioResponse,
    TerrainResponse,
)

router = APIRouter(prefix="/api", tags=["Terrain & Rainfall"])

ALLOWED_EXTENSIONS = {".tif", ".tiff", ".asc", ".dem", ".csv", ".json", ".xyz", ".txt"}


def _to_terrain_response(terrain: TerrainModel) -> TerrainResponse:
    return TerrainResponse(
        id=terrain.id,
        name=terrain.name,
        description=terrain.description,
        file_name=terrain.file_name,
        file_size_bytes=terrain.file_size_bytes,
        content_type=terrain.content_type,
        crs=terrain.crs,
        resolution_cm=terrain.resolution_cm,
        bounds=terrain.bounds_json,
        metadata=terrain.metadata_json,
        created_at=terrain.created_at,
    )


@router.post(
    "/terrain/upload",
    response_model=TerrainResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload terrain DEM/grid file and metadata",
)
async def upload_terrain(
    file: UploadFile = File(...),
    name: str = Form(default="Sandbox Terrain Model"),
    description: Optional[str] = Form(default=None),
    crs: str = Form(default="LOCAL_SANDBOX_CM"),
    resolution_cm: float = Form(default=1.0),
    bounds_json: Optional[str] = Form(default=None),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    _principal: Principal = Depends(get_current_principal),
) -> TerrainResponse:
    """Validate and store an uploaded terrain file along with spatial metadata."""
    if resolution_cm <= 0:
        raise InvalidPayloadError("Terrain resolution_cm must be greater than 0.")

    raw_filename = file.filename or "terrain.dem"
    ext = Path(raw_filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise InvalidPayloadError(
            f"Unsupported terrain file extension '{ext}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}",
            details={"filename": raw_filename, "allowed_extensions": sorted(ALLOWED_EXTENSIONS)},
        )

    content = await file.read()
    size_bytes = len(content)
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if size_bytes == 0:
        raise InvalidPayloadError("Uploaded terrain file is empty.")
    if size_bytes > max_bytes:
        raise InvalidPayloadError(
            f"Uploaded file exceeds maximum size of {settings.max_upload_size_mb} MB."
        )

    parsed_bounds: Optional[dict[str, Any]] = None
    if bounds_json:
        try:
            parsed_bounds = json.loads(bounds_json)
        except json.JSONDecodeError as exc:
            raise InvalidPayloadError("Invalid JSON in bounds_json field.") from exc

    terrain_id = f"TER-{uuid.uuid4().hex[:8].upper()}"
    safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", Path(raw_filename).name)
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    stored_path = upload_dir / f"{terrain_id}_{safe_name}"
    stored_path.write_bytes(content)

    terrain = TerrainModel(
        id=terrain_id,
        name=name,
        description=description,
        file_name=safe_name,
        file_path=str(stored_path),
        file_size_bytes=size_bytes,
        content_type=file.content_type or "application/octet-stream",
        crs=crs,
        resolution_cm=resolution_cm,
        bounds_json=parsed_bounds or {"width_cm": 200.0, "length_cm": 100.0},
        metadata_json={"extension": ext, "original_filename": raw_filename},
    )
    db.add(terrain)
    db.commit()
    db.refresh(terrain)
    return _to_terrain_response(terrain)


@router.get(
    "/terrain/{terrain_id}",
    response_model=TerrainResponse,
    summary="Get terrain metadata by ID",
)
def get_terrain(
    terrain_id: str,
    db: Session = Depends(get_db),
) -> TerrainResponse:
    terrain = db.get(TerrainModel, terrain_id)
    if not terrain:
        raise ResourceNotFoundError("Terrain", terrain_id)
    return _to_terrain_response(terrain)


@router.post(
    "/rainfall/scenarios",
    response_model=RainfallScenarioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a rainfall scenario (Module 5)",
)
def create_rainfall_scenario(
    payload: RainfallScenarioCreate,
    db: Session = Depends(get_db),
    _principal: Principal = Depends(get_current_principal),
) -> RainfallScenarioResponse:
    scenario_id = f"RAIN-{uuid.uuid4().hex[:8].upper()}"
    hyeto = (
        [pt.model_dump() for pt in payload.hyetograph]
        if payload.hyetograph
        else [
            {"time_minutes": 0.0, "intensity_mm_hr": payload.intensity_mm_hr},
            {
                "time_minutes": payload.duration_minutes,
                "intensity_mm_hr": payload.intensity_mm_hr,
            },
        ]
    )
    scenario = RainfallScenario(
        id=scenario_id,
        name=payload.name,
        description=payload.description,
        intensity_mm_hr=payload.intensity_mm_hr,
        duration_minutes=payload.duration_minutes,
        return_period_years=payload.return_period_years,
        spatial_distribution=payload.spatial_distribution,
        hyetograph_json=hyeto,
    )
    db.add(scenario)
    db.commit()
    db.refresh(scenario)
    return RainfallScenarioResponse(
        id=scenario.id,
        name=scenario.name,
        description=scenario.description,
        intensity_mm_hr=scenario.intensity_mm_hr,
        duration_minutes=scenario.duration_minutes,
        return_period_years=scenario.return_period_years,
        spatial_distribution=scenario.spatial_distribution,
        hyetograph=scenario.hyetograph_json,
        created_at=scenario.created_at,
    )


@router.get(
    "/rainfall/scenarios",
    response_model=list[RainfallScenarioResponse],
    summary="List rainfall scenarios",
)
def list_rainfall_scenarios(
    db: Session = Depends(get_db),
) -> list[RainfallScenarioResponse]:
    rows = db.scalars(
        select(RainfallScenario).order_by(RainfallScenario.created_at.desc())
    ).all()
    return [
        RainfallScenarioResponse(
            id=s.id,
            name=s.name,
            description=s.description,
            intensity_mm_hr=s.intensity_mm_hr,
            duration_minutes=s.duration_minutes,
            return_period_years=s.return_period_years,
            spatial_distribution=s.spatial_distribution,
            hyetograph=s.hyetograph_json,
            created_at=s.created_at,
        )
        for s in rows
    ]


@router.get(
    "/rainfall/scenarios/{scenario_id}",
    response_model=RainfallScenarioResponse,
    summary="Get rainfall scenario by ID",
)
def get_rainfall_scenario(
    scenario_id: str,
    db: Session = Depends(get_db),
) -> RainfallScenarioResponse:
    s = db.get(RainfallScenario, scenario_id)
    if not s:
        raise ResourceNotFoundError("RainfallScenario", scenario_id)
    return RainfallScenarioResponse(
        id=s.id,
        name=s.name,
        description=s.description,
        intensity_mm_hr=s.intensity_mm_hr,
        duration_minutes=s.duration_minutes,
        return_period_years=s.return_period_years,
        spatial_distribution=s.spatial_distribution,
        hyetograph=s.hyetograph_json,
        created_at=s.created_at,
    )
