"""End-to-end API, validation, WebSocket, and Alembic migration tests."""

import io
from pathlib import Path

from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect

from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.main import create_app


def test_health_and_config_no_secrets_exposed(client: TestClient) -> None:
    """Verify health endpoint works, engines report stub status honestly, and secrets are never exposed."""
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["database_connected"] is True
    assert data["engines"]["hydrodynamic_solver"]["operational"] is False
    assert data["engines"]["hydrodynamic_solver"]["mode"] == "stub"
    assert data["engines"]["ai_forecast_model"]["operational"] is False
    assert data["engines"]["ai_forecast_model"]["mode"] == "stub"

    cfg_resp = client.get("/api/config")
    assert cfg_resp.status_code == 200
    cfg_text = cfg_resp.text
    assert "auth_secret_key" not in cfg_text
    assert "auth_api_key" not in cfg_text
    assert "password" not in cfg_text


def test_cors_preflight_headers(client: TestClient) -> None:
    """Verify CORS headers are returned for allowed frontend origin."""
    resp = client.options(
        "/api/sensor/latest",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_alembic_migrations_upgrade_and_downgrade(tmp_path: Path) -> None:
    """Verify Alembic migrations run cleanly up to head and downgrade back to base."""
    db_file = tmp_path / "migration_test.db"
    db_url = f"sqlite:///{db_file.as_posix()}"

    backend_root = Path(__file__).resolve().parent.parent
    alembic_cfg = Config(str(backend_root / "alembic.ini"))
    alembic_cfg.set_main_option("script_location", str(backend_root / "alembic"))
    alembic_cfg.set_main_option("sqlalchemy.url", db_url)

    engine = create_engine(db_url)
    with engine.begin() as connection:
        alembic_cfg.attributes["connection"] = connection
        command.upgrade(alembic_cfg, "head")

    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    expected_tables = {
        "users",
        "terrain_models",
        "rainfall_scenarios",
        "experiments",
        "sensor_readings",
        "simulation_jobs",
        "forecast_jobs",
    }
    assert expected_tables.issubset(tables)

    with engine.begin() as connection:
        alembic_cfg.attributes["connection"] = connection
        command.downgrade(alembic_cfg, "base")

    inspector_after = inspect(engine)
    remaining = set(inspector_after.get_table_names()) - {"alembic_version"}
    assert len(remaining) == 0
    engine.dispose()


def test_users_and_experiments_lifecycle(client: TestClient) -> None:
    """Test user creation, experiment creation, listing, detail retrieval, and report generation."""
    user_resp = client.post(
        "/api/users",
        json={
            "email": "hydrologist@crestix.org",
            "full_name": "Dr. River Flood",
            "role": "researcher",
        },
    )
    assert user_resp.status_code == 201
    user_id = user_resp.json()["id"]

    # Duplicate user email returns 409 structured error
    dup_user = client.post(
        "/api/users",
        json={
            "email": "hydrologist@crestix.org",
            "full_name": "Duplicate User",
            "role": "researcher",
        },
    )
    assert dup_user.status_code == 409
    assert dup_user.json()["error"]["code"] == "DUPLICATE_RESOURCE"

    exp_resp = client.post(
        "/api/experiments",
        json={
            "id": "EXP001",
            "name": "Urban Flash Flood Calibration Run",
            "description": "Physical sandbox test with 4 ESP32 ultrasonic probes",
            "status": "running",
            "owner_id": user_id,
            "probe_positions": ["P1", "P2", "P3", "P4"],
            "calibration_config": {"mount_height_cm": 20.0, "offset_cm": 0.0},
        },
    )
    assert exp_resp.status_code == 201
    exp_data = exp_resp.json()
    assert exp_data["id"] == "EXP001"

    list_resp = client.get("/api/experiments?page=1&page_size=10")
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 1
    assert list_resp.json()["items"][0]["id"] == "EXP001"

    detail_resp = client.get("/api/experiments/EXP001")
    assert detail_resp.status_code == 200
    assert detail_resp.json()["name"] == "Urban Flash Flood Calibration Run"

    not_found = client.get("/api/experiments/EXP_MISSING")
    assert not_found.status_code == 404
    assert not_found.json()["error"]["code"] == "RESOURCE_NOT_FOUND"


def test_sensor_ingestion_calibration_duplicates_and_pagination(client: TestClient) -> None:
    """Verify exact suggested sensor payload, raw vs calculated depth separation, duplicates, and history pagination."""
    payload = {
        "experiment_id": "EXP001",
        "position": "P2",
        "timestamp": "2026-11-14T10:30:05",
        "distance_cm": 8.2,
        "water_depth_cm": 11.8,
        "temperature_c": 29.0,
    }
    resp = client.post("/api/sensor/readings", json=payload)
    assert resp.status_code == 201
    body = resp.json()
    assert body["experiment_id"] == "EXP001"
    assert body["position"] == "P2"
    assert body["raw_distance_cm"] == 8.2
    assert body["calculated_water_depth_cm"] == 11.8
    assert body["distance_cm"] == 8.2
    assert body["water_depth_cm"] == 11.8
    assert body["quality_flag"] == "GOOD"
    assert body["calibration_metadata"]["mount_height_cm"] == 20.0
    assert body["calibration_metadata"]["speed_of_sound_m_s"] > 340.0

    # Duplicate reading at exact same (experiment_id, position, timestamp) -> 409 Conflict
    dup_resp = client.post("/api/sensor/readings", json=payload)
    assert dup_resp.status_code == 409
    assert dup_resp.json()["error"]["code"] == "DUPLICATE_RESOURCE"

    # Invalid reading: negative distance -> 422 Validation Error
    bad_resp = client.post(
        "/api/sensor/readings",
        json={
            "experiment_id": "EXP001",
            "position": "P2",
            "timestamp": "2026-11-14T10:30:10",
            "distance_cm": -5.0,
            "water_depth_cm": 11.8,
            "temperature_c": 29.0,
        },
    )
    assert bad_resp.status_code == 422
    assert bad_resp.json()["error"]["code"] == "VALIDATION_ERROR"

    # Invalid physics reading: distance exceeds mount height (e.g., 35cm on 20cm mount) -> 422
    physics_bad = client.post(
        "/api/sensor/readings",
        json={
            "experiment_id": "EXP001",
            "position": "P2",
            "timestamp": "2026-11-14T10:30:15",
            "distance_cm": 35.0,
            "temperature_c": 29.0,
        },
    )
    assert physics_bad.status_code == 422
    assert physics_bad.json()["error"]["code"] == "INVALID_PAYLOAD"

    # Ingest additional readings for pagination & latest checks
    for i in range(1, 5):
        r = client.post(
            "/api/sensor/readings",
            json={
                "experiment_id": "EXP001",
                "position": f"P{i}",
                "timestamp": f"2026-11-14T10:31:0{i}",
                "distance_cm": round(10.0 - i * 0.5, 2),
                "temperature_c": 28.5,
            },
        )
        assert r.status_code == 201

    latest_resp = client.get("/api/sensor/latest?experiment_id=EXP001")
    assert latest_resp.status_code == 200
    latest_items = latest_resp.json()
    assert len(latest_items) == 4  # P1, P2, P3, P4

    hist_p1 = client.get("/api/sensor/history?experiment_id=EXP001&page=1&page_size=2")
    assert hist_p1.status_code == 200
    hist_data = hist_p1.json()
    assert hist_data["total"] == 5
    assert len(hist_data["items"]) == 2
    assert hist_data["page"] == 1
    assert hist_data["total_pages"] == 3


def test_terrain_upload_and_rainfall_scenarios(client: TestClient) -> None:
    """Test terrain DEM file upload, validation, and rainfall scenario endpoints."""
    dem_bytes = b"ncols 4\nnrows 4\nxllcorner 0\nyllcorner 0\ncellsize 1\n10 10 9 8\n"
    resp = client.post(
        "/api/terrain/upload",
        data={
            "name": "Basin DEM v1",
            "description": "High-res laser scan of physical flume",
            "crs": "LOCAL_SANDBOX_CM",
            "resolution_cm": "0.5",
            "bounds_json": '{"width_cm": 200, "length_cm": 100}',
        },
        files={"file": ("flume_scan.asc", io.BytesIO(dem_bytes), "text/plain")},
    )
    assert resp.status_code == 201
    terrain_id = resp.json()["id"]
    assert resp.json()["resolution_cm"] == 0.5

    get_ter = client.get(f"/api/terrain/{terrain_id}")
    assert get_ter.status_code == 200
    assert get_ter.json()["name"] == "Basin DEM v1"

    # Reject disallowed file extension
    bad_ext = client.post(
        "/api/terrain/upload",
        data={"name": "Executable"},
        files={"file": ("malware.exe", io.BytesIO(b"123"), "application/octet-stream")},
    )
    assert bad_ext.status_code == 422

    # Create rainfall scenario
    rain_resp = client.post(
        "/api/rainfall/scenarios",
        json={
            "name": "100-Year Extreme Cloudburst",
            "intensity_mm_hr": 120.0,
            "duration_minutes": 60.0,
            "return_period_years": 100,
            "spatial_distribution": "uniform",
        },
    )
    assert rain_resp.status_code == 201
    rain_id = rain_resp.json()["id"]

    get_rain = client.get(f"/api/rainfall/scenarios/{rain_id}")
    assert get_rain.status_code == 200
    assert get_rain.json()["intensity_mm_hr"] == 120.0


def test_simulation_forecast_validation_and_reporting(client: TestClient) -> None:
    """Test stubbed simulation, stubbed AI forecast, validation metrics, and experiment report."""
    # Seed sensor readings
    for idx, pos in enumerate(["P1", "P2", "P3", "P4"], start=1):
        client.post(
            "/api/sensor/readings",
            json={
                "experiment_id": "EXP_VAL",
                "position": pos,
                "timestamp": f"2026-11-14T11:00:0{idx}",
                "distance_cm": 9.0,
                "water_depth_cm": 11.0,
                "temperature_c": 27.0,
            },
        )

    # Trigger stubbed simulation job
    sim_resp = client.post(
        "/api/simulation/run",
        json={
            "experiment_id": "EXP_VAL",
            "duration_seconds": 60,
            "time_step_seconds": 15,
            "inflow_rate_l_min": 6.5,
        },
    )
    assert sim_resp.status_code == 201
    sim_data = sim_resp.json()
    sim_id = sim_data["id"]
    assert sim_data["adapter_mode"] == "stub"
    assert sim_data["is_operational_solver"] is False

    sim_status = client.get(f"/api/simulation/{sim_id}")
    assert sim_status.status_code == 200

    sim_frames = client.get(f"/api/simulation/{sim_id}/frames")
    assert sim_frames.status_code == 200
    assert sim_frames.json()["total_frames"] == 5
    assert sim_frames.json()["frames"][0]["is_stub_frame"] is True

    # Trigger stubbed forecast job
    fc_resp = client.post(
        "/api/forecast/predict",
        json={
            "experiment_id": "EXP_VAL",
            "horizon_seconds": 30,
            "step_seconds": 10,
            "positions": ["P1", "P2"],
        },
    )
    assert fc_resp.status_code == 201
    fc_data = fc_resp.json()
    fc_id = fc_data["id"]
    assert fc_data["adapter_mode"] == "stub"
    assert fc_data["is_operational_model"] is False

    fc_get = client.get(f"/api/forecast/{fc_id}")
    assert fc_get.status_code == 200
    assert len(fc_get.json()["predictions"]) == 6  # 3 steps * 2 positions

    fc_metrics = client.get(f"/api/forecast/{fc_id}/metrics")
    assert fc_metrics.status_code == 200
    assert fc_metrics.json()["is_operational_model"] is False

    # Validation metrics & comparisons
    val_metrics = client.get("/api/validation/metrics?experiment_id=EXP_VAL")
    assert val_metrics.status_code == 200
    vm = val_metrics.json()
    assert vm["sample_count"] == 4
    assert vm["rmse_cm"] >= 0.0

    val_comp = client.get("/api/validation/comparisons?experiment_id=EXP_VAL")
    assert val_comp.status_code == 200
    assert len(val_comp.json()["comparisons"]) == 4

    # Experiment summary report
    report = client.get("/api/experiments/EXP_VAL/report")
    assert report.status_code == 200
    rep_data = report.json()
    assert rep_data["sensor_summary"]["total_readings"] == 4
    assert rep_data["simulation_jobs_count"] == 1
    assert rep_data["forecast_jobs_count"] == 1


def test_websocket_live_telemetry_broadcast(client: TestClient) -> None:
    """Verify WebSocket connection and live broadcast upon sensor ingestion."""
    with client.websocket_connect("/api/sensor/ws") as websocket:
        hello = websocket.receive_json()
        assert hello["event"] == "connection.established"

        websocket.send_text("ping")
        pong = websocket.receive_json()
        assert pong["event"] == "pong"

        # Ingest a reading and verify WebSocket receives real-time broadcast
        post_resp = client.post(
            "/api/sensor/readings",
            json={
                "experiment_id": "EXP_WS",
                "position": "P1",
                "timestamp": "2026-11-14T12:00:00",
                "distance_cm": 7.5,
                "water_depth_cm": 12.5,
                "temperature_c": 26.0,
            },
        )
        assert post_resp.status_code == 201

        broadcast = websocket.receive_json()
        assert broadcast["event"] == "sensor.reading"
        assert broadcast["data"]["experiment_id"] == "EXP_WS"
        assert broadcast["data"]["calculated_water_depth_cm"] == 12.5


def test_authentication_enforcement_when_enabled(db_session, tmp_path: Path) -> None:
    """Verify authentication integration rejects unauthenticated requests when AUTH_ENABLED=true."""
    strict_settings = Settings(
        database_url="sqlite+pysqlite:///:memory:",
        auth_enabled=True,
        auth_api_key="valid-esp32-key",
        auth_secret_key="valid-bearer-secret",
        upload_dir=str(tmp_path / "uploads"),
    )
    app = create_app()
    app.dependency_overrides[get_db] = lambda: db_session
    app.dependency_overrides[get_settings] = lambda: strict_settings

    with TestClient(app) as strict_client:
        unauth = strict_client.get("/api/auth/session")
        assert unauth.status_code == 401

        key_auth = strict_client.get(
            "/api/auth/session", headers={"X-API-Key": "valid-esp32-key"}
        )
        assert key_auth.status_code == 200
        assert key_auth.json()["authenticated"] is True
        assert key_auth.json()["auth_method"] == "api_key"
