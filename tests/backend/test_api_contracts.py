"""Backend API contract, validation, pagination, and error envelope tests (Task 2)."""

from __future__ import annotations

import io
from fastapi.testclient import TestClient


def test_health_endpoint_contract(api_client: TestClient) -> None:
    response = api_client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert "engines" in body
    assert body["engines"]["hydrodynamic_solver"]["operational"] is False
    assert body["engines"]["ai_forecast_model"]["operational"] is False


def test_sensor_reading_ingestion_and_depth_separation(api_client: TestClient) -> None:
    payload = {
        "experiment_id": "EXP001",
        "position": "P2",
        "timestamp": "2026-11-14T10:30:05Z",
        "distance_cm": 8.2,
        "water_depth_cm": 11.8,
        "temperature_c": 29.0,
    }
    response = api_client.post("/api/sensor/readings", json=payload)
    assert response.status_code in (200, 201)
    data = response.json()
    assert data["experiment_id"] == "EXP001"
    assert data["position"] == "P2"
    assert data["raw_distance_cm"] == 8.2
    assert data["calculated_water_depth_cm"] == 11.8
    assert data["raw_distance_cm"] != data["calculated_water_depth_cm"]
    assert "calibration_metadata" in data


def test_duplicate_sensor_reading_rejected(api_client: TestClient) -> None:
    payload = {
        "experiment_id": "EXP001",
        "position": "P3",
        "timestamp": "2026-11-14T11:00:00Z",
        "distance_cm": 9.0,
        "water_depth_cm": 11.0,
        "temperature_c": 28.5,
    }
    first = api_client.post("/api/sensor/readings", json=payload)
    assert first.status_code in (200, 201)

    duplicate = api_client.post("/api/sensor/readings", json=payload)
    assert duplicate.status_code == 409
    err = duplicate.json()
    assert "error" in err
    assert err["error"]["code"] == "DUPLICATE_RESOURCE"


def test_invalid_sensor_reading_returns_structured_422_error(api_client: TestClient) -> None:
    bad_payload = {
        "experiment_id": "EXP001",
        "position": "P2",
        "timestamp": "2026-11-14T11:05:00Z",
        "distance_cm": -5.0,
        "water_depth_cm": 11.8,
        "temperature_c": 29.0,
    }
    response = api_client.post("/api/sensor/readings", json=bad_payload)
    assert response.status_code == 422
    body = response.json()
    assert "error" in body
    assert body["error"]["code"] in ("VALIDATION_ERROR", "INVALID_PAYLOAD")


def test_sensor_history_pagination_contract(api_client: TestClient) -> None:
    for idx in range(3):
        api_client.post(
            "/api/sensor/readings",
            json={
                "experiment_id": "EXP001",
                "position": "P1",
                "timestamp": f"2026-11-14T12:00:0{idx}Z",
                "distance_cm": 10.0,
                "water_depth_cm": 10.0,
                "temperature_c": 27.0,
            },
        )

    history = api_client.get("/api/sensor/history?experiment_id=EXP001&page=1&page_size=2")
    assert history.status_code == 200
    body = history.json()
    assert "items" in body
    assert body["page"] == 1
    assert body["page_size"] == 2
    assert len(body["items"]) <= 2
    assert body["total"] >= 3


def test_terrain_upload_validation(api_client: TestClient) -> None:
    bad_file = {"file": ("photo.png", io.BytesIO(b"not-a-dem"), "image/png")}
    bad_res = api_client.post("/api/terrain/upload", data={"name": "Invalid"}, files=bad_file)
    assert bad_res.status_code in (400, 422)

    empty_file = {"file": ("empty.tif", io.BytesIO(b""), "image/tiff")}
    empty_res = api_client.post("/api/terrain/upload", data={"name": "Empty"}, files=empty_file)
    assert empty_res.status_code in (400, 422)

    valid_file = {"file": ("flume_dem.tif", io.BytesIO(b"TIFF_HEADER_DEM_DATA"), "image/tiff")}
    valid_res = api_client.post("/api/terrain/upload", data={"name": "Flume DEM"}, files=valid_file)
    assert valid_res.status_code in (200, 201)
    assert valid_res.json()["file_name"] == "flume_dem.tif"


def test_simulation_forecast_and_validation_endpoints(api_client: TestClient) -> None:
    sim_res = api_client.post(
        "/api/simulation/run",
        json={"experiment_id": "EXP001", "duration_seconds": 60, "time_step_seconds": 10},
    )
    assert sim_res.status_code in (200, 201)
    assert sim_res.json()["is_operational_solver"] is False

    fc_res = api_client.post(
        "/api/forecast/predict",
        json={"experiment_id": "EXP001", "horizon_seconds": 60, "step_seconds": 10},
    )
    assert fc_res.status_code in (200, 201)
    assert fc_res.json()["is_operational_model"] is False

    val_res = api_client.get("/api/validation/metrics?experiment_id=EXP001")
    assert val_res.status_code == 200
    metrics = val_res.json()
    assert "rmse_cm" in metrics
    assert "nse" in metrics


def test_unknown_experiment_returns_404_error_envelope(api_client: TestClient) -> None:
    res = api_client.get("/api/experiments/NON_EXISTENT_999")
    assert res.status_code == 404
    body = res.json()
    assert "error" in body
    assert body["error"]["code"] == "RESOURCE_NOT_FOUND"
