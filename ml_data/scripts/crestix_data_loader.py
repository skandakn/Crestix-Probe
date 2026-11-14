#!/usr/bin/env python3
"""
CrestixDataLoader — Reusable Data-Loading & Preprocessing Interface
Crestix Probe | LarNO UKEA 8m/5min Urban Flood Forecasting
Person 1: Dataset Inspection, Preprocessing Design & Common Dataset Specification

Provides a unified, reproducible data loading and feature engineering interface
for all three models:
  - Linear Regression (sklearn)
  - Random Forest     (sklearn)
  - XGBoost           (xgboost)

All models MUST use the same:
  - Spatial crop:      rows [12:44], cols [32:64]  → 32×32 grid
  - Temporal steps:    36 × 5-minute steps (3h total)
  - Forecast horizon:  Δt = +1 step = +5 minutes
  - Feature schema:    11 canonical features (see FEATURE_SCHEMA below)
  - Target variable:   h(t+1) [water depth in metres]
  - Event split:       6 train / 2 val / 12 test (from split_manifest.json)
  - Normalization:     Z-score, fit on training events only
"""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np

# ---------------------------------------------------------------------------
# Public constants — shared by all three model repos
# ---------------------------------------------------------------------------

DATASET_VERSION = "1.0.0"

#: Canonical spatial crop indices (inclusive start, exclusive end)
CROP_ROW_START: int = 12
CROP_ROW_END:   int = 44
CROP_COL_START: int = 32
CROP_COL_END:   int = 64
CROP_HEIGHT:    int = 32   # CROP_ROW_END - CROP_ROW_START
CROP_WIDTH:     int = 32   # CROP_COL_END - CROP_COL_START
SPATIAL_RESOLUTION_M: float = 8.0  # metres per grid cell

#: Temporal specification
NUM_TIMESTEPS:         int   = 36    # time steps per event
TIMESTEP_INTERVAL_MIN: float = 5.0  # minutes between outputs
TIMESTEP_INTERVAL_S:   float = 300.0
EVENT_DURATION_H:      float = 3.0

#: Forecast horizon — all three models predict one step ahead
FORECAST_HORIZON_STEPS: int   = 1   # predict h at t+1
FORECAST_HORIZON_MIN:   float = 5.0  # = 5 minutes

#: Minimum lag required (determines usable timesteps: t=2 … t=T-2)
MIN_LAG: int = 2  # we use lags t-1 and t-2

#: Wet-cell flood threshold for CSI evaluation
FLOOD_THRESHOLDS_M: Tuple[float, ...] = (0.05, 0.15, 0.30)

#: Ordered canonical feature names (DO NOT REORDER — breaks cross-model alignment)
FEATURE_SCHEMA: Tuple[str, ...] = (
    "dem_elevation_norm",    # F01 — static terrain elevation (z-scored)
    "slope_magnitude",       # F02 — terrain slope |∇z| (m/m, not normalised)
    "curvature",             # F03 — Laplacian ∇²z (m/m², signed, not normalised)
    "grid_row_norm",         # F04 — normalised grid row   ∈ [0, 1]
    "grid_col_norm",         # F05 — normalised grid col   ∈ [0, 1]
    "rain_t0_norm",          # F06 — rainfall at t   (z-scored, mm/5min)
    "rain_t1_norm",          # F07 — rainfall at t-1 (z-scored, mm/5min)
    "rain_t2_norm",          # F08 — rainfall at t-2 (z-scored, mm/5min)
    "rain_cumsum_norm",      # F09 — cumulative rainfall 0…t (z-scored)
    "h_t0_norm",             # F10 — water depth at t   (z-scored, m)
    "h_t1_norm",             # F11 — water depth at t-1 (z-scored, m)
)
NUM_FEATURES: int = len(FEATURE_SCHEMA)   # = 11

TARGET_NAME: str = "h_next_norm"   # h(t+1) in z-scored metres

#: Normalization constants — computed strictly on the 6 training events,
#: 32×32 crop. Must NOT be recomputed on val/test data.
NORMALIZATION_STATS: Dict[str, Dict[str, float]] = {
    "dem": {
        "mean": 26.684261,
        "std":  1.847113,
        "min":  21.684074,
        "max":  31.464674,
        "units": "m",
    },
    "rainfall": {
        "mean": 0.607498,
        "std":  0.627756,
        "min":  0.0,
        "max":  3.551322,
        "units": "mm/5min",
    },
    "water_depth": {
        "mean": 0.126487,
        "std":  0.223847,
        "min":  0.0,
        "max":  1.912649,
        "units": "m",
    },
}

#: Official event split (source of truth — mirrors split_manifest.json)
TRAIN_EVENTS: Tuple[str, ...] = (
    "r100y_p0.1_d3h_1",
    "r100y_p0.8_d3h_1",
    "r200y_p0.3_d3h_1",
    "r300y_p0.1_d3h_1",
    "r300y_p0.5_d3h_1",
    "r500y_p0.2_d3h_1",
)
VAL_EVENTS: Tuple[str, ...] = (
    "r100y_p0.5_d3h_1",
    "r200y_p0.7_d3h_1",
)
TEST_EVENTS: Tuple[str, ...] = (
    "r100y_p0.6_d3h_1",
    "r100y_p0.7_d3h_1",
    "r200y_p0.5_d3h_1",
    "r300y_p0.4_d3h_1",
    "r300y_p0.6_d3h_1",
    "r300y_p0.8_d3h_1",
    "r300y_p0.9_d3h_1",
    "r500y_p0.1_d3h_1",
    "r500y_p0.3_d3h_1",
    "r500y_p0.4_d3h_1",
    "r500y_p0.6_d3h_1",
    "r500y_p0.9_d3h_1",
)
ALL_EVENTS: Dict[str, Tuple[str, ...]] = {
    "train": TRAIN_EVENTS,
    "val":   VAL_EVENTS,
    "test":  TEST_EVENTS,
}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _zscore(arr: np.ndarray, mean: float, std: float) -> np.ndarray:
    """Z-score normalisation with numerical safeguard (ε = 1e-7)."""
    return (arr.astype(np.float32) - mean) / (std + 1e-7)


def _crop(arr: np.ndarray) -> np.ndarray:
    """Extract the canonical 32×32 spatial crop from a full (H_full, W_full) or
    (T, H_full, W_full) array."""
    r1, r2 = CROP_ROW_START, CROP_ROW_END
    c1, c2 = CROP_COL_START, CROP_COL_END
    if arr.ndim == 2:
        return arr[r1:r2, c1:c2].astype(np.float32)
    elif arr.ndim == 3:
        return arr[:, r1:r2, c1:c2].astype(np.float32)
    else:
        raise ValueError(f"Unsupported array ndim for crop: {arr.ndim}  shape={arr.shape}")


def _align_rainfall(rain: np.ndarray) -> np.ndarray:
    """Downsample 360-step (30 s) rainfall to 36-step (5 min) cumulative totals.
    If already 36 steps, returned unchanged."""
    if rain.shape[0] == NUM_TIMESTEPS:          # already 36 × H × W
        return rain.astype(np.float32)
    elif rain.shape[0] == 360:                   # 360 × H × W (30-s raw)
        H, W = rain.shape[1], rain.shape[2]
        return rain.reshape(36, 10, H, W).sum(axis=1).astype(np.float32)
    else:
        raise ValueError(f"Unexpected rainfall temporal dimension: {rain.shape[0]}")


def _compute_terrain_features(dem: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """Compute slope magnitude (|∇z|) and curvature (∇²z) from bare-earth DEM.

    Parameters
    ----------
    dem : np.ndarray, shape (H, W), units metres

    Returns
    -------
    slope : np.ndarray, shape (H, W), unit m/m  (dimensionless gradient)
    curvature : np.ndarray, shape (H, W), unit m/m² (Laplacian)
    """
    dx = SPATIAL_RESOLUTION_M
    grad_y, grad_x = np.gradient(dem.astype(np.float64), dx, dx)
    slope = np.sqrt(grad_x**2 + grad_y**2).astype(np.float32)
    d2_x = np.gradient(grad_x, dx, axis=1)
    d2_y = np.gradient(grad_y, dx, axis=0)
    curvature = (d2_x + d2_y).astype(np.float32)
    return slope, curvature


# ---------------------------------------------------------------------------
# Core loading functions
# ---------------------------------------------------------------------------

def load_event_arrays(
    event_dir: str | Path,
    *,
    apply_crop: bool = True,
    align_rainfall: bool = True,
) -> Dict[str, np.ndarray]:
    """Load raw dem / rainfall / h arrays for one event directory.

    Parameters
    ----------
    event_dir : str or Path
        Path to a directory containing dem.npy, rainfall.npy, h.npy.
    apply_crop : bool
        If True (default) apply the canonical [12:44, 32:64] crop.
    align_rainfall : bool
        If True (default) downsample 360-step rainfall to 36-step.

    Returns
    -------
    dict with keys: "dem", "rainfall", "h"
        dem       : float32, (32, 32) if cropped else (H_full, W_full)
        rainfall  : float32, (36, 32, 32) if cropped else (36, H_full, W_full)
        h         : float32, (36, 32, 32) if cropped else (36, H_full, W_full)
    """
    event_dir = Path(event_dir)
    dem  = np.load(event_dir / "dem.npy")
    rain = np.load(event_dir / "rainfall.npy")
    h    = np.load(event_dir / "h.npy")

    if align_rainfall:
        rain = _align_rainfall(rain)
    if apply_crop:
        dem  = _crop(dem)
        rain = _crop(rain)
        h    = _crop(h)

    return {"dem": dem, "rainfall": rain, "h": h}


def build_tabular_features(
    dem: np.ndarray,
    rainfall: np.ndarray,
    h: np.ndarray,
    *,
    normalise: bool = True,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Convert one event's arrays into a tabular (N_samples × 11) feature matrix
    and a 1-D target vector, following the canonical FEATURE_SCHEMA.

    Leakage safeguard
    -----------------
    - Usable time steps: t = MIN_LAG … (T - FORECAST_HORIZON_STEPS - 1)
      i.e. t = 2 … 34  → 33 usable steps per event.
    - Target h(t+1) uses only future information relative to each sample.
    - Normalisation constants are fixed to NORMALIZATION_STATS (training only).

    Parameters
    ----------
    dem       : float32, (32, 32)
    rainfall  : float32, (36, 32, 32)
    h         : float32, (36, 32, 32)
    normalise : bool
        If True (default) apply z-score normalisation using NORMALIZATION_STATS.

    Returns
    -------
    X        : float32, (N, 11)  — feature matrix
    y        : float32, (N,)     — target h(t+1) [normalised if normalise=True]
    timestep_index : int64, (N,) — which timestep t each row comes from
    """
    H, W = dem.shape
    T    = rainfall.shape[0]

    # --- Static terrain features (computed once, tiled across time later) ---
    slope, curvature = _compute_terrain_features(dem)

    rows_norm = (np.arange(H, dtype=np.float32) / float(H - 1))  # (H,)
    cols_norm = (np.arange(W, dtype=np.float32) / float(W - 1))  # (W,)
    row_grid, col_grid = np.meshgrid(rows_norm, cols_norm, indexing="ij")  # (H,W)

    # --- Normalise static DEM ---
    if normalise:
        dem_n = _zscore(dem,  NORMALIZATION_STATS["dem"]["mean"],
                              NORMALIZATION_STATS["dem"]["std"])
    else:
        dem_n = dem.copy()

    # --- Cumulative rainfall (unnormalised; normalise later per-step) ---
    rain_cumsum = rainfall.cumsum(axis=0)   # (T, H, W)

    # --- Normalise rainfall and h arrays ---
    if normalise:
        rain_n    = _zscore(rainfall,   NORMALIZATION_STATS["rainfall"]["mean"],
                                        NORMALIZATION_STATS["rainfall"]["std"])
        cumsum_n  = _zscore(rain_cumsum, NORMALIZATION_STATS["rainfall"]["mean"] * T,
                                         NORMALIZATION_STATS["rainfall"]["std"]  * np.sqrt(T))
        h_n       = _zscore(h,           NORMALIZATION_STATS["water_depth"]["mean"],
                                         NORMALIZATION_STATS["water_depth"]["std"])
    else:
        rain_n   = rainfall
        cumsum_n = rain_cumsum
        h_n      = h

    # --- Build tabular rows for each usable timestep ---
    t_start = MIN_LAG                               # 2
    t_end   = T - FORECAST_HORIZON_STEPS            # 35  (predict t+1 ≤ 35)

    sample_blocks: List[np.ndarray] = []
    target_blocks: List[np.ndarray] = []
    timestep_idx_blocks: List[np.ndarray] = []

    for t in range(t_start, t_end):
        n_pixels = H * W

        # F01 dem_elevation_norm
        f01 = dem_n.flatten()
        # F02 slope_magnitude
        f02 = slope.flatten()
        # F03 curvature
        f03 = curvature.flatten()
        # F04 grid_row_norm
        f04 = row_grid.flatten()
        # F05 grid_col_norm
        f05 = col_grid.flatten()
        # F06 rain_t0_norm
        f06 = rain_n[t].flatten()
        # F07 rain_t1_norm
        f07 = rain_n[t - 1].flatten()
        # F08 rain_t2_norm
        f08 = rain_n[t - 2].flatten()
        # F09 rain_cumsum_norm
        f09 = cumsum_n[t].flatten()
        # F10 h_t0_norm
        f10 = h_n[t].flatten()
        # F11 h_t1_norm
        f11 = h_n[t - 1].flatten()

        X_t = np.column_stack([f01, f02, f03, f04, f05,
                                f06, f07, f08, f09,
                                f10, f11]).astype(np.float32)   # (H*W, 11)
        y_t = h_n[t + FORECAST_HORIZON_STEPS].flatten()         # (H*W,)

        sample_blocks.append(X_t)
        target_blocks.append(y_t)
        timestep_idx_blocks.append(np.full(n_pixels, t, dtype=np.int64))

    X           = np.concatenate(sample_blocks,     axis=0)  # (N, 11)
    y           = np.concatenate(target_blocks,     axis=0)  # (N,)
    t_idx       = np.concatenate(timestep_idx_blocks, axis=0) # (N,)

    return X, y, t_idx


# ---------------------------------------------------------------------------
# High-level dataset builder
# ---------------------------------------------------------------------------

class CrestixDataLoader:
    """Unified dataset loader for all three Crestix Probe ML models.

    Usage
    -----
    >>> loader = CrestixDataLoader(data_root="/path/to/processed_32x32_crops")
    >>> X_train, y_train = loader.get_split("train")
    >>> X_val,   y_val   = loader.get_split("val")
    >>> X_test,  y_test  = loader.get_split("test")
    >>> # Inverse-transform predictions back to metres:
    >>> y_pred_m = loader.inverse_transform_h(y_pred_norm)

    Parameters
    ----------
    data_root : str or Path
        Root directory containing train/, val/, test/ sub-directories,
        each holding one sub-directory per event named by event_id.
        Layout::

            data_root/
            ├── train/
            │   ├── r100y_p0.1_d3h_1/
            │   │   ├── dem.npy
            │   │   ├── rainfall.npy
            │   │   └── h.npy
            │   └── ...
            ├── val/
            └── test/

        If fixture_mode=True, a single event directory is accepted.

    fixture_mode : bool
        If True, treat data_root as a single event directory
        (useful for unit tests with ml_data/fixtures/sample_event).
    normalise : bool
        Apply z-score normalisation (default True).
    verbose : bool
        Print progress messages (default True).
    """

    def __init__(
        self,
        data_root: str | Path,
        *,
        fixture_mode: bool = False,
        normalise: bool = True,
        verbose: bool = True,
    ) -> None:
        self.data_root    = Path(data_root)
        self.fixture_mode = fixture_mode
        self.normalise    = normalise
        self.verbose      = verbose
        self._cache: Dict[str, Tuple[np.ndarray, np.ndarray]] = {}

    # ------------------------------------------------------------------
    def _log(self, msg: str) -> None:
        if self.verbose:
            print(f"[CrestixDataLoader] {msg}")

    # ------------------------------------------------------------------
    def _event_dir(self, split: str, event_id: str) -> Path:
        if self.fixture_mode:
            return self.data_root
        return self.data_root / split / event_id

    # ------------------------------------------------------------------
    def get_split(
        self,
        split: str,
        *,
        event_ids: Optional[List[str]] = None,
        force_reload: bool = False,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Load and return (X, y) for a named split.

        Parameters
        ----------
        split : str
            One of "train", "val", "test".
        event_ids : list of str, optional
            Subset of events to include; defaults to all in the split.
        force_reload : bool
            Bypass cache (default False).

        Returns
        -------
        X : float32, (N, 11)
        y : float32, (N,)
        """
        if split not in ALL_EVENTS:
            raise ValueError(f"split must be one of {list(ALL_EVENTS.keys())}, got '{split}'")

        cache_key = f"{split}_{'_'.join(event_ids or [])}"
        if not force_reload and cache_key in self._cache:
            self._log(f"Returning cached '{split}' split ({self._cache[cache_key][0].shape[0]:,} rows).")
            return self._cache[cache_key]

        events = list(event_ids or ALL_EVENTS[split])
        X_parts, y_parts = [], []

        for event_id in events:
            ev_dir = self._event_dir(split, event_id)
            if not ev_dir.exists():
                raise FileNotFoundError(
                    f"Event directory not found: {ev_dir}\n"
                    f"Download processed arrays from Google Drive → Crestix Probe Shared/ml_data/processed_32x32_crops/"
                )
            self._log(f"Loading event '{event_id}' ({split}) …")
            arrs = load_event_arrays(ev_dir)
            X, y, _ = build_tabular_features(
                arrs["dem"], arrs["rainfall"], arrs["h"],
                normalise=self.normalise,
            )
            X_parts.append(X)
            y_parts.append(y)

        X_all = np.concatenate(X_parts, axis=0)
        y_all = np.concatenate(y_parts, axis=0)
        self._log(
            f"Split '{split}': {len(events)} events, {X_all.shape[0]:,} samples, "
            f"{X_all.shape[1]} features, {np.isnan(X_all).sum()} NaNs."
        )
        self._cache[cache_key] = (X_all, y_all)
        return X_all, y_all

    # ------------------------------------------------------------------
    def get_fixture(self, fixture_dir: Optional[str | Path] = None) -> Tuple[np.ndarray, np.ndarray]:
        """Load the canonical sample fixture for unit tests.

        The fixture arrays are **already cropped** to (32,32) / (36,32,32)
        so crop is skipped (apply_crop=False).

        Parameters
        ----------
        fixture_dir : str or Path, optional
            Defaults to ml_data/fixtures/sample_event relative to this file.

        Returns
        -------
        X : float32, (N, 11)
        y : float32, (N,)
        """
        if fixture_dir is None:
            fixture_dir = Path(__file__).parent.parent / "fixtures" / "sample_event"
        # Fixture is pre-cropped; skip spatial crop to avoid slicing empty arrays
        arrs = load_event_arrays(fixture_dir, apply_crop=False)
        return build_tabular_features(
            arrs["dem"], arrs["rainfall"], arrs["h"],
            normalise=self.normalise,
        )[:2]

    # ------------------------------------------------------------------
    @staticmethod
    def inverse_transform_h(y_norm: np.ndarray) -> np.ndarray:
        """Convert normalised water depth predictions back to metres.

        Parameters
        ----------
        y_norm : array-like
            Normalised water depth (z-scored with training statistics).

        Returns
        -------
        y_m : float32 ndarray, metres
        """
        s = NORMALIZATION_STATS["water_depth"]
        return (np.asarray(y_norm, dtype=np.float64) * (s["std"] + 1e-7) + s["mean"]).astype(np.float32)

    # ------------------------------------------------------------------
    @staticmethod
    def feature_schema() -> List[str]:
        """Return the ordered list of feature names (length 11)."""
        return list(FEATURE_SCHEMA)

    # ------------------------------------------------------------------
    @staticmethod
    def normalization_stats() -> Dict[str, Dict[str, float]]:
        """Return a copy of the fixed training-set normalization constants."""
        return {k: dict(v) for k, v in NORMALIZATION_STATS.items()}

    # ------------------------------------------------------------------
    @staticmethod
    def verify_no_leakage() -> bool:
        """Assert that train / val / test event sets are pairwise disjoint.

        Raises AssertionError if any overlap is found.
        Returns True on success.
        """
        train = set(TRAIN_EVENTS)
        val   = set(VAL_EVENTS)
        test  = set(TEST_EVENTS)
        assert train.isdisjoint(val),  f"LEAKAGE: Train ∩ Val = {train & val}"
        assert train.isdisjoint(test), f"LEAKAGE: Train ∩ Test = {train & test}"
        assert val.isdisjoint(test),   f"LEAKAGE: Val ∩ Test = {val & test}"
        total = len(train | val | test)
        assert total == 20, f"Expected 20 unique events, found {total}"
        return True

    # ------------------------------------------------------------------
    def __repr__(self) -> str:
        return (
            f"CrestixDataLoader("
            f"data_root='{self.data_root}', "
            f"fixture_mode={self.fixture_mode}, "
            f"normalise={self.normalise})"
        )


# ---------------------------------------------------------------------------
# Convenience function for quick access
# ---------------------------------------------------------------------------

def load_fixture_tabular(
    fixture_dir: Optional[str | Path] = None,
    *,
    normalise: bool = True,
) -> Tuple[np.ndarray, np.ndarray]:
    """One-call helper: load sample fixture and return (X, y) tabular arrays.

    The fixture arrays are already cropped to (32,32) / (36,32,32).
    Primarily used for smoke-testing model training pipelines without
    downloading the full dataset.

    Parameters
    ----------
    fixture_dir : str or Path, optional
        Defaults to ml_data/fixtures/sample_event.
    normalise : bool
        Apply z-score normalisation (default True).

    Returns
    -------
    X : float32, (N, 11)  — canonical features
    y : float32, (N,)     — h(t+1) target [normalised metres]
    """
    if fixture_dir is None:
        fixture_dir = Path(__file__).parent.parent / "fixtures" / "sample_event"
    # apply_crop=False because fixture is pre-cropped to 32×32
    arrs = load_event_arrays(fixture_dir, apply_crop=False)
    X, y, _ = build_tabular_features(
        arrs["dem"], arrs["rainfall"], arrs["h"],
        normalise=normalise,
    )
    return X, y


# ---------------------------------------------------------------------------
# CLI self-test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=" * 60)
    print("CrestixDataLoader — Self-test")
    print("=" * 60)

    # 1. Leakage check
    CrestixDataLoader.verify_no_leakage()
    print("✓ No data leakage across train / val / test splits.")

    # 2. Feature schema
    schema = CrestixDataLoader.feature_schema()
    print(f"✓ Feature schema ({len(schema)} features):")
    for i, name in enumerate(schema, 1):
        print(f"    F{i:02d}: {name}")

    # 3. Load fixture
    X, y = load_fixture_tabular()
    print(f"\n✓ Fixture loaded: X={X.shape}  y={y.shape}")
    print(f"  X dtype={X.dtype}  NaNs={np.isnan(X).sum()}  Infs={np.isinf(X).sum()}")
    print(f"  y dtype={y.dtype}  NaNs={np.isnan(y).sum()}  min={y.min():.4f}  max={y.max():.4f}")

    # 4. Per-feature summary
    print(f"\n  {'Feature':<24}  {'Mean':>8}  {'Std':>8}  {'Min':>8}  {'Max':>8}")
    print(f"  {'-'*60}")
    for i, name in enumerate(schema):
        col = X[:, i]
        print(f"  {name:<24}  {col.mean():>8.4f}  {col.std():>8.4f}  {col.min():>8.4f}  {col.max():>8.4f}")

    # 5. Verify no leakage in returned features
    # h_t0 and h_t1 must NOT be from t+1 or beyond
    # (enforced by loop construction; sanity-check shape)
    expected_n = (NUM_TIMESTEPS - FORECAST_HORIZON_STEPS - MIN_LAG) * CROP_HEIGHT * CROP_WIDTH
    assert X.shape[0] == expected_n, \
        f"Expected {expected_n} rows, got {X.shape[0]}"
    print(f"\n✓ Row count matches expected {expected_n:,} = "
          f"(T={NUM_TIMESTEPS} - lag={MIN_LAG} - horizon={FORECAST_HORIZON_STEPS}) × {CROP_HEIGHT}×{CROP_WIDTH}")

    print("\n✅ All self-tests passed.")
