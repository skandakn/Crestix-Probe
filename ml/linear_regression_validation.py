#!/usr/bin/env python3
"""
linear_regression_validation.py
================================
Person 3 — Crestix Probe ML Team
Linear Regression Validation Pipeline

Covers Tasks 1, 7, 8, 9, 10:
  - Load / inspect the LarNO feature pipeline (from fixture or Drive)
  - Build train / validation feature matrices following the XGBoost tabular contract
  - Train OLS, Ridge, and Lasso models with cross-validated regularisation
  - Evaluate MAE, RMSE, R² on validation events only
  - Compare model configurations; never touch test events
  - Flood / non-flood classification at 0.05 m threshold
  - Reproducibility seeds
  - Print recommended configuration

Usage (fixture only, no Drive access needed):
    python ml/linear_regression_validation.py --data-dir ml_data/fixtures/sample_event

Usage (full Drive data):
    python ml/linear_regression_validation.py --data-dir /path/to/processed_32x32_crops
"""

import argparse
import json
import os
import random
import sys
import warnings
from pathlib import Path

import numpy as np
from sklearn.linear_model import Lasso, LinearRegression, Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")

# ── Reproducibility ──────────────────────────────────────────────────────────
RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

# ── Shared constants (from data_dictionary.md) ────────────────────────────────
FLOOD_THRESHOLD_M = 0.05       # Agreed flood/non-flood classification threshold
DEM_MEAN = 26.684261
DEM_STD  = 1.847113
RAIN_MEAN = 0.607498
RAIN_STD  = 0.627756
H_MEAN   = 0.126487
H_STD    = 0.223847

TRAIN_EVENTS = [
    "r100y_p0.1_d3h_1", "r100y_p0.8_d3h_1", "r200y_p0.3_d3h_1",
    "r300y_p0.1_d3h_1", "r300y_p0.5_d3h_1", "r500y_p0.2_d3h_1",
]
VAL_EVENTS = ["r100y_p0.5_d3h_1", "r200y_p0.7_d3h_1"]


# ── Feature Engineering (mirrors XGBoost tabular contract) ────────────────────
def compute_dem_derivatives(dem: np.ndarray):
    """Return slope magnitude and curvature (Laplacian) for a 32×32 DEM."""
    dy, dx = np.gradient(dem, 8.0, 8.0)
    slope = np.sqrt(dx**2 + dy**2)
    curvature = np.gradient(dy, 8.0, axis=0) + np.gradient(dx, 8.0, axis=1)
    return slope.astype(np.float32), curvature.astype(np.float32)


def build_feature_matrix(dem: np.ndarray,
                          rainfall: np.ndarray,
                          h: np.ndarray,
                          event_id: str = "unknown"):
    """
    Build tabular (N_samples × D_features) matrix from one event's arrays.

    Features (11 total, see data_dictionary.md §5.1):
      0  dem_elevation_norm
      1  dem_slope_gradient
      2  dem_curvature
      3  grid_row_norm
      4  grid_col_norm
      5  rain_t0_norm
      6  rain_t1_norm  (lag-1)
      7  rain_t2_norm  (lag-2)
      8  rain_cumsum_norm
      9  water_depth_t0  (lag-1 state)
     10  water_depth_tminus1  (lag-2 state)

    Target: h(t+1) in metres (raw, not normalised).
    """
    H, W = dem.shape          # 32, 32
    T    = rainfall.shape[0]  # 36

    dem_norm = (dem - DEM_MEAN) / DEM_STD
    rain_norm = (rainfall - RAIN_MEAN) / RAIN_STD

    slope, curvature = compute_dem_derivatives(dem)
    rows_idx, cols_idx = np.meshgrid(np.arange(H), np.arange(W), indexing="ij")
    row_norm = rows_idx / (H - 1.0)   # [0, 1]
    col_norm = cols_idx / (W - 1.0)   # [0, 1]

    rain_cumsum = np.cumsum(rain_norm, axis=0)   # (T, H, W)

    rows_X, rows_y = [], []
    # We need t ≥ 2 so we have lag-1 and lag-2; and t+1 ≤ T-1
    for t in range(2, T - 1):
        for r in range(H):
            for c in range(W):
                feat = [
                    dem_norm[r, c],
                    slope[r, c],
                    curvature[r, c],
                    row_norm[r, c],
                    col_norm[r, c],
                    rain_norm[t,     r, c],
                    rain_norm[t - 1, r, c],
                    rain_norm[t - 2, r, c],
                    rain_cumsum[t,   r, c],
                    h[t,     r, c],      # water_depth_t0
                    h[t - 1, r, c],      # water_depth_tminus1
                ]
                rows_X.append(feat)
                rows_y.append(h[t + 1, r, c])

    X = np.array(rows_X, dtype=np.float32)
    y = np.array(rows_y, dtype=np.float32)
    return X, y


# ── Data loading ─────────────────────────────────────────────────────────────
def load_event(base_dir: Path, event_id: str):
    """
    Load dem, rainfall, h arrays for a single event.
    Supports two directory layouts:
      1. flat:        base_dir/{dem,rainfall,h}.npy  (fixture / single event)
      2. event tree:  base_dir/{split}/{event_id}/{dem,rainfall,h}.npy
    """
    # Try event-tree layout first
    for split in ("train", "val"):
        event_dir = base_dir / split / event_id
        if event_dir.exists():
            return _load_npy_trio(event_dir)

    # Try flat layout (fixture — only sample event available)
    if (base_dir / "dem.npy").exists():
        return _load_npy_trio(base_dir)

    raise FileNotFoundError(
        f"Cannot find event '{event_id}' under '{base_dir}'. "
        "Full data must be fetched from Google Drive; fixture contains only "
        "r100y_p0.1_d3h_1 (train). Using fixture for demonstration."
    )


def _load_npy_trio(d: Path):
    dem      = np.load(d / "dem.npy")
    rainfall = np.load(d / "rainfall.npy")
    h        = np.load(d / "h.npy")
    return dem, rainfall, h


def load_split(base_dir: Path, event_ids: list, split_label: str):
    """
    Load and concatenate feature matrices across multiple events.
    Falls back to fixture (single event repeated) when Drive data absent.
    """
    Xs, ys = [], []
    loaded = []
    for eid in event_ids:
        try:
            dem, rain, h = load_event(base_dir, eid)
            X, y = build_feature_matrix(dem, rain, h, eid)
            Xs.append(X)
            ys.append(y)
            loaded.append(eid)
        except FileNotFoundError as e:
            print(f"  [WARN] {e}")

    if not Xs:
        # Fallback: use fixture for demonstration
        print(f"  [INFO] No events loaded for '{split_label}' – using fixture as stand-in.")
        dem, rain, h = _load_npy_trio(base_dir)
        X, y = build_feature_matrix(dem, rain, h, "fixture")
        Xs, ys = [X], [y]
        loaded = ["fixture"]

    print(f"  [INFO] {split_label}: loaded {len(loaded)} event(s) → "
          f"{sum(len(x) for x in Xs):,} samples")
    return np.vstack(Xs), np.concatenate(ys), loaded


# ── Metrics ──────────────────────────────────────────────────────────────────
def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray, label: str = ""):
    mae  = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2   = r2_score(y_true, y_pred)

    # Flood classification metrics
    true_flood = y_true >= FLOOD_THRESHOLD_M
    pred_flood = y_pred >= FLOOD_THRESHOLD_M
    tp = int(np.sum(true_flood & pred_flood))
    fp = int(np.sum(~true_flood & pred_flood))
    fn = int(np.sum(true_flood & ~pred_flood))
    tn = int(np.sum(~true_flood & ~pred_flood))
    csi_denom = tp + fp + fn
    csi  = tp / csi_denom if csi_denom > 0 else float("nan")
    prec = tp / (tp + fp) if (tp + fp) > 0 else float("nan")
    rec  = tp / (tp + fn) if (tp + fn) > 0 else float("nan")

    # Underestimation of high water depths (> 0.3 m)
    high_mask = y_true > 0.3
    under_pct = float(np.nan)
    if high_mask.sum() > 0:
        underest = (y_pred[high_mask] < y_true[high_mask])
        under_pct = 100.0 * underest.sum() / high_mask.sum()

    return {
        "label":        label,
        "mae_m":        round(float(mae),  5),
        "rmse_m":       round(float(rmse), 5),
        "r2":           round(float(r2),   4),
        "csi":          round(float(csi),  4),
        "precision":    round(float(prec), 4),
        "recall":       round(float(rec),  4),
        "tp": tp, "fp": fp, "fn": fn, "tn": tn,
        "underest_high_pct": round(float(under_pct), 2) if not np.isnan(under_pct) else None,
    }


def print_metrics(m: dict):
    print(f"\n  {'Model':<30} {m['label']}")
    print(f"  {'MAE (m)':<30} {m['mae_m']:.5f}")
    print(f"  {'RMSE (m)':<30} {m['rmse_m']:.5f}")
    print(f"  {'R²':<30} {m['r2']:.4f}")
    print(f"  {'CSI (≥0.05 m)':<30} {m['csi']:.4f}")
    print(f"  {'Precision':<30} {m['precision']:.4f}")
    print(f"  {'Recall':<30} {m['recall']:.4f}")
    print(f"  {'TP/FP/FN/TN':<30} {m['tp']}/{m['fp']}/{m['fn']}/{m['tn']}")
    if m["underest_high_pct"] is not None:
        print(f"  {'Underest. >0.3 m (%)':<30} {m['underest_high_pct']:.2f}%")


# ── Model training ───────────────────────────────────────────────────────────
def select_ridge_alpha(X_train, y_train, alphas=(0.001, 0.01, 0.1, 1.0, 10.0, 100.0)):
    """CV on training set only (never val/test)."""
    kf = KFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)
    best_alpha, best_rmse = None, np.inf
    for alpha in alphas:
        rmses = []
        for tr_idx, val_idx in kf.split(X_train):
            pipe = Pipeline([("sc", StandardScaler()),
                             ("ridge", Ridge(alpha=alpha, random_state=RANDOM_SEED))])
            pipe.fit(X_train[tr_idx], y_train[tr_idx])
            pred = pipe.predict(X_train[val_idx])
            rmses.append(np.sqrt(mean_squared_error(y_train[val_idx], pred)))
        mean_rmse = np.mean(rmses)
        if mean_rmse < best_rmse:
            best_rmse, best_alpha = mean_rmse, alpha
    print(f"  [CV] Ridge best α={best_alpha} (CV-RMSE={best_rmse:.5f})")
    return best_alpha


def select_lasso_alpha(X_train, y_train, alphas=(1e-5, 1e-4, 1e-3, 0.01, 0.1)):
    """CV on training set only."""
    kf = KFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)
    best_alpha, best_rmse = None, np.inf
    for alpha in alphas:
        rmses = []
        for tr_idx, val_idx in kf.split(X_train):
            pipe = Pipeline([("sc", StandardScaler()),
                             ("lasso", Lasso(alpha=alpha, max_iter=5000, random_state=RANDOM_SEED))])
            pipe.fit(X_train[tr_idx], y_train[tr_idx])
            pred = pipe.predict(X_train[val_idx])
            rmses.append(np.sqrt(mean_squared_error(y_train[val_idx], pred)))
        mean_rmse = np.mean(rmses)
        if mean_rmse < best_rmse:
            best_rmse, best_alpha = mean_rmse, alpha
    print(f"  [CV] Lasso best α={best_alpha} (CV-RMSE={best_rmse:.5f})")
    return best_alpha


# ── Per-event analysis ────────────────────────────────────────────────────────
def evaluate_per_event(model, base_dir: Path, event_ids: list):
    """Evaluate model on each validation event independently."""
    results = []
    for eid in event_ids:
        try:
            dem, rain, h = load_event(base_dir, eid)
            X_ev, y_ev = build_feature_matrix(dem, rain, h, eid)
            pred = model.predict(X_ev)
            pred = np.clip(pred, 0.0, None)
            m = compute_metrics(y_ev, pred, label=eid)
            results.append(m)
        except FileNotFoundError:
            # fixture mode: substitute fixture itself with a note
            results.append({"label": eid, "note": "not available (fixture mode)"})
    return results


# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Linear Regression Validation — Crestix Probe")
    parser.add_argument("--data-dir", default="ml_data/fixtures/sample_event",
                        help="Root of processed_32x32_crops or fixture dir")
    parser.add_argument("--output-dir", default="validation/experiments",
                        help="Where to write experiment result JSON")
    args = parser.parse_args()

    base_dir   = Path(args.data_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 70)
    print("Crestix Probe — Linear Regression Validation (Person 3)")
    print("=" * 70)

    # ── Load splits ──────────────────────────────────────────────────────────
    print("\n[1/6] Loading training data ...")
    X_train, y_train, train_loaded = load_split(base_dir, TRAIN_EVENTS, "train")

    print("\n[2/6] Loading validation data ...")
    X_val, y_val, val_loaded = load_split(base_dir, VAL_EVENTS, "val")

    print(f"\n  Train shape: {X_train.shape}  |  Val shape: {X_val.shape}")
    print(f"  Target range (train): [{y_train.min():.4f}, {y_train.max():.4f}] m")
    print(f"  Flood cells (train) @ ≥{FLOOD_THRESHOLD_M}m: "
          f"{(y_train >= FLOOD_THRESHOLD_M).mean() * 100:.1f}%")

    # ── Train models ─────────────────────────────────────────────────────────
    print("\n[3/6] Training OLS Linear Regression ...")
    ols_pipe = Pipeline([("sc", StandardScaler()), ("lr", LinearRegression())])
    ols_pipe.fit(X_train, y_train)

    print("\n[4/6] Training Ridge (CV alpha selection on train only) ...")
    ridge_alpha = select_ridge_alpha(X_train, y_train)
    ridge_pipe  = Pipeline([("sc", StandardScaler()),
                            ("ridge", Ridge(alpha=ridge_alpha, random_state=RANDOM_SEED))])
    ridge_pipe.fit(X_train, y_train)

    print("\n[5/6] Training Lasso (CV alpha selection on train only) ...")
    lasso_alpha = select_lasso_alpha(X_train, y_train)
    lasso_pipe  = Pipeline([("sc", StandardScaler()),
                            ("lasso", Lasso(alpha=lasso_alpha, max_iter=5000,
                                           random_state=RANDOM_SEED))])
    lasso_pipe.fit(X_train, y_train)

    # ── Evaluate on validation set ────────────────────────────────────────────
    print("\n[6/6] Evaluating on validation set ...")
    all_metrics = {}
    for name, pipe in [("OLS", ols_pipe), ("Ridge", ridge_pipe), ("Lasso", lasso_pipe)]:
        y_pred = pipe.predict(X_val)
        y_pred = np.clip(y_pred, 0.0, None)   # water depth ≥ 0
        m = compute_metrics(y_val, y_pred, label=name)
        all_metrics[name] = m
        print_metrics(m)

    # ── Per-event breakdown ──────────────────────────────────────────────────
    print("\n── Per-event validation breakdown ──")
    best_model_name = min(all_metrics, key=lambda k: all_metrics[k]["rmse_m"])
    best_pipe = {"OLS": ols_pipe, "Ridge": ridge_pipe, "Lasso": lasso_pipe}[best_model_name]
    per_event = evaluate_per_event(best_pipe, base_dir, VAL_EVENTS)
    for ev in per_event:
        if "note" in ev:
            print(f"  {ev['label']}: {ev['note']}")
        else:
            print(f"  {ev['label']:40s} MAE={ev['mae_m']:.5f}m  RMSE={ev['rmse_m']:.5f}m  "
                  f"R²={ev['r2']:.4f}  CSI={ev['csi']:.4f}")

    # ── Feature importance (OLS coefficients) ────────────────────────────────
    FEATURE_NAMES = [
        "dem_elevation_norm", "dem_slope_gradient", "dem_curvature",
        "grid_row_norm", "grid_col_norm",
        "rain_t0_norm", "rain_t1_norm", "rain_t2_norm", "rain_cumsum_norm",
        "water_depth_t0", "water_depth_tminus1",
    ]
    ols_coefs = dict(zip(FEATURE_NAMES, ols_pipe.named_steps["lr"].coef_))
    lasso_coefs = dict(zip(FEATURE_NAMES, lasso_pipe.named_steps["lasso"].coef_))
    lasso_zero = [f for f, c in lasso_coefs.items() if abs(c) < 1e-9]
    print(f"\n── Lasso zeroed-out features ({len(lasso_zero)}): {lasso_zero}")

    # ── Recommendation ────────────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("RECOMMENDED CONFIGURATION")
    print("=" * 70)
    best = all_metrics[best_model_name]
    print(f"  Model     : {best_model_name}")
    if best_model_name == "Ridge":
        print(f"  Alpha     : {ridge_alpha}")
    elif best_model_name == "Lasso":
        print(f"  Alpha     : {lasso_alpha}")
    print(f"  Val MAE   : {best['mae_m']:.5f} m")
    print(f"  Val RMSE  : {best['rmse_m']:.5f} m")
    print(f"  Val R²    : {best['r2']:.4f}")
    print(f"  Val CSI   : {best['csi']:.4f}")
    print(f"  Seed      : {RANDOM_SEED}")
    print(f"  Threshold : {FLOOD_THRESHOLD_M} m (flood/non-flood)")
    print()

    # ── Save experiment results ───────────────────────────────────────────────
    results_payload = {
        "experiment": "linear_regression_validation",
        "person": 3,
        "seed": RANDOM_SEED,
        "flood_threshold_m": FLOOD_THRESHOLD_M,
        "train_events": train_loaded,
        "val_events":   val_loaded,
        "train_samples": int(X_train.shape[0]),
        "val_samples":   int(X_val.shape[0]),
        "models": {
            "OLS":   {**all_metrics["OLS"],
                      "hyperparams": {}},
            "Ridge": {**all_metrics["Ridge"],
                      "hyperparams": {"alpha": ridge_alpha}},
            "Lasso": {**all_metrics["Lasso"],
                      "hyperparams": {"alpha": lasso_alpha},
                      "zeroed_features": lasso_zero},
        },
        "per_event_validation": per_event,
        "recommendation": {
            "model":       best_model_name,
            "alpha":       ridge_alpha if best_model_name == "Ridge" else
                           (lasso_alpha if best_model_name == "Lasso" else None),
            "val_mae_m":   best["mae_m"],
            "val_rmse_m":  best["rmse_m"],
            "val_r2":      best["r2"],
            "val_csi":     best["csi"],
        },
        "ols_coefficients": {k: round(float(v), 6) for k, v in ols_coefs.items()},
    }

    out_path = output_dir / "linear_regression_results.json"
    with open(out_path, "w") as fh:
        json.dump(results_payload, fh, indent=2)
    print(f"  Results written → {out_path}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
