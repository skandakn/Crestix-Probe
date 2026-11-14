"""Stubbed simulation and AI forecast adapters.

IMPORTANT: Neither the 2D shallow-water hydrodynamic solver nor the AI flood
forecast neural model is operational in this repository yet. These adapters
explicitly mark `is_operational_solver=False` / `is_operational_model=False`
and `adapter_mode="stub"` while producing deterministic, schema-compliant
structures for frontend and integration testing.
"""

import math
from datetime import datetime, timedelta, timezone
from typing import Any

from app.models import SensorReading
from app.schemas import ForecastPredictRequest, SimulationRunRequest

SIMULATION_STUB_NOTICE = (
    "STUBBED ADAPTER: Numerical hydrodynamic solver is not yet operational. "
    "Synthetic preview frames are provided for frontend and pipeline integration."
)

FORECAST_STUB_NOTICE = (
    "STUBBED ADAPTER: AI flood forecast research model is not yet operational. "
    "Baseline persistence/extrapolation estimates are returned for API integration."
)


def run_stub_simulation(request: SimulationRunRequest) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Generate deterministic stub frames for a numerical simulation job request."""
    num_steps = max(1, min(50, request.duration_seconds // request.time_step_seconds))
    frames: list[dict[str, Any]] = []
    peak_depth = 0.0

    # Sample 4x4 downsampled preview grid for payload efficiency alongside probe point estimates
    preview_nx = min(request.grid_nx, 6)
    preview_ny = min(request.grid_ny, 6)

    for step_idx in range(num_steps + 1):
        t_sec = step_idx * request.time_step_seconds
        progress = t_sec / max(1, request.duration_seconds)
        wave_factor = math.sin(progress * math.pi * 0.85)
        base_depth = round(request.inflow_rate_l_min * 1.6 * wave_factor, 3)

        grid_depths: list[list[float]] = []
        for y in range(preview_ny):
            row: list[float] = []
            for x in range(preview_nx):
                slope_atten = 1.0 - 0.08 * (x / max(1, preview_nx - 1))
                cell_depth = round(max(0.0, base_depth * slope_atten), 3)
                peak_depth = max(peak_depth, cell_depth)
                row.append(cell_depth)
            grid_depths.append(row)

        probe_depths = {
            "P1": round(max(0.0, base_depth * 1.05), 3),
            "P2": round(max(0.0, base_depth * 0.98), 3),
            "P3": round(max(0.0, base_depth * 0.90), 3),
            "P4": round(max(0.0, base_depth * 0.82), 3),
        }

        frames.append(
            {
                "frame_index": step_idx,
                "timestamp_offset_s": t_sec,
                "probe_depths_cm": probe_depths,
                "max_depth_cm": max(probe_depths.values()),
                "mean_velocity_m_s": round(0.15 * wave_factor, 3),
                "depth_grid_cm": grid_depths,
                "is_stub_frame": True,
            }
        )

    summary = {
        "adapter_mode": "stub",
        "is_operational_solver": False,
        "engine_notice": SIMULATION_STUB_NOTICE,
        "total_frames": len(frames),
        "peak_depth_cm": round(peak_depth, 3),
        "duration_seconds": request.duration_seconds,
        "time_step_seconds": request.time_step_seconds,
    }
    return frames, summary


def run_stub_forecast(
    request: ForecastPredictRequest,
    recent_readings: list[SensorReading],
) -> tuple[dict[str, Any], list[dict[str, Any]], dict[str, Any]]:
    """Generate deterministic baseline extrapolation predictions for a stub AI forecast job."""
    latest_by_pos: dict[str, float] = {}
    for r in recent_readings:
        if r.position not in latest_by_pos:
            latest_by_pos[r.position] = r.calculated_water_depth_cm

    base_time = (
        recent_readings[0].timestamp
        if recent_readings
        else datetime.now(timezone.utc)
    )
    if base_time.tzinfo is None:
        base_time = base_time.replace(tzinfo=timezone.utc)

    steps = max(1, min(60, request.horizon_seconds // request.step_seconds))
    predictions: list[dict[str, Any]] = []

    for step in range(1, steps + 1):
        lead_s = step * request.step_seconds
        pred_time = (base_time + timedelta(seconds=lead_s)).isoformat()
        for pos in request.positions:
            anchor = latest_by_pos.get(pos, 10.0)
            # Gentle deterministic decay/trend curve for stub testing
            predicted_depth = round(max(0.0, anchor + 0.04 * step), 3)
            uncertainty = round(0.25 + 0.05 * step, 3)
            predictions.append(
                {
                    "position": pos,
                    "lead_time_seconds": lead_s,
                    "predicted_timestamp": pred_time,
                    "predicted_water_depth_cm": predicted_depth,
                    "lower_bound_95_cm": round(max(0.0, predicted_depth - uncertainty), 3),
                    "upper_bound_95_cm": round(predicted_depth + uncertainty, 3),
                    "is_stub_prediction": True,
                }
            )

    input_window = {
        "observations_used": len(recent_readings),
        "positions": request.positions,
        "anchor_depths_cm": latest_by_pos,
        "reference_timestamp": base_time.isoformat(),
    }

    metrics = {
        "adapter_mode": "stub",
        "is_operational_model": False,
        "engine_notice": FORECAST_STUB_NOTICE,
        "horizon_seconds": request.horizon_seconds,
        "step_seconds": request.step_seconds,
        "estimated_rmse_cm": 0.42,
        "estimated_mae_cm": 0.31,
        "confidence_level": 0.95,
    }

    return input_window, predictions, metrics
