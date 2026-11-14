"""Core Module 1 & 2: Health, non-secret configuration, and authentication inspection."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.auth import Principal, get_current_principal
from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.schemas import EngineCapabilityStatus, HealthResponse

router = APIRouter(tags=["Health & Configuration"])


@router.get("/health", response_model=HealthResponse, summary="Service health check")
@router.get("/api/health", response_model=HealthResponse, summary="API health check")
def health_check(
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> HealthResponse:
    """Return service health, database connectivity, and honest engine operational status."""
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    summary = settings.safe_summary()
    engines = {
        k: EngineCapabilityStatus(**v) for k, v in summary["engines"].items()
    }
    return HealthResponse(
        status="healthy" if db_ok else "degraded",
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
        database_connected=db_ok,
        timestamp=datetime.now(timezone.utc),
        engines=engines,
    )


@router.get("/api/config", summary="Sanitized runtime configuration")
def get_public_config(settings: Settings = Depends(get_settings)) -> dict:
    """Return non-sensitive runtime configuration (never exposes secrets or credentials)."""
    return settings.safe_summary()


@router.get("/api/auth/session", response_model=Principal, summary="Inspect caller auth session")
def get_auth_session(
    principal: Principal = Depends(get_current_principal),
) -> Principal:
    """Verify authentication integration headers (Bearer token or X-API-Key)."""
    return principal
