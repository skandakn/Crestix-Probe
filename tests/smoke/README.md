# Smoke checks

Run `python scripts/run_smoke_tests.py`. It runs repository/backend tests and prints explicit skip status for model training, weight loading, and inference when repositories, data, and checkpoints are missing. A green local test run does not imply trained models are operational.
