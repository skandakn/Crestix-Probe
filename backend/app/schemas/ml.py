"""Pydantic v2 request, response, metadata, health, and metrics schemas for ML integration."""

import math
from datetime import datetime, timezone
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


def _ensure_finite(value: Optional[float], field_name: str) -> Optional[float]:
    if value is not None and (math.isnan(value) or math.isinf(value)):
        raise ValueError(f"{field_name} must be a finite numeric value.")
    return value


class SpatialDimensions(BaseModel):
    """Spatial grid or sensor-station dimensions for a prediction output."""

    rows: int = Field(..., ge=1, le=1024, description="Number of Y grid cells (or 1 for point station)")
    cols: int = Field(..., ge=1, le=1024, description="Number of X grid cells (or station count)")
    resolution_m: Optional[float] = Field(
        default=None, gt=0.0, description="Spatial resolution in meters per cell"
    )
    crs: str = Field(default="LOCAL_SANDBOX_CM", min_length=1, max_length=64)


class ModelProvenance(BaseModel):
    """Traceability metadata for model source repository, commit, dataset, and checkpoint."""

    repository_url: str
    submodule_path: str
    pinned_commit: Optional[str] = None
    dataset: str
    checkpoint_path: str
    weights_sha256: Optional[str] = None


class PredictionUnits(BaseModel):
    """Explicit physical measurement units for model outputs."""

    depth: str = "cm"
    rainfall_intensity: str = "mm/hr"
    velocity: Optional[str] = None
    time_step: str = "minutes"


class PredictionMetadata(BaseModel):
    """Mandatory prediction provenance and execution metadata."""

    model_name: str
    model_version: str
    forecast_horizon_hours: float = Field(..., gt=0.0)
    step_minutes: int = Field(..., ge=1)
    spatial_dimensions: SpatialDimensions
    units: PredictionUnits
    inference_duration_ms: float = Field(..., ge=0.0)
    provenance: ModelProvenance
    executed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    cached_model: bool = Field(
        ...,
        description="True when weights were already cached in memory before this request",
    )


# ---------------------------------------------------------------------------
# XGBoost Tabular / Point-Station Forecast Schemas
# ---------------------------------------------------------------------------


class SensorObservationFeature(BaseModel):
    """Optional recent sensor frame supplied to XGBoost feature engineering."""

    position: str = Field(..., min_length=1, max_length=32)
    timestamp: datetime
    water_depth_cm: float = Field(..., ge=0.0, le=500.0)
    temperature_c: Optional[float] = Field(default=None, ge=-20.0, le=85.0)

    @field_validator("water_depth_cm", "temperature_c")
    @classmethod
    def check_finite(cls, v: Optional[float], info: Any) -> Optional[float]:
        return _ensure_finite(v, info.field_name)


class XGBoostPredictRequest(BaseModel):
    """Validated input schema for XGBoost point/station flood depth forecasting."""

    model_config = ConfigDict(extra="forbid")

    experiment_id: Optional[str] = Field(default=None, min_length=2, max_length=64)
    scenario_id: Optional[str] = Field(default=None, min_length=2, max_length=64)
    positions: list[str] = Field(
        default_factory=lambda: ["P1", "P2", "P3"],
        min_length=1,
        max_length=32,
    )
    forecast_horizon_hours: float = Field(default=1.0, gt=0.0, le=72.0)
    step_minutes: int = Field(default=10, ge=1, le=360)
    rainfall_intensity_mm_hr: float = Field(..., ge=0.0, le=2000.0)
    soil_moisture_pct: float = Field(default=45.0, ge=0.0, le=100.0)
    initial_water_depth_cm: float = Field(default=0.0, ge=0.0, le=500.0)
    terrain_slope_deg: float = Field(default=2.5, ge=0.0, le=90.0)
    inflow_rate_l_min: float = Field(default=5.0, ge=0.0, le=5000.0)
    recent_observations: list[SensorObservationFeature] = Field(default_factory=list, max_length=500)
    extra_features: dict[str, float] = Field(default_factory=dict)

    @field_validator(
        "forecast_horizon_hours",
        "rainfall_intensity_mm_hr",
        "soil_moisture_pct",
        "initial_water_depth_cm",
        "terrain_slope_deg",
        "inflow_rate_l_min",
    )
    @classmethod
    def validate_finite_floats(cls, v: float, info: Any) -> float:
        _ensure_finite(v, info.field_name)
        return v

    @field_validator("extra_features")
    @classmethod
    def validate_extra_features(cls, v: dict[str, float]) -> dict[str, float]:
        for k, val in v.items():
            _ensure_finite(val, f"extra_features[{k}]")
        return v


class XGBoostForecastPoint(BaseModel):
    """Single station forecast step produced by XGBoost."""

    position: str
    lead_time_minutes: int = Field(..., ge=1)
    predicted_water_depth_cm: float = Field(..., ge=0.0)
    flood_probability: Optional[float] = Field(default=None, ge=0.0, le=1.0)


class XGBoostPredictResponse(BaseModel):
    """Structured XGBoost prediction payload with metadata."""

    ok: bool = True
    model_id: Literal["xgboost"] = "xgboost"
    predictions: list[XGBoostForecastPoint]
    peak_predicted_depth_cm: float = Field(..., ge=0.0)
    feature_importance: Optional[dict[str, float]] = None
    metadata: PredictionMetadata


# ---------------------------------------------------------------------------
# PINO Spatio-Temporal Flood Field Schemas
# ---------------------------------------------------------------------------


class PINOPredictRequest(BaseModel):
    """Validated input schema for Physics-Informed Neural Operator (PINO) 2D flood forecasting."""

    model_config = ConfigDict(extra="forbid")

    experiment_id: Optional[str] = Field(default=None, min_length=2, max_length=64)
    scenario_id: Optional[str] = Field(default=None, min_length=2, max_length=64)
    forecast_horizon_hours: float = Field(default=6.0, gt=0.0, le=72.0)
    step_minutes: int = Field(default=30, ge=1, le=360)
    spatial_dimensions: SpatialDimensions
    dem_grid: list[list[float]] = Field(
        ...,
        min_length=1,
        description="2D digital elevation model (DEM) matrix matching spatial_dimensions",
    )
    initial_depth_grid: Optional[list[list[float]]] = Field(
        default=None,
        description="Optional initial water depth 2D matrix matching spatial_dimensions",
    )
    rainfall_rate_mm_hr: float = Field(..., ge=0.0, le=2000.0)
    inflow_rate_m3_s: float = Field(default=0.0, ge=0.0, le=100000.0)
    manning_n: float = Field(default=0.035, gt=0.0, le=1.0)
    physics_loss_weight: float = Field(default=1.0, ge=0.0, le=100.0)

    @field_validator(
        "forecast_horizon_hours",
        "rainfall_rate_mm_hr",
        "inflow_rate_m3_s",
        "manning_n",
        "physics_loss_weight",
    )
    @classmethod
    def validate_finite_scalars(cls, v: float, info: Any) -> float:
        _ensure_finite(v, info.field_name)
        return v

    @model_validator(mode="after")
    def validate_grid_shapes_and_values(self) -> "PINOPredictRequest":
        rows = self.spatial_dimensions.rows
        cols = self.spatial_dimensions.cols

        if len(self.dem_grid) != rows or any(len(r) != cols for r in self.dem_grid):
            raise ValueError(
                f"dem_grid shape must match spatial_dimensions ({rows}x{cols})."
            )
        for r_idx, row in enumerate(self.dem_grid):
            for c_idx, val in enumerate(row):
                _ensure_finite(val, f"dem_grid[{r_idx}][{c_idx}]")

        if self.initial_depth_grid is not None:
            if len(self.initial_depth_grid) != rows or any(
                len(r) != cols for r in self.initial_depth_grid
            ):
                raise ValueError(
                    f"initial_depth_grid shape must match spatial_dimensions ({rows}x{cols})."
                )
            for r_idx, row in enumerate(self.initial_depth_grid):
                for c_idx, val in enumerate(row):
                    _ensure_finite(val, f"initial_depth_grid[{r_idx}][{c_idx}]")
                    if val < 0.0:
                        raise ValueError("initial_depth_grid values must be non-negative.")

        return self


class PINOFrameOutput(BaseModel):
    """Single spatio-temporal forecast frame produced by PINO."""

    step_index: int = Field(..., ge=0)
    lead_time_minutes: int = Field(..., ge=0)
    depth_grid_cm: list[list[float]]
    velocity_u_m_s: Optional[list[list[float]]] = None
    velocity_v_m_s: Optional[list[list[float]]] = None
    max_depth_cm: float = Field(..., ge=0.0)
    mass_conservation_residual: Optional[float] = None


class PINOPredictResponse(BaseModel):
    """Structured PINO 2D flood forecast response with metadata."""

    ok: bool = True
    model_id: Literal["pino"] = "pino"
    frames: list[PINOFrameOutput]
    peak_depth_cm: float = Field(..., ge=0.0)
    metadata: PredictionMetadata


# ---------------------------------------------------------------------------
# Model Catalog, Health & Runtime Metrics Schemas
# ---------------------------------------------------------------------------


class MLModelInfo(BaseModel):
    """Catalog entry describing an integrated ML model and its installation state."""

    model_id: str
    name: str
    version: str
    architecture: str
    installed: bool
    loaded_in_cache: bool
    status: Literal["ready", "cached", "not_installed", "error"]
    submodule_path: str
    repository_url: str
    weights_path: str
    missing_components: list[str] = Field(default_factory=list)
    supported_horizon_hours: tuple[float, float]
    units: PredictionUnits
    provenance: ModelProvenance


class MLModelsCatalogResponse(BaseModel):
    ok: bool = True
    models: list[MLModelInfo]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MLModelHealth(BaseModel):
    model_id: str
    name: str
    installed: bool
    loaded_in_cache: bool
    status: Literal["ready", "cached", "not_installed", "error"]
    submodule_present: bool
    weights_present: bool
    device: str
    detail: str


class MLHealthResponse(BaseModel):
    ok: bool = True
    service_status: Literal["ready", "partial", "models_not_installed"]
    models: dict[str, MLModelHealth]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MLModelMetrics(BaseModel):
    model_id: str
    installed: bool
    loaded_in_cache: bool
    load_count: int = Field(..., ge=0)
    total_requests: int = Field(..., ge=0)
    successful_requests: int = Field(..., ge=0)
    failed_requests: int = Field(..., ge=0)
    cache_hits: int = Field(..., ge=0)
    avg_inference_duration_ms: Optional[float] = None
    last_inference_duration_ms: Optional[float] = None
    last_error: Optional[str] = None
    training_metrics: Optional[dict[str, Any]] = None


class MLMetricsResponse(BaseModel):
    ok: bool = True
    models: dict[str, MLModelMetrics]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
