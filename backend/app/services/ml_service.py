"""Unified ML model registry, caching, metrics tracking, and inference service."""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Optional

from app.core.config import Settings, get_settings
from app.schemas.ml import (
    MLHealthResponse,
    MLMetricsResponse,
    MLModelHealth,
    MLModelInfo,
    MLModelMetrics,
    MLModelsCatalogResponse,
    PINOPredictRequest,
    PINOPredictResponse,
    PredictionMetadata,
    SpatialDimensions,
    XGBoostPredictRequest,
    XGBoostPredictResponse,
)
from app.services.ml_adapters import BaseMLAdapter, PINOModelAdapter, XGBoostModelAdapter


@dataclass
class _RuntimeMetrics:
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    cache_hits: int = 0
    total_inference_ms: float = 0.0
    last_inference_ms: Optional[float] = None
    last_error: Optional[str] = None


class MLModelRegistry:
    """Thread-safe registry managing cached XGBoost and PINO adapters and runtime metrics."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._metrics_lock = threading.Lock()
        self.xgboost = XGBoostModelAdapter(
            submodule_dir=Path(settings.ml_xgboost_submodule_dir),
            weights_path=Path(settings.ml_xgboost_weights_path),
            version=settings.ml_xgboost_version,
            device="cpu",
        )
        self.pino = PINOModelAdapter(
            submodule_dir=Path(settings.ml_pino_submodule_dir),
            weights_path=Path(settings.ml_pino_weights_path),
            version=settings.ml_pino_version,
            device=settings.ml_pino_device,
        )
        self._metrics: dict[str, _RuntimeMetrics] = {
            "xgboost": _RuntimeMetrics(),
            "pino": _RuntimeMetrics(),
        }

    def _adapters(self) -> dict[str, BaseMLAdapter]:
        return {"xgboost": self.xgboost, "pino": self.pino}

    def _record_success(self, model_id: str, duration_ms: float, cached: bool) -> None:
        with self._metrics_lock:
            m = self._metrics[model_id]
            m.total_requests += 1
            m.successful_requests += 1
            if cached:
                m.cache_hits += 1
            m.total_inference_ms += duration_ms
            m.last_inference_ms = round(duration_ms, 3)

    def _record_failure(self, model_id: str, error_msg: str) -> None:
        with self._metrics_lock:
            m = self._metrics[model_id]
            m.total_requests += 1
            m.failed_requests += 1
            m.last_error = error_msg

    def predict_xgboost(self, request: XGBoostPredictRequest) -> XGBoostPredictResponse:
        start = time.perf_counter()
        try:
            points, importance, was_cached = self.xgboost.predict(request)
        except Exception as exc:
            self._record_failure("xgboost", str(exc))
            raise

        duration_ms = round((time.perf_counter() - start) * 1000.0, 3)
        self._record_success("xgboost", duration_ms, was_cached)

        peak_depth = max((p.predicted_water_depth_cm for p in points), default=0.0)
        metadata = PredictionMetadata(
            model_name=self.xgboost.model_name,
            model_version=self.xgboost.version,
            forecast_horizon_hours=request.forecast_horizon_hours,
            step_minutes=request.step_minutes,
            spatial_dimensions=SpatialDimensions(
                rows=1,
                cols=len(request.positions),
                resolution_m=None,
                crs="POINT_STATIONS",
            ),
            units=self.xgboost.units(),
            inference_duration_ms=duration_ms,
            provenance=self.xgboost.build_provenance(),
            cached_model=was_cached,
        )
        return XGBoostPredictResponse(
            predictions=points,
            peak_predicted_depth_cm=peak_depth,
            feature_importance=importance,
            metadata=metadata,
        )

    def predict_pino(self, request: PINOPredictRequest) -> PINOPredictResponse:
        start = time.perf_counter()
        try:
            frames, was_cached = self.pino.predict(request)
        except Exception as exc:
            self._record_failure("pino", str(exc))
            raise

        duration_ms = round((time.perf_counter() - start) * 1000.0, 3)
        self._record_success("pino", duration_ms, was_cached)

        peak_depth = max((f.max_depth_cm for f in frames), default=0.0)
        metadata = PredictionMetadata(
            model_name=self.pino.model_name,
            model_version=self.pino.version,
            forecast_horizon_hours=request.forecast_horizon_hours,
            step_minutes=request.step_minutes,
            spatial_dimensions=request.spatial_dimensions,
            units=self.pino.units(),
            inference_duration_ms=duration_ms,
            provenance=self.pino.build_provenance(),
            cached_model=was_cached,
        )
        return PINOPredictResponse(
            frames=frames,
            peak_depth_cm=peak_depth,
            metadata=metadata,
        )

    def get_models_catalog(self) -> MLModelsCatalogResponse:
        models: list[MLModelInfo] = []
        for model_id, adapter in self._adapters().items():
            inspection = adapter.inspect()
            status = (
                "cached"
                if adapter.is_loaded
                else ("ready" if inspection.installed else "not_installed")
            )
            models.append(
                MLModelInfo(
                    model_id=model_id,
                    name=adapter.model_name,
                    version=adapter.version,
                    architecture=adapter.architecture,
                    installed=inspection.installed,
                    loaded_in_cache=adapter.is_loaded,
                    status=status,
                    submodule_path=str(adapter.submodule_dir),
                    repository_url=adapter.repository_url,
                    weights_path=str(adapter.weights_path),
                    missing_components=inspection.missing_components,
                    supported_horizon_hours=(0.1, 72.0),
                    units=adapter.units(),
                    provenance=adapter.build_provenance(),
                )
            )
        return MLModelsCatalogResponse(models=models)

    def get_health(self) -> MLHealthResponse:
        health_map: dict[str, MLModelHealth] = {}
        installed_count = 0
        for model_id, adapter in self._adapters().items():
            inspection = adapter.inspect()
            if inspection.installed:
                installed_count += 1
            status = (
                "cached"
                if adapter.is_loaded
                else ("ready" if inspection.installed else "not_installed")
            )
            detail = (
                "Model weights loaded and cached in memory."
                if adapter.is_loaded
                else (
                    "Submodule and checkpoint present; ready to load on first prediction."
                    if inspection.installed
                    else f"Model not installed. Missing: {', '.join(inspection.missing_components)}"
                )
            )
            health_map[model_id] = MLModelHealth(
                model_id=model_id,
                name=adapter.model_name,
                installed=inspection.installed,
                loaded_in_cache=adapter.is_loaded,
                status=status,
                submodule_present=inspection.submodule_present,
                weights_present=inspection.weights_present,
                device=adapter.device,
                detail=detail,
            )

        if installed_count == len(health_map):
            overall = "ready"
        elif installed_count > 0:
            overall = "partial"
        else:
            overall = "models_not_installed"

        return MLHealthResponse(service_status=overall, models=health_map)

    def get_metrics(self) -> MLMetricsResponse:
        out: dict[str, MLModelMetrics] = {}
        with self._metrics_lock:
            for model_id, adapter in self._adapters().items():
                inspection = adapter.inspect()
                m = self._metrics[model_id]
                avg_ms = (
                    round(m.total_inference_ms / m.successful_requests, 3)
                    if m.successful_requests > 0
                    else None
                )
                out[model_id] = MLModelMetrics(
                    model_id=model_id,
                    installed=inspection.installed,
                    loaded_in_cache=adapter.is_loaded,
                    load_count=adapter.load_count,
                    total_requests=m.total_requests,
                    successful_requests=m.successful_requests,
                    failed_requests=m.failed_requests,
                    cache_hits=m.cache_hits,
                    avg_inference_duration_ms=avg_ms,
                    last_inference_duration_ms=m.last_inference_ms,
                    last_error=m.last_error,
                    training_metrics=adapter.get_training_metrics(),
                )
        return MLMetricsResponse(models=out)


@lru_cache
def get_ml_registry() -> MLModelRegistry:
    """Return process-wide cached ML model registry instance."""
    return MLModelRegistry(get_settings())
