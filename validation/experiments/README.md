# Experiment Results — Linear Regression Validation
## Crestix Probe | Person 3 | 2026-11-14

This directory contains all experiment outputs produced by Person 3's validation pipeline.

---

## Files

| File | Description |
|:-----|:------------|
| `linear_regression_results.json` | Full metrics for OLS, Ridge, Lasso on the validation split |
| `residual_analysis_results.json` | Feature distributions, VIF, residual stats, underestimation tiers |
| `feature_distributions.png` | 11-panel histogram grid of all input features |
| `residual_diagnostics.png` | 4-panel diagnostic: histogram, QQ, fitted-vs-residual, spatial heatmap |
| `true_vs_predicted_depth_tiers.png` | Scatter plot coloured by water depth tier |

---

## Key Results (Validation Set — 67,584 samples, 2 events)

| Model | MAE (m) | RMSE (m) | R² | CSI@0.05m |
|:------|--------:|---------:|---:|----------:|
| OLS | 0.00853 | 0.01618 | 0.9988 | 0.9516 |
| Ridge (alpha=0.01) | 0.00854 | 0.01618 | 0.9988 | 0.9516 |
| Lasso (alpha=1e-5) | 0.00854 | 0.01618 | 0.9988 | 0.9517 |

**Recommended:** OLS Linear Regression (identical performance, highest interpretability).

---

## Reproduce

```bash
# From repo root:
python ml/linear_regression_validation.py --data-dir ml_data/fixtures/sample_event
python ml/residual_analysis.py --data-dir ml_data/fixtures/sample_event

# With full Drive data:
python ml/linear_regression_validation.py --data-dir /path/to/processed_32x32_crops
python ml/residual_analysis.py --data-dir /path/to/processed_32x32_crops
```

Seed is fixed at 42 throughout.
