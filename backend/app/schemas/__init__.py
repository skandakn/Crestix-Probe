"""Pydantic v2 request and response schemas for Crestix Probe API."""

import math
from datetime import datetime, timezone
from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic pagination envelope for historical and list endpoints."""

    items: list[T]
    total: int = Field(..., ge=0)
    page: int = Field(..., ge=1)
    page_size: int = Field(..., ge=1, le=500)
    total_pages: int = Field(..., ge=0)


# ---------------------------------------------------------------------------
# 1. Health & Configuration
# ---------------------------------------------------------------------------


class EngineCapabilityStatus(BaseModel):
    mode: str
    operational: bool = False
    note: str


class HealthResponse(BaseModel):
    status: str = "healthy"
    service: str
    version: str
    environment: str
    database_connected: bool
    timestamp: datetime
    engines: dict[str, EngineCapabilityStatus]


# ---------------------------------------------------------------------------
# 2 & 3. Users & Experiments
# ---------------------------------------------------------------------------


class UserCreate(BaseModel):
    email: str = Field(..., min_length=5, max_length=255, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    full_name: str = Field(..., min_length=1, max_length=255)
    role: str = Field(default="researcher", min_length=2, max_length=64)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime


class ExperimentCreate(BaseModel):
    id: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=64,
        pattern=r"^[A-Za-z0-9_\-]+$",
        description="Optional custom experiment identifier such as EXP001",
    )
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    status: str = Field(default="created", pattern=r"^(created|running|completed|archived)$")
    terrain_id: Optional[str] = None
    rainfall_scenario_id: Optional[str] = None
    owner_id: Optional[str] = None
    probe_positions: list[str] = Field(default_factory=lambda: ["P1", "P2", "P3", "P4"])
    calibration_config: Optional[dict[str, Any]] = Field(
        default_factory=lambda: {"mount_height_cm": 20.0, "offset_cm": 0.0}
    )


class ExperimentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str] = None
    status: str
    terrain_id: Optional[str] = None
    rainfall_scenario_id: Optional[str] = None
    owner_id: Optional[str] = None
    probe_positions: list[str] = Field(default_factory=list)
    calibration_config: Optional[dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# 4. Terrain Metadata & Upload
# ---------------------------------------------------------------------------


class TerrainResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str] = None
    file_name: str
    file_size_bytes: int
    content_type: str
    crs: str
    resolution_cm: float
    bounds: Optional[dict[str, Any]] = None
    metadata: Optional[dict[str, Any]] = None
    created_at: datetime


# ---------------------------------------------------------------------------
# 5. Rainfall Scenario Management
# ---------------------------------------------------------------------------


class HyetographPoint(BaseModel):
    time_minutes: float = Field(..., ge=0.0)
    intensity_mm_hr: float = Field(..., ge=0.0, le=2000.0)


class RainfallScenarioCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=2000)
    intensity_mm_hr: float = Field(..., gt=0.0, le=2000.0)
    duration_minutes: float = Field(..., gt=0.0, le=10080.0)
    return_period_years: Optional[int] = Field(default=None, ge=1, le=10000)
    spatial_distribution: str = Field(default="uniform", min_length=2, max_length=64)
    hyetograph: Optional[list[HyetographPoint]] = None


class RainfallScenarioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str] = None
    intensity_mm_hr: float
    duration_minutes: float
    return_period_years: Optional[int] = None
    spatial_distribution: str
    hyetograph: Optional[list[dict[str, Any]]] = None
    created_at: datetime


# ---------------------------------------------------------------------------
# 8. ESP32 Sensor Ingestion
# ---------------------------------------------------------------------------


class CalibrationMetadata(BaseModel):
    mount_height_cm: float = Field(default=20.0, gt=0.0, le=500.0)
    calibration_offset_cm: float = Field(default=0.0, ge=-50.0, le=50.0)
    speed_of_sound_m_s: Optional[float] = None
    temperature_compensated: bool = True
    depth_discrepancy_cm: Optional[float] = None
    sensor_type: str = "HC-SR04 / JSN-SR04T (ESP32)"


class SensorReadingCreate(BaseModel):
    """Validated ESP32 sensor reading payload (supports both snake_case and Member 7 camelCase)."""

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    experiment_id: str = Field(
        default="EXP001",
        validation_alias="experiment_id",
        min_length=2,
        max_length=64,
        pattern=r"^[A-Za-z0-9_\-]+$",
        examples=["EXP001"],
    )
    position: str = Field(
        default="P1",
        min_length=1,
        max_length=32,
        pattern=r"^[A-Za-z0-9_\-]+$",
        examples=["P2"],
    )
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        examples=["2026-11-14T10:30:05"],
    )
    distance_cm: float = Field(..., gt=0.0, le=500.0, examples=[8.2])
    water_depth_cm: Optional[float] = Field(default=None, ge=0.0, le=500.0, examples=[11.8])
    temperature_c: Optional[float] = Field(default=25.0, ge=-20.0, le=85.0, examples=[29.0])
    mount_height_cm: Optional[float] = Field(default=None, gt=0.0, le=500.0)
    calibration_offset_cm: float = Field(default=0.0, ge=-50.0, le=50.0)

    @model_validator(mode="before")
    @classmethod
    def normalize_camel_case_sensor_fields(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        normalized = dict(data)
        if "experimentId" in normalized and "experiment_id" not in normalized:
            normalized["experiment_id"] = normalized["experimentId"]
        if "measuredDistanceCm" in normalized and "distance_cm" not in normalized:
            normalized["distance_cm"] = normalized["measuredDistanceCm"]
        if "referenceHeightCm" in normalized and "mount_height_cm" not in normalized:
            normalized["mount_height_cm"] = normalized["referenceHeightCm"]
        if "ambientTemperatureC" in normalized and "temperature_c" not in normalized:
            normalized["temperature_c"] = normalized["ambientTemperatureC"]
        if "calculatedWaterDepthCm" in normalized and "water_depth_cm" not in normalized:
            normalized["water_depth_cm"] = normalized["calculatedWaterDepthCm"]
        return normalized

    @field_validator("distance_cm", "water_depth_cm", "temperature_c")
    @classmethod
    def reject_nan_or_inf(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (math.isnan(v) or math.isinf(v)):
            raise ValueError("Numeric sensor values must be finite numbers.")
        return v

    @field_validator("timestamp")
    @classmethod
    def ensure_timezone_aware(cls, v: datetime) -> datetime:
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v


class SensorReadingResponse(BaseModel):
    """Sensor reading response exposing raw distance, calculated depth, calibration, and quality."""

    id: int
    readingId: str
    experiment_id: str
    experimentId: str
    position: str
    timestamp: datetime
    # Alias fields matching input contract + explicit separated fields + Member 7 camelCase fields
    distance_cm: float
    water_depth_cm: float
    raw_distance_cm: float
    calculated_water_depth_cm: float
    measuredDistanceCm: float
    referenceHeightCm: float
    calculatedWaterDepthCm: float
    temperature_c: Optional[float] = None
    ambientTemperatureC: Optional[float] = None
    quality_flag: str
    quality_score: float
    calibration_metadata: CalibrationMetadata
    ingested_at: datetime


# ---------------------------------------------------------------------------
# 6. Numerical Simulation Job Management (Stubbed Adapter)
# ---------------------------------------------------------------------------


class SimulationRunRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    experiment_id: str = Field(default="EXP001", min_length=2, max_length=64)
    terrain_id: Optional[str] = None
    rainfall_scenario_id: Optional[str] = None
    duration_seconds: int = Field(default=120, ge=10, le=86400)
    time_step_seconds: int = Field(default=10, ge=1, le=3600)
    grid_nx: int = Field(default=16, ge=4, le=256)
    grid_ny: int = Field(default=16, ge=4, le=256)
    manning_n: float = Field(default=0.035, gt=0.0, le=1.0)
    inflow_rate_l_min: float = Field(default=5.0, ge=0.0, le=1000.0)

    @model_validator(mode="before")
    @classmethod
    def normalize_member5_fields(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        normalized = dict(data)
        if "terrainId" in normalized and "terrain_id" not in normalized:
            normalized["terrain_id"] = normalized["terrainId"]
        if "timeStepSeconds" in normalized and "time_step_seconds" not in normalized:
            normalized["time_step_seconds"] = normalized["timeStepSeconds"]
        if "totalDurationMinutes" in normalized and "duration_seconds" not in normalized:
            normalized["duration_seconds"] = int(normalized["totalDurationMinutes"]) * 60
        if "surfaceRoughnessManning" in normalized and "manning_n" not in normalized:
            normalized["manning_n"] = normalized["surfaceRoughnessManning"]
        if "gridDimensions" in normalized and isinstance(normalized["gridDimensions"], dict):
            gd = normalized["gridDimensions"]
            normalized.setdefault("grid_nx", gd.get("cols", 16))
            normalized.setdefault("grid_ny", gd.get("rows", 16))
        return normalized


class SimulationJobResponse(BaseModel):
    id: str
    simulationId: str
    experiment_id: str
    terrain_id: Optional[str] = None
    rainfall_scenario_id: Optional[str] = None
    status: str
    adapter_mode: str
    is_operational_solver: bool = False
    isMock: bool = True
    engine_notice: str = (
        "STUBBED ADAPTER: Numerical hydrodynamic solver is not yet operational. "
        "Synthetic preview frames are provided for frontend and pipeline integration."
    )
    parameters: dict[str, Any]
    summary: Optional[dict[str, Any]] = None
    frame_count: int
    totalSteps: int
    created_at: datetime
    createdAt: datetime
    completed_at: Optional[datetime] = None
    completedAt: Optional[datetime] = None


class SimulationFramesResponse(BaseModel):
    simulation_id: str
    simulationId: str
    experiment_id: str
    adapter_mode: str
    is_operational_solver: bool = False
    isMock: bool = True
    engine_notice: str
    total_frames: int
    totalFrames: int
    frames: list[dict[str, Any]]


# ---------------------------------------------------------------------------
# 7. AI Forecast Job Management (Stubbed Adapter)
# ---------------------------------------------------------------------------


class ForecastPredictRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    experiment_id: str = Field(default="EXP001", min_length=2, max_length=64)
    model_id: str = Field(default="pino-swe")
    scenario_id: Optional[str] = None
    horizon_seconds: int = Field(default=60, ge=5, le=172800)
    step_seconds: int = Field(default=10, ge=1, le=3600)
    positions: list[str] = Field(default_factory=lambda: ["P1", "P2", "P3", "P4"])

    @model_validator(mode="before")
    @classmethod
    def normalize_member6_fields(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        normalized = dict(data)
        if "modelId" in normalized and "model_id" not in normalized:
            normalized["model_id"] = normalized["modelId"]
        if "scenarioId" in normalized and "scenario_id" not in normalized:
            normalized["scenario_id"] = normalized["scenarioId"]
            normalized.setdefault("experiment_id", str(normalized["scenarioId"]))
        if "horizonHours" in normalized and "horizon_seconds" not in normalized:
            normalized["horizon_seconds"] = min(7200, int(normalized["horizonHours"]) * 60)
        return normalized


class ForecastJobResponse(BaseModel):
    id: str
    experiment_id: str
    horizon_seconds: int
    status: str
    adapter_mode: str
    is_operational_model: bool = False
    isMock: bool = True
    dataSource: str = "SAMPLE_BENCHMARK_DATA"
    engine_notice: str = (
        "STUBBED ADAPTER: AI flood forecast research model is not yet operational. "
        "Baseline persistence/extrapolation estimates are returned for API integration."
    )
    input_window: dict[str, Any]
    predictions: list[dict[str, Any]]
    created_at: datetime
    completed_at: Optional[datetime] = None


class ForecastMetricsResponse(BaseModel):
    id: str
    forecast_id: str
    experiment_id: str
    adapter_mode: str
    is_operational_model: bool = False
    isMock: bool = True
    engine_notice: str
    metrics: dict[str, Any]


# ---------------------------------------------------------------------------
# 9. Validation Metrics & Comparisons
# ---------------------------------------------------------------------------


class ValidationMetricsResponse(BaseModel):
    experiment_id: str
    sample_count: int
    rmse_cm: float
    mae_cm: float
    nse: float
    r_squared: float
    bias_cm: float
    peak_depth_error_cm: float
    adapter_disclaimer: str


class ValidationComparisonPoint(BaseModel):
    position: str
    timestamp: datetime
    observed_depth_cm: float
    simulated_depth_cm: float
    forecast_depth_cm: float
    residual_sim_cm: float
    residual_forecast_cm: float


class ValidationComparisonsResponse(BaseModel):
    experiment_id: str
    adapter_disclaimer: str
    comparisons: list[ValidationComparisonPoint]
