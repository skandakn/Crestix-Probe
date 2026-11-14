"""Unified ML Model Integration API Router (XGBoost & PINO)."""

from fastapi import APIRouter, Depends

from app.core.auth import Principal, get_current_principal
from app.schemas.ml import (
    MLHealthResponse,
    MLMetricsResponse,
    MLModelsCatalogResponse,
    PINOPredictRequest,
    PINOPredictResponse,
    XGBoostPredictRequest,
    XGBoostPredictResponse,
)
from app.services.ml_service import MLModelRegistry, get_ml_registry

router = APIRouter(prefix="/api/ml", tags=["ML Model Integration (XGBoost & PINO)"])


@router.post(
    "/xgboost/predict",
    response_model=XGBoostPredictResponse,
    summary="Run real XGBoost flood forecast inference",
)
def predict_xgboost(
    payload: XGBoostPredictRequest,
    registry: MLModelRegistry = Depends(get_ml_registry),
    _principal: Principal = Depends(get_current_principal),
) -> XGBoostPredictResponse:
    """Execute cached XGBoost inference or return HTTP 503 MODEL_NOT_INSTALLED if unavailable."""
    return registry.predict_xgboost(payload)


@router.post(
    "/pino/predict",
    response_model=PINOPredictResponse,
    summary="Run real PINO 2D spatio-temporal flood forecast inference",
)
def predict_pino(
    payload: PINOPredictRequest,
    registry: MLModelRegistry = Depends(get_ml_registry),
    _principal: Principal = Depends(get_current_principal),
) -> PINOPredictResponse:
    """Execute cached PINO inference or return HTTP 503 MODEL_NOT_INSTALLED if unavailable."""
    return registry.predict_pino(payload)


@router.get(
    "/models",
    response_model=MLModelsCatalogResponse,
    summary="List integrated ML models, schemas, units, and installation status",
)
def list_ml_models(
    registry: MLModelRegistry = Depends(get_ml_registry),
) -> MLModelsCatalogResponse:
    return registry.get_models_catalog()


@router.get(
    "/health",
    response_model=MLHealthResponse,
    summary="Inspect ML model submodule & checkpoint readiness",
)
def ml_health(
    registry: MLModelRegistry = Depends(get_ml_registry),
) -> MLHealthResponse:
    return registry.get_health()


@router.get(
    "/metrics",
    response_model=MLMetricsResponse,
    summary="Retrieve ML model runtime inference metrics & training evaluation benchmarks",
)
def ml_metrics(
    registry: MLModelRegistry = Depends(get_ml_registry),
) -> MLMetricsResponse:
    return registry.get_metrics()
