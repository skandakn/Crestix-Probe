"""Pytest fixtures for isolated database and TestClient testing."""

import os
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import Settings, get_settings
from app.db.base import Base
from app.db.session import get_db
from app.main import create_app


@pytest.fixture()
def test_settings(tmp_path: Path) -> Settings:
    upload_path = tmp_path / "uploads"
    return Settings(
        app_name="Crestix Probe Test API",
        app_version="0.1.0-test",
        environment="test",
        debug=True,
        database_url="sqlite+pysqlite:///:memory:",
        auth_secret_key="test-secret-key-placeholder",
        auth_api_key="test-device-api-key-placeholder",
        auth_enabled=False,
        cors_origins="http://localhost:3000,http://localhost:5173",
        upload_dir=str(upload_path),
        max_upload_size_mb=5,
        default_mount_height_cm=20.0,
        simulation_adapter_mode="stub",
        forecast_adapter_mode="stub",
    )


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session: Session, test_settings: Settings) -> Generator[TestClient, None, None]:
    app = create_app()

    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    def override_get_settings() -> Settings:
        return test_settings

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_settings] = override_get_settings

    with TestClient(app) as test_client:
        yield test_client
