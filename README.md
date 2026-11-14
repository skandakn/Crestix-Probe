# Crestix Probe

Crestix Probe combines a Next.js interface, FastAPI service, sensor ingestion, and terrain, simulation, forecasting, and validation modules. This repository contains the website and backend. Forecast and simulation adapters currently report `stub` mode. The XGBoost/PINO source repositories, checkpoints, and training datasets are not configured here; model training and scientific ML comparisons are unverified.

## Architecture and artifacts

- `src/`: Next.js app and feature modules.
- `backend/`: FastAPI, Pydantic schemas, SQLAlchemy persistence, and migrations.
- Model repositories: [XGBoost](https://github.com/skandakn/XGBoost-Crestix-Probe) exists but its inspected `main` contains only `.gitignore`; [PINO](https://github.com/skandakn/PINO-Crestix-Probe) contains packaging metadata and requirements only. Neither is configured as a submodule, and neither contains training code, datasets, or checkpoints at the inspected revision.
- Datasets, weights, photos, and manifests: no Drive connection was available during QA. Keep large/private data and credentials outside Git.

## Install and run

```bash
npm ci
npm run dev
```

```bash
cd backend
python -m pip install -r requirements.txt
copy .env.example .env  # Windows; use cp on Unix
python -m alembic upgrade head
python -m uvicorn app.main:app --reload --port 8000
```

Set `DATABASE_URL`, local auth configuration, and the frontend API base URL for your environment. Do not commit secrets.

## Verification commands

```bash
python -m pytest -q backend/tests tests
python scripts/run_smoke_tests.py
npm test -- --run
npm run build
```

Missing model repositories are reported as skipped integrations, not passing model tests. Check mock/stub labels before interpreting UI values.

## Training, inference, and evaluation

No training or inference command can be given until model implementations, datasets, and checkpoints are supplied. Follow [the event-split protocol](docs/data_protocol.md), [reproducibility manifest](docs/reproducibility.md), and [comparison requirements](docs/model_comparison.md). Both models must use identical held-out flood events, location/time matches, and label rules. There are no actual XGBoost-versus-PINO metrics in this checkout.

## Hardware

See [hardware setup](docs/hardware_setup.md) and [ESP32 notes](hardware/esp32/README.md). Sample values are not physical measurements. A miniature prototype does not by itself establish city-scale accuracy.

## Known limitations and demo

Backend numerical solver and forecast adapters are stubs. ML repos/data/checkpoints and Drive manifests are unavailable. Landing and frontend fixtures are not measured claims. Use [the demo checklist](docs/demo_checklist.md) and state operational status, data provenance, and scale limitations clearly.
