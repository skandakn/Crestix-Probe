# Model comparison status

The inspected XGBoost upstream `main` contains only `.gitignore`. PINO upstream `main` contains package metadata and requirements, but no model source, dataset, or checkpoint. Neither is a submodule. Backend ML endpoints return model-not-installed responses without those artifacts, as covered by backend tests. Model training, checkpoint loading, and actual comparison therefore cannot run. This is a blocker, not a zero score.

The existing frontend forecast page uses the legacy `/api/forecast` interface and can fall back to sample benchmark records. The new `/api/ml/*` XGBoost/PINO routes do not yet have a corresponding frontend client. Rendering real ML endpoint responses in the UI was not verified.

Once artifacts are provided, use the same versioned event split, region, label extraction, timestamp/location join, missing-data policy, units, and evaluation script for both models. Hash checkpoints and prediction files. Calculate MAE, RMSE, CSI (with a predeclared flood threshold), and per-event results from those actual arrays. Report counts. Keep accuracy separate from latency.

Do not report deterministic backend baselines or frontend mock values as model performance.
