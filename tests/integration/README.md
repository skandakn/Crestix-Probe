# Integration test inventory

FastAPI integration tests live in `backend/tests/test_api.py` (sensor, experiment, and validation APIs) and `backend/tests/test_ml_api.py` (ML schemas, model-not-installed responses, and mocked adapter/cache contract). Run them with `python -m pytest -q backend/tests tests`. These tests do not require a live database, external model, or network service.
