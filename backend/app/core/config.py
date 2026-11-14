"""Application configuration managed via environment variables."""

from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Validated application settings loaded from environment variables or .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application metadata
    app_name: str = "Crestix Probe API"
    app_version: str = "0.1.0"
    environment: str = "development"
    debug: bool = False
    api_prefix: str = "/api"

    # Database configuration (PostgreSQL in production, configurable via DATABASE_URL)
    database_url: str = "postgresql+psycopg2://postgres:password_placeholder@localhost:5432/crestix_probe"

    # Authentication integration interface
    auth_secret_key: str = "placeholder-secret-do-not-expose"
    auth_api_key: str = "placeholder-api-key-do-not-expose"
    auth_enabled: bool = False

    # CORS configuration
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    # Storage & file uploads
    upload_dir: str = "./uploads/terrain"
    max_upload_size_mb: int = 50

    # Sensor calibration defaults
    default_mount_height_cm: float = 20.0
    max_sensor_distance_cm: float = 400.0
    min_sensor_distance_cm: float = 1.0

    # Research engines status (explicit stub declaration until actual engines are integrated)
    simulation_adapter_mode: str = "stub"
    forecast_adapter_mode: str = "stub"

    @field_validator("simulation_adapter_mode", "forecast_adapter_mode")
    @classmethod
    def validate_adapter_mode(cls, v: str) -> str:
        allowed = {"stub", "mock"}
        mode = v.strip().lower()
        if mode not in allowed:
            # Never claim operational unless an actual implementation exists
            return "stub"
        return mode

    @property
    def allowed_origins(self) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        if not self.cors_origins:
            return []
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def safe_summary(self) -> dict:
        """Return non-sensitive configuration summary safe for API responses."""
        db_scheme = self.database_url.split("://")[0] if "://" in self.database_url else "unknown"
        return {
            "app_name": self.app_name,
            "app_version": self.app_version,
            "environment": self.environment,
            "debug": self.debug,
            "api_prefix": self.api_prefix,
            "database_dialect": db_scheme,
            "auth_enabled": self.auth_enabled,
            "cors_origins": self.allowed_origins,
            "max_upload_size_mb": self.max_upload_size_mb,
            "default_mount_height_cm": self.default_mount_height_cm,
            "engines": {
                "hydrodynamic_solver": {
                    "mode": self.simulation_adapter_mode,
                    "operational": False,
                    "note": "Stubbed adapter active; numerical research engine is not yet integrated.",
                },
                "ai_forecast_model": {
                    "mode": self.forecast_adapter_mode,
                    "operational": False,
                    "note": "Stubbed adapter active; AI forecast engine is not yet integrated.",
                },
            },
        }


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings instance."""
    return Settings()
