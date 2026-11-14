# Architecture and interfaces

The web application is Next.js App Router (`src/app`) with feature modules in `src/features`. The backend is a separate FastAPI application rooted at `backend/app/main.py` with sensor ingestion, experiments, validation, terrain, simulation, and forecasting routes.

Sensor readings are validated by `SensorReadingCreate`, persisted by the sensor API, and transformed by `sensor_service`. `POST /api/sensor/readings`, `GET /api/sensor/latest`, and `GET /api/sensor/history` are implemented. Forecast requests currently call `run_stub_forecast`; simulation requests call `run_stub_simulation`. Their response metadata marks stub mode and non-operational status.

The upstream XGBoost repository currently contains only `.gitignore`; PINO contains `pyproject.toml` and `requirements.txt`, but no `src`, training data, or checkpoints. Neither repo is linked as a submodule. The optional backend ML adapter returns model-not-installed until artifacts are supplied. Do not mistake UI fixture names or generated previews for calls to trained models.
