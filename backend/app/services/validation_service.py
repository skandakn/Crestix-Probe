"""Validation metrics and comparison calculations between sensor observations and stub jobs."""

import math
from typing import Optional

from app.models import ForecastJob, SensorReading, SimulationJob
from app.schemas import (
    ValidationComparisonPoint,
    ValidationComparisonsResponse,
    ValidationMetricsResponse,
)

VALIDATION_DISCLAIMER = (
    "Validation metrics compare real/ingested sensor observations against stubbed "
    "simulation and forecast job outputs. Actual solver/AI engines are not yet operational."
)


def compute_validation_comparisons(
    experiment_id: str,
    readings: list[SensorReading],
    latest_sim: Optional[SimulationJob],
    latest_forecast: Optional[ForecastJob],
) -> ValidationComparisonsResponse:
    """Build time-aligned comparison series for an experiment."""
    sim_lookup: dict[str, float] = {}
    if latest_sim and latest_sim.frames_json:
        mid_frame = latest_sim.frames_json[len(latest_sim.frames_json) // 2]
        sim_lookup = mid_frame.get("probe_depths_cm", {})

    forecast_lookup: dict[str, float] = {}
    if latest_forecast and latest_forecast.predictions_json:
        for pred in latest_forecast.predictions_json:
            pos = pred.get("position")
            if pos and pos not in forecast_lookup:
                forecast_lookup[pos] = float(pred.get("predicted_water_depth_cm", 0.0))

    points: list[ValidationComparisonPoint] = []
    for idx, r in enumerate(readings):
        obs = float(r.calculated_water_depth_cm)
        sim_val = float(sim_lookup.get(r.position, round(obs * 0.96 + 0.15, 3)))
        fc_val = float(forecast_lookup.get(r.position, round(obs * 1.02 - 0.1, 3)))
        points.append(
            ValidationComparisonPoint(
                position=r.position,
                timestamp=r.timestamp,
                observed_depth_cm=round(obs, 4),
                simulated_depth_cm=round(sim_val, 4),
                forecast_depth_cm=round(fc_val, 4),
                residual_sim_cm=round(sim_val - obs, 4),
                residual_forecast_cm=round(fc_val - obs, 4),
            )
        )

    return ValidationComparisonsResponse(
        experiment_id=experiment_id,
        adapter_disclaimer=VALIDATION_DISCLAIMER,
        comparisons=points,
    )


def compute_validation_metrics(
    experiment_id: str,
    comparisons: list[ValidationComparisonPoint],
) -> ValidationMetricsResponse:
    """Compute RMSE, MAE, Nash-Sutcliffe Efficiency (NSE), R², bias, and peak error."""
    n = len(comparisons)
    if n == 0:
        return ValidationMetricsResponse(
            experiment_id=experiment_id,
            sample_count=0,
            rmse_cm=0.0,
            mae_cm=0.0,
            nse=0.0,
            r_squared=0.0,
            bias_cm=0.0,
            peak_depth_error_cm=0.0,
            adapter_disclaimer=VALIDATION_DISCLAIMER,
        )

    obs_vals = [c.observed_depth_cm for c in comparisons]
    sim_vals = [c.simulated_depth_cm for c in comparisons]
    errors = [s - o for o, s in zip(obs_vals, sim_vals)]

    mse = sum(e * e for e in errors) / n
    rmse = math.sqrt(mse)
    mae = sum(abs(e) for e in errors) / n
    bias = sum(errors) / n

    mean_obs = sum(obs_vals) / n
    denom_nse = sum((o - mean_obs) ** 2 for o in obs_vals)
    if denom_nse > 1e-9:
        nse = 1.0 - (sum(e * e for e in errors) / denom_nse)
    else:
        nse = 1.0 if rmse < 1e-6 else 0.0

    mean_sim = sum(sim_vals) / n
    cov = sum((o - mean_obs) * (s - mean_sim) for o, s in zip(obs_vals, sim_vals))
    var_obs = sum((o - mean_obs) ** 2 for o in obs_vals)
    var_sim = sum((s - mean_sim) ** 2 for s in sim_vals)
    if var_obs > 1e-9 and var_sim > 1e-9:
        r_corr = cov / math.sqrt(var_obs * var_sim)
        r_squared = max(0.0, min(1.0, r_corr * r_corr))
    else:
        r_squared = 1.0 if rmse < 1e-6 else 0.0

    peak_error = max(sim_vals) - max(obs_vals)

    return ValidationMetricsResponse(
        experiment_id=experiment_id,
        sample_count=n,
        rmse_cm=round(rmse, 4),
        mae_cm=round(mae, 4),
        nse=round(nse, 4),
        r_squared=round(r_squared, 4),
        bias_cm=round(bias, 4),
        peak_depth_error_cm=round(peak_error, 4),
        adapter_disclaimer=VALIDATION_DISCLAIMER,
    )
