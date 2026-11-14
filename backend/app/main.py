"""Crestix Probe FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import experiments, forecast, health, sensor, simulation, terrain, validation
from app.core.config import get_settings
from app.core.errors import register_exception_handlers


def create_app() -> FastAPI:
    """Create and configure the Crestix Probe FastAPI application."""
    settings = get_settings()

    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "Crestix Probe Backend Service (Member 9: Backend, Database & API Engineering). "
            "Provides PostgreSQL persistence, ESP32 sensor telemetry ingestion, calibration, "
            "terrain/rainfall management, validation metrics, and stubbed simulation/AI forecast "
            "job orchestration adapters."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # Configure CORS for frontend deployment origin(s)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register structured JSON error handlers
    register_exception_handlers(application)

    # Mount domain routers
    application.include_router(health.router)
    application.include_router(experiments.router)
    application.include_router(sensor.router)
    application.include_router(terrain.router)
    application.include_router(simulation.router)
    application.include_router(forecast.router)
    application.include_router(validation.router)

    return application


app = create_app()
