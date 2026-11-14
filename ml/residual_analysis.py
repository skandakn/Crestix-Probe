#!/usr/bin/env python3
"""
residual_analysis.py
====================
Person 3 — Crestix Probe ML Team
Residual analysis, feature distribution, multicollinearity, and
underestimation diagnostics for the Linear Regression model.

Covers Tasks 2, 3, 4, 5:
  - Feature distributions and outlier detection (IQR + Z-score)
  - Multicollinearity via VIF (Variance Inflation Factor)
  - Residual plots: histogram, QQ, fitted-vs-residual, spatial heatmap
  - Underestimation analysis for high water depths (> 0.3 m)

Usage:
    python ml/residual_analysis.py --data-dir ml_data/fixtures/sample_event
"""

import argparse
import json
import os
import sys
import warnings
from pathlib import Path

import matplotlib
matplotlib.use("Agg")           # non-interactive — save to file
import matplotlib.pyplot as plt
import numpy as np
import scipy.stats as stats
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")

RANDOM_SEED       = 42
np.random.seed(RANDOM_SEED)

FLOOD_THRESHOLD_M = 0.05
DEM_MEAN  = 26.684261;  DEM_STD   = 1.847113
RAIN_MEAN = 0.607498;   RAIN_STD  = 0.627756
H_MEAN    = 0.126487;   H_STD     = 0.223847

FEATURE_NAMES = [
    "dem_elevation_norm", "dem_slope_gradient", "dem_curvature",
    "grid_row_norm", "grid_col_norm",
    "rain_t0_norm", "rain_t1_norm", "rain_t2_norm", "rain_cumsum_norm",
    "water_depth_t0", "water_depth_tminus1",
]


# ── Helpers (duplicated here so this script is self-contained) ────────────────
def compute_dem_derivatives(dem):
    dy, dx = np.gradient(dem, 8.0, 8.0)
    slope     = np.sqrt(dx**2 + dy**2)
    curvature = np.gradient(dy, 8.0, axis=0) + np.gradient(dx, 8.0, axis=1)
    return slope.astype(np.float32), curvature.astype(np.float32)


def build_feature_matrix(dem, rainfall, h):
    H, W = dem.shape
    T    = rainfall.shape[0]

    dem_norm  = (dem - DEM_MEAN)  / DEM_STD
    rain_norm = (rainfall - RAIN_MEAN) / RAIN_STD
    slope, curvature = compute_dem_derivatives(dem)
    rows_idx, cols_idx = np.meshgrid(np.arange(H), np.arange(W), indexing="ij")
    row_norm = rows_idx / (H - 1.0)
    col_norm = cols_idx / (W - 1.0)
    rain_cumsum = np.cumsum(rain_norm, axis=0)

    rows_X, rows_y = [], []
    for t in range(2, T - 1):
        for r in range(H):
            for c in range(W):
                rows_X.append([
                    dem_norm[r, c], slope[r, c], curvature[r, c],
                    row_norm[r, c], col_norm[r, c],
                    rain_norm[t, r, c], rain_norm[t-1, r, c],
                    rain_norm[t-2, r, c], rain_cumsum[t, r, c],
                    h[t, r, c], h[t-1, r, c],
                ])
                rows_y.append(h[t+1, r, c])

    return np.array(rows_X, dtype=np.float32), np.array(rows_y, dtype=np.float32)


def load_fixture(data_dir: Path):
    dem      = np.load(data_dir / "dem.npy")
    rainfall = np.load(data_dir / "rainfall.npy")
    h        = np.load(data_dir / "h.npy")
    return dem, rainfall, h


# ── 1. Feature Distribution Analysis ─────────────────────────────────────────
def analyse_feature_distributions(X: np.ndarray, out_dir: Path):
    """
    Per-feature: mean, std, IQR-based outlier count, Z-score outlier count.
    Saves a grid of histograms.
    """
    print("\n[1] Feature Distribution Analysis")
    report = {}
    for i, name in enumerate(FEATURE_NAMES):
        col = X[:, i]
        q1, q3 = np.percentile(col, [25, 75])
        iqr     = q3 - q1
        iqr_lb  = q1 - 1.5 * iqr
        iqr_ub  = q3 + 1.5 * iqr
        iqr_out = int(np.sum((col < iqr_lb) | (col > iqr_ub)))
        z_scores = (col - col.mean()) / (col.std() + 1e-12)
        z_out    = int(np.sum(np.abs(z_scores) > 3))
        skew     = float(stats.skew(col))
        kurt     = float(stats.kurtosis(col))
        report[name] = {
            "mean": round(float(col.mean()), 5),
            "std":  round(float(col.std()),  5),
            "min":  round(float(col.min()),  5),
            "max":  round(float(col.max()),  5),
            "iqr_outliers":     iqr_out,
            "zscore_outliers_3sigma": z_out,
            "skewness": round(skew, 4),
            "kurtosis": round(kurt, 4),
        }
        flag = "⚠ SKEWED" if abs(skew) > 1.0 else ""
        print(f"  {name:<28}  mean={col.mean():7.3f}  std={col.std():6.3f}  "
              f"IQR-out={iqr_out:5d}  Z-out={z_out:5d}  skew={skew:+.2f}  {flag}")

    # Save histogram grid
    fig, axes = plt.subplots(3, 4, figsize=(18, 12))
    axes = axes.flatten()
    for i, name in enumerate(FEATURE_NAMES):
        axes[i].hist(X[:, i], bins=60, color="#4A90D9", edgecolor="none", alpha=0.8)
        axes[i].set_title(name, fontsize=9)
        axes[i].set_ylabel("Count")
    for j in range(len(FEATURE_NAMES), len(axes)):
        axes[j].set_visible(False)
    fig.suptitle("Feature Distributions — Linear Regression (Person 3)", fontsize=13)
    plt.tight_layout()
    path = out_dir / "feature_distributions.png"
    plt.savefig(path, dpi=150)
    plt.close()
    print(f"  → Saved feature distributions plot: {path}")
    return report


# ── 2. Multicollinearity — VIF ────────────────────────────────────────────────
def compute_vif(X: np.ndarray) -> dict:
    """
    Variance Inflation Factor via OLS R² for each predictor regressed on the others.
    VIF > 10 is considered high multicollinearity.
    """
    print("\n[2] Multicollinearity — Variance Inflation Factor (VIF)")
    from sklearn.linear_model import LinearRegression as LR
    vif_values = {}
    for i, name in enumerate(FEATURE_NAMES):
        y_vif = X[:, i]
        X_vif = np.delete(X, i, axis=1)
        # subsample for speed (VIF on first 20k rows)
        n = min(20_000, len(y_vif))
        idx = np.random.choice(len(y_vif), n, replace=False)
        lr  = LR().fit(X_vif[idx], y_vif[idx])
        r2  = lr.score(X_vif[idx], y_vif[idx])
        r2  = min(r2, 1 - 1e-9)   # guard against perfect R²
        vif = 1.0 / (1.0 - r2)
        flag = "⚠ HIGH" if vif > 10 else ""
        print(f"  {name:<28}  VIF = {vif:8.2f}  {flag}")
        vif_values[name] = round(float(vif), 3)
    return vif_values


# ── 3. Residual Analysis ──────────────────────────────────────────────────────
def residual_analysis(y_true: np.ndarray, y_pred: np.ndarray,
                      X: np.ndarray, out_dir: Path, dem_shape=(32, 32)):
    """
    Produces 4 diagnostic plots:
      a) Residual histogram (should be ≈ Gaussian)
      b) QQ-plot of residuals
      c) Fitted vs residual scatter (heteroscedasticity check)
      d) Mean absolute residual spatial heatmap (32×32)
    """
    print("\n[3] Residual Analysis")
    residuals = y_true - y_pred

    # Stats
    shapiro_stat, shapiro_p = stats.shapiro(
        residuals[np.random.choice(len(residuals), min(5000, len(residuals)), replace=False)]
    )
    print(f"  Residual mean  : {residuals.mean():.6f} m")
    print(f"  Residual std   : {residuals.std():.6f} m")
    print(f"  Residual min   : {residuals.min():.6f} m")
    print(f"  Residual max   : {residuals.max():.6f} m")
    print(f"  Shapiro-Wilk W : {shapiro_stat:.4f}  p = {shapiro_p:.4e}")
    if shapiro_p < 0.05:
        print("  ⚠ Residuals are NOT normally distributed (p < 0.05)")
    else:
        print("  ✓ Cannot reject normality of residuals (p ≥ 0.05)")

    # a) Residual histogram
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    ax = axes[0, 0]
    ax.hist(residuals, bins=100, color="#E74C3C", edgecolor="none", alpha=0.8)
    ax.axvline(0, color="black", lw=1.5, ls="--")
    ax.set_title("Residual Distribution (y − ŷ)")
    ax.set_xlabel("Residual (m)")
    ax.set_ylabel("Count")

    # b) QQ plot
    ax = axes[0, 1]
    sample_idx = np.random.choice(len(residuals), min(3000, len(residuals)), replace=False)
    (osm, osr), (slope, intercept, r) = stats.probplot(residuals[sample_idx], dist="norm")
    ax.scatter(osm, osr, s=2, alpha=0.4, color="#3498DB")
    ax.plot(osm, slope * np.array(osm) + intercept, "r-", lw=1.5, label=f"r={r:.3f}")
    ax.set_title("QQ-Plot of Residuals")
    ax.set_xlabel("Theoretical Quantiles")
    ax.set_ylabel("Sample Quantiles")
    ax.legend()

    # c) Fitted vs Residual
    ax = axes[1, 0]
    idx = np.random.choice(len(y_pred), min(5000, len(y_pred)), replace=False)
    ax.scatter(y_pred[idx], residuals[idx], s=1, alpha=0.3, color="#2ECC71")
    ax.axhline(0, color="black", lw=1.2, ls="--")
    ax.set_title("Fitted vs Residual")
    ax.set_xlabel("Predicted depth (m)")
    ax.set_ylabel("Residual (m)")

    # d) Spatial residual heatmap (mean |residual| per grid cell)
    ax = axes[1, 1]
    H, W = dem_shape
    T_eff = len(y_true) // (H * W)
    if T_eff > 0 and len(y_true) == T_eff * H * W:
        abs_res = np.abs(residuals).reshape(T_eff, H, W).mean(axis=0)
        im = ax.imshow(abs_res, cmap="hot", origin="lower")
        plt.colorbar(im, ax=ax, label="|Residual| mean (m)")
        ax.set_title("Spatial Mean |Residual| Heatmap")
        ax.set_xlabel("Column")
        ax.set_ylabel("Row")
    else:
        ax.text(0.5, 0.5, "Spatial reshape not possible\n(mixed events)",
                ha="center", va="center", transform=ax.transAxes)

    fig.suptitle("Residual Diagnostics — Linear Regression (Person 3)", fontsize=13)
    plt.tight_layout()
    path = out_dir / "residual_diagnostics.png"
    plt.savefig(path, dpi=150)
    plt.close()
    print(f"  → Saved residual diagnostics: {path}")

    return {
        "mean_m":   round(float(residuals.mean()), 7),
        "std_m":    round(float(residuals.std()),  7),
        "shapiro_w": round(float(shapiro_stat), 5),
        "shapiro_p": float(shapiro_p),
        "normal_residuals": bool(shapiro_p >= 0.05),
    }


# ── 4. Underestimation of high water depths ───────────────────────────────────
def underestimation_analysis(y_true: np.ndarray, y_pred: np.ndarray,
                              out_dir: Path):
    """
    Stratifies samples by true water depth quartile and reports bias per tier.
    Also produces a scatter plot coloured by depth tier.
    """
    print("\n[4] Underestimation of High Water Depths")
    thresholds = [0.0, 0.05, 0.15, 0.30, 0.60, 2.0]
    tier_labels = ["dry(<0.05m)", "0.05-0.15m", "0.15-0.30m", "0.30-0.60m", ">0.60m"]

    report = []
    for i in range(len(thresholds) - 1):
        lb, ub = thresholds[i], thresholds[i + 1]
        mask = (y_true >= lb) & (y_true < ub)
        if mask.sum() == 0:
            continue
        bias      = float((y_pred[mask] - y_true[mask]).mean())  # + = overest; - = underest
        mae_tier  = float(np.abs(y_pred[mask] - y_true[mask]).mean())
        pct_under = float((y_pred[mask] < y_true[mask]).mean()) * 100
        entry = {
            "tier": tier_labels[i], "count": int(mask.sum()),
            "mean_bias_m": round(bias, 6),
            "mae_m": round(mae_tier, 6),
            "pct_underestimated": round(pct_under, 2),
        }
        report.append(entry)
        flag = "⚠ BIAS" if abs(bias) > 0.02 else ""
        print(f"  {tier_labels[i]:<18}  n={mask.sum():7d}  bias={bias:+.5f}m  "
              f"MAE={mae_tier:.5f}m  under={pct_under:.1f}%  {flag}")

    # Scatter: true vs predicted, coloured by depth tier
    fig, ax = plt.subplots(figsize=(8, 7))
    colors = ["#BDC3C7", "#2ECC71", "#F39C12", "#E74C3C", "#8E44AD"]
    for i in range(len(thresholds) - 1):
        lb, ub = thresholds[i], thresholds[i + 1]
        mask = (y_true >= lb) & (y_true < ub)
        if mask.sum() == 0:
            continue
        idx = np.random.choice(mask.nonzero()[0],
                               min(1500, mask.sum()), replace=False)
        ax.scatter(y_true[idx], y_pred[idx], s=3, alpha=0.5,
                   color=colors[i], label=tier_labels[i])
    lim = max(y_true.max(), y_pred.max()) * 1.05
    ax.plot([0, lim], [0, lim], "k--", lw=1.2, label="Perfect")
    ax.set_xlim(0, lim); ax.set_ylim(0, lim)
    ax.set_xlabel("True water depth (m)")
    ax.set_ylabel("Predicted water depth (m)")
    ax.set_title("True vs Predicted — Coloured by Depth Tier")
    ax.legend(fontsize=8, markerscale=4)
    plt.tight_layout()
    path = out_dir / "true_vs_predicted_depth_tiers.png"
    plt.savefig(path, dpi=150)
    plt.close()
    print(f"  → Saved true-vs-predicted scatter: {path}")
    return report


# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Residual Analysis — Crestix Probe")
    parser.add_argument("--data-dir",   default="ml_data/fixtures/sample_event")
    parser.add_argument("--output-dir", default="validation/experiments")
    args = parser.parse_args()

    data_dir   = Path(args.data_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 70)
    print("Crestix Probe — Residual & Error Analysis (Person 3)")
    print("=" * 70)

    # Load fixture (or Drive data if available)
    print(f"\nLoading data from: {data_dir}")
    dem, rainfall, h = load_fixture(data_dir)
    X, y = build_feature_matrix(dem, rainfall, h)
    print(f"  Feature matrix: {X.shape}  |  Targets: {y.shape}")

    # Train a quick Ridge model (best from validation experiments)
    ridge_alpha = 1.0   # default; full run uses CV-selected value
    pipe = Pipeline([("sc", StandardScaler()),
                     ("ridge", Ridge(alpha=ridge_alpha, random_state=RANDOM_SEED))])
    # Use 80 % as "training", 20 % as "analysis hold-out" within this fixture
    n = len(y)
    split_idx = int(0.8 * n)
    idx_all = np.arange(n)
    np.random.shuffle(idx_all)
    tr_idx, te_idx = idx_all[:split_idx], idx_all[split_idx:]
    pipe.fit(X[tr_idx], y[tr_idx])
    y_pred_all = np.clip(pipe.predict(X), 0.0, None)

    # ── Run all diagnostics ──────────────────────────────────────────────────
    dist_report  = analyse_feature_distributions(X, output_dir)
    vif_report   = compute_vif(X)
    res_report   = residual_analysis(y[te_idx], y_pred_all[te_idx], X[te_idx],
                                     output_dir, dem_shape=(32, 32))
    under_report = underestimation_analysis(y, y_pred_all, output_dir)

    # ── Save full report JSON ─────────────────────────────────────────────────
    full_report = {
        "tool": "residual_analysis.py",
        "person": 3,
        "seed": RANDOM_SEED,
        "data_source": str(data_dir),
        "ridge_alpha_used": ridge_alpha,
        "feature_distributions": dist_report,
        "vif_multicollinearity": vif_report,
        "residual_statistics": res_report,
        "underestimation_by_tier": under_report,
    }

    out_path = output_dir / "residual_analysis_results.json"
    with open(out_path, "w") as fh:
        json.dump(full_report, fh, indent=2)
    print(f"\n  Full report written → {out_path}")
    print("\n✓ Residual analysis complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
