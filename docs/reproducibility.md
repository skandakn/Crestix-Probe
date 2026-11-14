# Reproducibility and manifests

Each run manifest should record dataset version, region, immutable train/validation/test event IDs, source file paths and SHA-256 hashes, preprocessing and labels, model repository URL/commit, checkpoint path/hash, experiment config, random seeds, runtime versions, prediction artifact hash, and metric-script version.

Keep raw datasets, large weights, experiment photos, and credentials in the approved shared Drive; Git should contain schemas, small non-sensitive examples, and procedures only. No connected Drive was available in this QA pass, so Drive manifests and checksums could not be verified. Never commit API keys or private credentials. No ML submodules or model directories are configured. Set `XGBOOST_REPO_PATH` and `PINO_REPO_PATH` only after owners provide authoritative repositories.
