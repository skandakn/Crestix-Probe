"""
Extended Tests — CrestixDataLoader & Common Feature Schema
Crestix Probe | LarNO UKEA 8m/5min Flood Forecasting
Person 1: Dataset Inspection & Preprocessing Design

Tests that ALL THREE model teams (Linear Regression, Random Forest, XGBoost)
can depend on to verify their data loading pipeline is correctly wired.
"""

import sys
import os
import numpy as np
import pytest

# Make scripts importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from crestix_data_loader import (
    CrestixDataLoader,
    load_fixture_tabular,
    build_tabular_features,
    load_event_arrays,
    FEATURE_SCHEMA,
    NUM_FEATURES,
    TARGET_NAME,
    NORMALIZATION_STATS,
    TRAIN_EVENTS,
    VAL_EVENTS,
    TEST_EVENTS,
    NUM_TIMESTEPS,
    MIN_LAG,
    FORECAST_HORIZON_STEPS,
    CROP_HEIGHT,
    CROP_WIDTH,
    FLOOD_THRESHOLDS_M,
)

FIXTURE_DIR = os.path.join(os.path.dirname(__file__), "..", "fixtures", "sample_event")


# ---------------------------------------------------------------------------
# Schema and constant tests
# ---------------------------------------------------------------------------

class TestFeatureSchema:
    """Verifies canonical feature schema is immutable and complete."""

    def test_feature_count(self):
        assert NUM_FEATURES == 11, f"Expected 11 features, got {NUM_FEATURES}"

    def test_feature_names_ordered(self):
        expected = [
            "dem_elevation_norm",
            "slope_magnitude",
            "curvature",
            "grid_row_norm",
            "grid_col_norm",
            "rain_t0_norm",
            "rain_t1_norm",
            "rain_t2_norm",
            "rain_cumsum_norm",
            "h_t0_norm",
            "h_t1_norm",
        ]
        assert list(FEATURE_SCHEMA) == expected, \
            f"Feature schema mismatch: {list(FEATURE_SCHEMA)}"

    def test_target_name(self):
        assert TARGET_NAME == "h_next_norm"

    def test_flood_thresholds(self):
        assert 0.05 in FLOOD_THRESHOLDS_M
        assert 0.15 in FLOOD_THRESHOLDS_M
        assert 0.30 in FLOOD_THRESHOLDS_M

    def test_forecast_horizon_is_one_step(self):
        assert FORECAST_HORIZON_STEPS == 1, "All models must share Δt = +1 step = +5 min"


# ---------------------------------------------------------------------------
# Normalization constant tests
# ---------------------------------------------------------------------------

class TestNormalizationConstants:
    """Verifies that normalization stats are physically plausible and training-only."""

    def test_dem_stats_plausible(self):
        s = NORMALIZATION_STATS["dem"]
        assert 20.0 < s["mean"] < 35.0, "DEM mean outside expected UKEA elevation range"
        assert s["std"] > 0
        assert s["min"] > 0
        assert s["max"] > s["min"]
        assert s["units"] == "m"

    def test_rainfall_stats_plausible(self):
        s = NORMALIZATION_STATS["rainfall"]
        assert 0.0 < s["mean"] < 5.0
        assert s["std"] > 0
        assert s["min"] == 0.0
        assert s["max"] > s["mean"]
        assert s["units"] == "mm/5min"

    def test_water_depth_stats_plausible(self):
        s = NORMALIZATION_STATS["water_depth"]
        assert 0.0 < s["mean"] < 1.0
        assert s["std"] > 0
        assert s["min"] == 0.0
        assert s["max"] > s["mean"]
        assert s["units"] == "m"

    def test_inverse_transform_roundtrip(self):
        """Inverse transform of normalised values must recover original metres."""
        y_m = np.array([0.0, 0.1, 0.5, 1.0, 1.9], dtype=np.float32)
        s = NORMALIZATION_STATS["water_depth"]
        y_norm = (y_m - s["mean"]) / (s["std"] + 1e-7)
        y_recovered = CrestixDataLoader.inverse_transform_h(y_norm)
        np.testing.assert_allclose(y_recovered, y_m, atol=1e-4,
                                   err_msg="Inverse transform failed roundtrip")


# ---------------------------------------------------------------------------
# Data leakage tests
# ---------------------------------------------------------------------------

class TestNoDataLeakage:
    """Verifies absolute event-level partition disjointness — the most critical
    invariant for a fair model comparison."""

    def test_loader_verify_no_leakage_passes(self):
        assert CrestixDataLoader.verify_no_leakage() is True

    def test_train_val_disjoint(self):
        assert set(TRAIN_EVENTS).isdisjoint(set(VAL_EVENTS)), \
            f"LEAKAGE: Train ∩ Val = {set(TRAIN_EVENTS) & set(VAL_EVENTS)}"

    def test_train_test_disjoint(self):
        assert set(TRAIN_EVENTS).isdisjoint(set(TEST_EVENTS)), \
            f"LEAKAGE: Train ∩ Test = {set(TRAIN_EVENTS) & set(TEST_EVENTS)}"

    def test_val_test_disjoint(self):
        assert set(VAL_EVENTS).isdisjoint(set(TEST_EVENTS)), \
            f"LEAKAGE: Val ∩ Test = {set(VAL_EVENTS) & set(TEST_EVENTS)}"

    def test_total_event_count(self):
        total = len(set(TRAIN_EVENTS) | set(VAL_EVENTS) | set(TEST_EVENTS))
        assert total == 20, f"Expected 20 unique events total, found {total}"

    def test_split_counts(self):
        assert len(TRAIN_EVENTS) == 6
        assert len(VAL_EVENTS) == 2
        assert len(TEST_EVENTS) == 12

    def test_no_future_data_in_features(self):
        """Feature vector at timestep t must NOT contain h(t+1) or beyond."""
        arrs = load_event_arrays(FIXTURE_DIR, apply_crop=False)
        X, y, t_idx = build_tabular_features(
            arrs["dem"], arrs["rainfall"], arrs["h"], normalise=False
        )
        h = arrs["h"]
        # F10 = h_t0 (index 9), F11 = h_t1 (index 10)
        # Verify that for each row, its h_t0 feature == h[t, pixel]
        # and its target == h[t+1, pixel]
        for t_val in [2, 5, 10, 20, 33]:
            mask = t_idx == t_val
            if not mask.any():
                continue
            X_t = X[mask]
            y_t = y[mask]
            h_t  = h[t_val].flatten()
            h_t1 = h[t_val + 1].flatten()
            # F10 (index 9) = h at t (un-normalised mode)
            np.testing.assert_allclose(X_t[:, 9], h_t, atol=1e-5,
                err_msg=f"h_t0 feature mismatch at t={t_val}")
            # target must be h(t+1)
            np.testing.assert_allclose(y_t, h_t1, atol=1e-5,
                err_msg=f"Target mismatch at t={t_val}")


# ---------------------------------------------------------------------------
# Tabular output shape and dtype tests
# ---------------------------------------------------------------------------

class TestTabularOutputs:
    """Validates that build_tabular_features produces contract-conforming arrays."""

    @pytest.fixture(scope="module")
    def fixture_arrays(self):
        return load_event_arrays(FIXTURE_DIR, apply_crop=False)

    @pytest.fixture(scope="module")
    def Xy(self, fixture_arrays):
        arrs = fixture_arrays
        X, y, t_idx = build_tabular_features(
            arrs["dem"], arrs["rainfall"], arrs["h"], normalise=True
        )
        return X, y, t_idx

    def test_feature_matrix_shape(self, Xy):
        X, y, t_idx = Xy
        expected_rows = (NUM_TIMESTEPS - FORECAST_HORIZON_STEPS - MIN_LAG) * CROP_HEIGHT * CROP_WIDTH
        assert X.shape == (expected_rows, NUM_FEATURES), \
            f"Expected X shape ({expected_rows}, {NUM_FEATURES}), got {X.shape}"

    def test_target_shape(self, Xy):
        X, y, t_idx = Xy
        assert y.shape == (X.shape[0],)

    def test_dtypes_float32(self, Xy):
        X, y, _ = Xy
        assert X.dtype == np.float32, f"X dtype must be float32, got {X.dtype}"
        assert y.dtype == np.float32, f"y dtype must be float32, got {y.dtype}"

    def test_no_nans_or_infs(self, Xy):
        X, y, _ = Xy
        assert np.isnan(X).sum() == 0, "Feature matrix contains NaNs"
        assert np.isinf(X).sum() == 0, "Feature matrix contains Infs"
        assert np.isnan(y).sum() == 0, "Target vector contains NaNs"
        assert np.isinf(y).sum() == 0, "Target vector contains Infs"

    def test_spatial_coord_range(self, Xy):
        X, _, _ = Xy
        # F04 grid_row_norm ∈ [0,1], F05 grid_col_norm ∈ [0,1]
        assert X[:, 3].min() >= 0.0 and X[:, 3].max() <= 1.0, \
            "grid_row_norm out of [0,1] range"
        assert X[:, 4].min() >= 0.0 and X[:, 4].max() <= 1.0, \
            "grid_col_norm out of [0,1] range"

    def test_timestep_index_range(self, Xy):
        _, _, t_idx = Xy
        assert t_idx.min() == MIN_LAG, f"Min timestep must be {MIN_LAG}"
        assert t_idx.max() == NUM_TIMESTEPS - FORECAST_HORIZON_STEPS - 1, \
            f"Max timestep must be {NUM_TIMESTEPS - FORECAST_HORIZON_STEPS - 1}"

    def test_non_normalised_rainfall_non_negative(self, fixture_arrays):
        arrs = fixture_arrays
        X_raw, _, _ = build_tabular_features(
            arrs["dem"], arrs["rainfall"], arrs["h"], normalise=False
        )
        # F06 rain_t0 (index 5), F07 rain_t1 (index 6), F08 rain_t2 (index 7)
        for fi in [5, 6, 7]:
            assert X_raw[:, fi].min() >= 0.0, \
                f"Rainfall feature index {fi} has negative values"

    def test_non_normalised_water_depth_non_negative(self, fixture_arrays):
        arrs = fixture_arrays
        X_raw, y_raw, _ = build_tabular_features(
            arrs["dem"], arrs["rainfall"], arrs["h"], normalise=False
        )
        # F10 h_t0 (index 9), F11 h_t1 (index 10)
        assert X_raw[:, 9].min() >= -1e-6, "h_t0 feature has negative depth"
        assert X_raw[:, 10].min() >= -1e-6, "h_t1 feature has negative depth"
        assert y_raw.min() >= -1e-6, "Target h(t+1) has negative depth"


# ---------------------------------------------------------------------------
# CrestixDataLoader fixture mode tests
# ---------------------------------------------------------------------------

class TestCrestixDataLoader:
    """Integration tests for the high-level CrestixDataLoader class."""

    @pytest.fixture(scope="module")
    def loader(self):
        return CrestixDataLoader(FIXTURE_DIR, fixture_mode=True, normalise=True, verbose=False)

    def test_get_fixture_returns_correct_shape(self, loader):
        X, y = loader.get_fixture()
        expected_rows = (NUM_TIMESTEPS - FORECAST_HORIZON_STEPS - MIN_LAG) * CROP_HEIGHT * CROP_WIDTH
        assert X.shape == (expected_rows, NUM_FEATURES)
        assert y.shape == (expected_rows,)

    def test_feature_schema_method(self, loader):
        schema = loader.feature_schema()
        assert isinstance(schema, list)
        assert len(schema) == NUM_FEATURES

    def test_normalization_stats_method(self, loader):
        stats = loader.normalization_stats()
        assert "dem" in stats and "rainfall" in stats and "water_depth" in stats

    def test_load_fixture_tabular_convenience(self):
        X, y = load_fixture_tabular(FIXTURE_DIR)
        assert X.shape[1] == NUM_FEATURES
        assert X.dtype == np.float32
        assert y.dtype == np.float32
        assert np.isfinite(X).all()
        assert np.isfinite(y).all()
