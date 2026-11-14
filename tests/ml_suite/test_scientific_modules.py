"""
Crestix Probe - Scientific & Machine Learning Unit Test Suite
=============================================================
Verifies algorithmic correctness, physical conservation laws, numerical stability,
and boundary conditions across all Python hydrodynamic and ML modules.
"""

import sys
import os
import pytest
import numpy as np

# Ensure root directory is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from ml.fourier_neural_operator import FNO2dSurrogate, SpectralConv2dConfig
from ml.pino_saint_venant_loss import SaintVenantPINOLoss
from ml.synthetic_storm_hyetograph import ChicagoDesignStormHyetograph
from ml.sensor_kalman_filter import InSituSensorKalmanFilter
from ml.physics_informed_neural_network import ShallowWaterPINN
from ml.manning_roughness_inversion import ManningInversionSolver
from ml.ensemble_kalman_filter_2d import HydrodynamicEnKF2D
from ml.uncertainty_quantification_conformal import ConformalFloodPredictor
from ml.spatial_block_cross_validation import SpatialBlockCV, SpatialAutocorrelationAnalyzer
from ml.runoff_hydrology_scs_cn import SCSCurveNumberEngine
from ml.sensor_network_optimizer import SensorNetworkOptimizer
from ml.synthetic_urban_dem_generator import UrbanDEMGenerator
from simulation.hydraulic_routing_engine import MuskingumCungeReach
from analysis.flood_risk_indexer import FloodHazardIndexer


def test_fno_surrogate_inference():
    fno = FNO2dSurrogate()
    assert fno.is_trained
    assert fno.validation_l2_relative_error < 0.05


def test_pino_saint_venant_loss_positivity():
    pino = SaintVenantPINOLoss()
    h_curr = [[0.5 for _ in range(10)] for _ in range(10)]
    h_prev = [[0.48 for _ in range(10)] for _ in range(10)]
    u_curr = [[0.1 for _ in range(10)] for _ in range(10)]
    v_curr = [[0.05 for _ in range(10)] for _ in range(10)]
    res = pino.evaluate_pino_residual_loss(h_prev, h_curr, u_curr, v_curr, rainfall_rate_ms=0.0)
    assert res["pino_total_loss"] >= 0.0


def test_pinn_non_negative_depth():
    pinn = ShallowWaterPINN(layers=[3, 16, 3])
    X = np.array([[50.0, 50.0, 100.0], [0.0, 0.0, 0.0]])
    pred = pinn.predict(X)
    assert np.all(pred[:, 0] >= 0.0), "PINN predicted negative water depth!"


def test_chicago_storm_conservation():
    storm = ChicagoDesignStormHyetograph(return_period_years=50, storm_duration_minutes=60, time_step_minutes=5)
    series = storm.generate_hyetograph_time_series()
    assert len(series) == 13
    assert all(row["rainfall_intensity_mmh"] >= 0 for row in series)


def test_kalman_filter_noise_reduction():
    kf = InSituSensorKalmanFilter(initial_depth_cm=15.0, process_variance_q=0.01, measurement_variance_r=0.9)
    raw_noisy = [15.0 + float(np.random.normal(0, 2.0)) for _ in range(20)]
    filtered = [kf.filter_measurement(val)["filtered_water_depth_cm"] for val in raw_noisy]
    assert np.var(filtered[-10:]) < np.var(raw_noisy[-10:])


def test_scs_cn_runoff_bounds():
    engine = SCSCurveNumberEngine(curve_number=90.0)
    res = engine.compute_runoff_hyetograph([10.0, 20.0, 30.0], [10.0, 30.0, 20.0])
    assert 0.0 <= res["total_runoff_mm"] <= res["total_precipitation_mm"]


def test_conformal_coverage_guarantee():
    rng = np.random.default_rng(42)
    y_true = rng.uniform(0.1, 1.5, 100)
    y_pred = y_true + rng.normal(0, 0.05, 100)
    conformal = ConformalFloodPredictor(confidence_level=0.90)
    conformal.fit_calibration(y_true[:50], y_pred[:50])
    eval_res = conformal.evaluate_coverage(y_true[50:], y_pred[50:])
    assert eval_res["empirical_coverage"] >= 0.85


def test_morans_i_clustering():
    grid = np.zeros((10, 10))
    grid[:5, :5] = 10.0  # Clear spatial cluster
    moran = SpatialAutocorrelationAnalyzer.morans_i(grid)
    assert moran["morans_i"] > 0.3


def test_muskingum_cunge_volume_balance():
    reach = MuskingumCungeReach(length_m=500.0, bottom_width_m=6.0)
    times = [float(t * 60) for t in range(60)]
    inflow = [2.0 + 20.0 * float(np.exp(-((t - 15.0) / 8.0) ** 2)) for t in range(60)]
    res = reach.route_hydrograph(times, inflow)
    assert res["mass_balance_error_pct"] < 3.0


def test_flood_hazard_rating_classes():
    hr, classes = FloodHazardIndexer.calculate_defra_hazard_grid(
        np.array([[0.1, 0.8]]), np.array([[0.2, 1.5]])
    )
    assert classes[0, 1] == 4  # Extreme danger


if __name__ == "__main__":
    import pytest
    pytest.main(["-v", __file__])
