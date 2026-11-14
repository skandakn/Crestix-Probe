"""SQLAlchemy ORM models for Crestix Probe."""

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _uuid_str() -> str:
    return str(uuid.uuid4())


class User(Base):
    """Registered researcher, operator, or system user."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid_str)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(64), default="researcher", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )


class TerrainModel(Base):
    """Uploaded DEM / terrain dataset metadata and file reference."""

    __tablename__ = "terrain_models"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=_uuid_str)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    content_type: Mapped[str] = mapped_column(String(128), nullable=False)
    crs: Mapped[str] = mapped_column(String(64), default="LOCAL_SANDBOX_CM", nullable=False)
    resolution_cm: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    bounds_json: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    metadata_json: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )


class RainfallScenario(Base):
    """Configured rainfall intensity profile / hyetograph scenario."""

    __tablename__ = "rainfall_scenarios"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=_uuid_str)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    intensity_mm_hr: Mapped[float] = mapped_column(Float, nullable=False)
    duration_minutes: Mapped[float] = mapped_column(Float, nullable=False)
    return_period_years: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    spatial_distribution: Mapped[str] = mapped_column(
        String(64), default="uniform", nullable=False
    )
    hyetograph_json: Mapped[Optional[list[dict[str, Any]]]] = mapped_column(
        JSON, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )


class Experiment(Base):
    """Physical or coupled sandbox flood experiment."""

    __tablename__ = "experiments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="created", nullable=False)
    terrain_id: Mapped[Optional[str]] = mapped_column(
        String(64), ForeignKey("terrain_models.id", ondelete="SET NULL"), nullable=True
    )
    rainfall_scenario_id: Mapped[Optional[str]] = mapped_column(
        String(64), ForeignKey("rainfall_scenarios.id", ondelete="SET NULL"), nullable=True
    )
    owner_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    probe_positions_json: Mapped[Optional[list[str]]] = mapped_column(
        JSON, default=lambda: ["P1", "P2", "P3", "P4"], nullable=True
    )
    calibration_config_json: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSON, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    sensor_readings: Mapped[list["SensorReading"]] = relationship(
        "SensorReading", back_populates="experiment", cascade="all, delete-orphan"
    )
    simulation_jobs: Mapped[list["SimulationJob"]] = relationship(
        "SimulationJob", back_populates="experiment", cascade="all, delete-orphan"
    )
    forecast_jobs: Mapped[list["ForecastJob"]] = relationship(
        "ForecastJob", back_populates="experiment", cascade="all, delete-orphan"
    )


class SensorReading(Base):
    """ESP32 probe sensor reading storing raw distance and calculated water depth separately."""

    __tablename__ = "sensor_readings"
    __table_args__ = (
        UniqueConstraint(
            "experiment_id",
            "position",
            "timestamp",
            name="uq_sensor_reading_exp_pos_ts",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    experiment_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("experiments.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    position: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, nullable=False
    )

    # Raw distance and calculated water depth stored separately per specification
    raw_distance_cm: Mapped[float] = mapped_column(Float, nullable=False)
    calculated_water_depth_cm: Mapped[float] = mapped_column(Float, nullable=False)
    temperature_c: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Calibration metadata and measurement quality
    mount_height_cm: Mapped[float] = mapped_column(Float, default=20.0, nullable=False)
    calibration_offset_cm: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    speed_of_sound_m_s: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    quality_flag: Mapped[str] = mapped_column(String(32), default="GOOD", nullable=False)
    quality_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    calibration_metadata_json: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSON, nullable=True
    )

    ingested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )

    experiment: Mapped["Experiment"] = relationship(
        "Experiment", back_populates="sensor_readings"
    )


class SimulationJob(Base):
    """Numerical hydrodynamic simulation job record (stubbed adapter until solver exists)."""

    __tablename__ = "simulation_jobs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=_uuid_str)
    experiment_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("experiments.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    terrain_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    rainfall_scenario_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="completed_stub", nullable=False)
    adapter_mode: Mapped[str] = mapped_column(String(32), default="stub", nullable=False)
    is_operational_solver: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    parameters_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    frames_json: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON, default=list, nullable=False
    )
    summary_json: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    experiment: Mapped["Experiment"] = relationship(
        "Experiment", back_populates="simulation_jobs"
    )


class ForecastJob(Base):
    """AI flood forecast job record (stubbed adapter until AI research model exists)."""

    __tablename__ = "forecast_jobs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=_uuid_str)
    experiment_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("experiments.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    horizon_seconds: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="completed_stub", nullable=False)
    adapter_mode: Mapped[str] = mapped_column(String(32), default="stub", nullable=False)
    is_operational_model: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    input_window_json: Mapped[dict[str, Any]] = mapped_column(
        JSON, default=dict, nullable=False
    )
    predictions_json: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON, default=list, nullable=False
    )
    metrics_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    experiment: Mapped["Experiment"] = relationship(
        "Experiment", back_populates="forecast_jobs"
    )
