# Physical validation protocol

Use the same miniature terrain, initial water state, sensor mounting, rainfall volume, and rainfall duration for every trial. Record the rainfall delivery method and instrument resolution. Measure at fixed stations P1, P2, and P3 at a recorded cadence. Repeat each scenario and preserve raw files unchanged. Record calibration metadata and flag any mount movement, missing echo, overflow, or spill.

Compare an AI prediction with an observation only when both location and timestamp match within a declared tolerance. Do not spatially extrapolate a single sensor to the whole basin. Report the number of matched pairs and skipped readings alongside MAE and RMSE. A miniature experiment validates local experimental behavior only; it does not independently establish city-scale prediction accuracy.

Use `python compare_predictions.py predictions.csv observations.csv --tolerance-seconds 5`. Required CSV headers are `timestamp,location_id,water_depth_cm`; optional prediction column `flooded` and observation column `flooded` produce a binary CSI when both are present. The tool uses actual input rows only and reports no metric if there are no matched pairs.
