# Common data and experiment protocol

Preserve one immutable raw record per observation: experiment/event/location IDs, UTC timestamp, measured depth and unit, sensor ID, calibration reference, quality flag, and source checksum. Prediction records separately need model/checkpoint ID, run/config ID, forecast and valid times, location, predicted depth/unit, and source checksum.

Assign whole flood events to train, validation, or held-out test before windowing or normalization. Never let timesteps, spatial tiles, or repeated trials from one event cross splits. Fit preprocessing statistics on training events only. Freeze a manifest with event IDs, region, dataset version, exclusions, and checksums before training. Audit event IDs and source hashes across splits; overlap invalidates evaluation.

Compare XGBoost and PINO against identical labels at the same location and valid timestamp, with a declared tolerance and missing-data policy. Report matched-pair counts, omitted pairs, units, split, events, thresholds, and metric implementation. Compute metrics from actual prediction/label arrays; never use UI fixtures or backend stub estimates as scientific results.
