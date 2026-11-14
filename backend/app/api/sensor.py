"""Core Module 8: ESP32 sensor ingestion, latest telemetry, paginated history, and WebSocket stream."""

import math
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy import desc, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.auth import Principal, get_current_principal
from app.core.config import Settings, get_settings
from app.core.errors import DuplicateResourceError
from app.db.session import get_db
from app.models import Experiment, SensorReading
from app.schemas import (
    CalibrationMetadata,
    PaginatedResponse,
    SensorReadingCreate,
    SensorReadingResponse,
)
from app.services.sensor_service import evaluate_sensor_reading
from app.services.websocket_manager import ws_manager

router = APIRouter(prefix="/api/sensor", tags=["ESP32 Sensor Telemetry"])


def _to_sensor_response(reading: SensorReading) -> SensorReadingResponse:
    cal_dict = reading.calibration_metadata_json or {
        "mount_height_cm": reading.mount_height_cm,
        "calibration_offset_cm": reading.calibration_offset_cm,
        "speed_of_sound_m_s": reading.speed_of_sound_m_s,
    }
    cal_meta = CalibrationMetadata(**cal_dict)
    return SensorReadingResponse(
        id=reading.id,
        readingId=f"rd-{reading.id}",
        experiment_id=reading.experiment_id,
        experimentId=reading.experiment_id,
        position=reading.position,
        timestamp=reading.timestamp,
        distance_cm=reading.raw_distance_cm,
        water_depth_cm=reading.calculated_water_depth_cm,
        raw_distance_cm=reading.raw_distance_cm,
        calculated_water_depth_cm=reading.calculated_water_depth_cm,
        measuredDistanceCm=reading.raw_distance_cm,
        referenceHeightCm=cal_meta.mount_height_cm,
        calculatedWaterDepthCm=reading.calculated_water_depth_cm,
        temperature_c=reading.temperature_c,
        ambientTemperatureC=reading.temperature_c,
        quality_flag=reading.quality_flag,
        quality_score=reading.quality_score,
        calibration_metadata=cal_meta,
        ingested_at=reading.ingested_at,
    )


@router.post(
    "/readings",
    response_model=SensorReadingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest a validated ESP32 sensor reading",
)
async def ingest_sensor_reading(
    payload: SensorReadingCreate,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    _principal: Principal = Depends(get_current_principal),
) -> SensorReadingResponse:
    """Validate and persist a sensor reading, storing raw distance and calculated depth separately."""
    # Ensure parent experiment exists (auto-register if needed for streamlined ESP32 onboarding)
    experiment = db.get(Experiment, payload.experiment_id)
    if not experiment:
        experiment = Experiment(
            id=payload.experiment_id,
            name=f"Auto-registered Experiment {payload.experiment_id}",
            status="running",
            probe_positions_json=["P1", "P2", "P3", "P4"],
            calibration_config_json={
                "mount_height_cm": settings.default_mount_height_cm,
                "offset_cm": 0.0,
            },
        )
        db.add(experiment)
        db.flush()

    # Check for duplicate reading (same experiment_id, position, timestamp)
    duplicate = db.scalar(
        select(SensorReading).where(
            SensorReading.experiment_id == payload.experiment_id,
            SensorReading.position == payload.position,
            SensorReading.timestamp == payload.timestamp,
        )
    )
    if duplicate:
        raise DuplicateResourceError(
            resource="SensorReading",
            message=(
                f"Duplicate sensor reading for experiment '{payload.experiment_id}', "
                f"position '{payload.position}' at '{payload.timestamp.isoformat()}'."
            ),
            details={
                "experiment_id": payload.experiment_id,
                "position": payload.position,
                "timestamp": payload.timestamp.isoformat(),
                "existing_id": duplicate.id,
            },
        )

    raw_dist, calc_depth, q_flag, q_score, cal_meta = evaluate_sensor_reading(
        payload=payload,
        settings=settings,
        experiment_calibration=experiment.calibration_config_json,
    )

    reading = SensorReading(
        experiment_id=payload.experiment_id,
        position=payload.position,
        timestamp=payload.timestamp,
        raw_distance_cm=raw_dist,
        calculated_water_depth_cm=calc_depth,
        temperature_c=payload.temperature_c,
        mount_height_cm=cal_meta.mount_height_cm,
        calibration_offset_cm=cal_meta.calibration_offset_cm,
        speed_of_sound_m_s=cal_meta.speed_of_sound_m_s,
        quality_flag=q_flag,
        quality_score=q_score,
        calibration_metadata_json=cal_meta.model_dump(),
    )

    db.add(reading)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise DuplicateResourceError(
            resource="SensorReading",
            message="Duplicate sensor reading detected by database constraint.",
            details={
                "experiment_id": payload.experiment_id,
                "position": payload.position,
                "timestamp": payload.timestamp.isoformat(),
            },
        ) from exc

    db.refresh(reading)
    response_obj = _to_sensor_response(reading)

    # Broadcast real-time reading over WebSocket to connected dashboards
    await ws_manager.broadcast(
        {
            "event": "sensor.reading",
            "data": response_obj.model_dump(mode="json"),
        }
    )

    return response_obj


@router.get(
    "/latest",
    response_model=list[SensorReadingResponse],
    summary="Get latest sensor reading per probe position",
)
def get_latest_sensor_readings(
    experiment_id: Optional[str] = Query(default=None),
    position: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
) -> list[SensorReadingResponse]:
    """Return the most recent reading for each probe position."""
    stmt = select(SensorReading)
    if experiment_id:
        stmt = stmt.where(SensorReading.experiment_id == experiment_id)
    if position:
        stmt = stmt.where(SensorReading.position == position)

    stmt = stmt.order_by(desc(SensorReading.timestamp), desc(SensorReading.id))
    all_rows = db.scalars(stmt.limit(500)).all()

    latest_by_key: dict[tuple[str, str], SensorReading] = {}
    for row in all_rows:
        key = (row.experiment_id, row.position)
        if key not in latest_by_key:
            latest_by_key[key] = row

    return [_to_sensor_response(r) for r in latest_by_key.values()]


@router.get(
    "/history",
    response_model=PaginatedResponse[SensorReadingResponse],
    summary="Get paginated historical sensor readings",
)
def get_sensor_history(
    experiment_id: Optional[str] = Query(default=None),
    position: Optional[str] = Query(default=None),
    start_time: Optional[datetime] = Query(default=None),
    end_time: Optional[datetime] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> PaginatedResponse[SensorReadingResponse]:
    """Retrieve paginated historical sensor data with optional experiment, position, and time filters."""
    stmt = select(SensorReading)
    count_stmt = select(func.count()).select_from(SensorReading)

    if experiment_id:
        stmt = stmt.where(SensorReading.experiment_id == experiment_id)
        count_stmt = count_stmt.where(SensorReading.experiment_id == experiment_id)
    if position:
        stmt = stmt.where(SensorReading.position == position)
        count_stmt = count_stmt.where(SensorReading.position == position)
    if start_time:
        stmt = stmt.where(SensorReading.timestamp >= start_time)
        count_stmt = count_stmt.where(SensorReading.timestamp >= start_time)
    if end_time:
        stmt = stmt.where(SensorReading.timestamp <= end_time)
        count_stmt = count_stmt.where(SensorReading.timestamp <= end_time)

    total = db.scalar(count_stmt) or 0
    rows = db.scalars(
        stmt.order_by(SensorReading.timestamp.desc(), SensorReading.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    total_pages = math.ceil(total / page_size) if total > 0 else 0
    return PaginatedResponse[SensorReadingResponse](
        items=[_to_sensor_response(r) for r in rows],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.websocket("/ws")
async def sensor_telemetry_websocket(websocket: WebSocket) -> None:
    """Real-time WebSocket stream for live ESP32 sensor readings."""
    await ws_manager.connect(websocket)
    try:
        await websocket.send_json(
            {
                "event": "connection.established",
                "channel": "sensor_telemetry",
                "active_connections": ws_manager.active_count,
            }
        )
        while True:
            msg = await websocket.receive_text()
            if msg.strip().lower() == "ping":
                await websocket.send_json({"event": "pong"})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)
