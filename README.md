# Crestix Probe

[![Build & Deploy](https://img.shields.io/badge/Deploy-Render-blue?style=flat-square&logo=render)](https://crestix-probe-aqua.onrender.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=flat-square)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PyTorch](https://img.shields.io/badge/PyTorch-PINO%20Surrogate-EE4C2C?style=flat-square&logo=pytorch)](https://pytorch.org/)

**Crestix Probe** is a physics-informed AI platform for real-time urban flood modeling, neural surrogate hydrodynamic forecasting, and distributed IoT hydrological telemetry.

It bridges 2D shallow-water numerical simulation (Saint-Venant equations) with Physics-Informed Neural Operators (**PINO**), tabular surrogate models (**XGBoost**, **Random Forest**, **Linear Regression**), and physical edge sensor nodes (**ESP32** ultrasonic ranging and multi-pin contact arrays).

---

## Live Deployment & Hackathon Artifacts

- **Production Web Application:** [https://crestix-probe-aqua.onrender.com/](https://crestix-probe-aqua.onrender.com/)
- **Comprehensive Hackathon Report (PDF):** [`Crestix_Probe_Hackathon_Final_Report.pdf`](Crestix_Probe_Hackathon_Final_Report.pdf)
- **Publication Summary (2-Page PDF):** [`Crestix_Probe_Hackathon_Final_Report_2Page.pdf`](Crestix_Probe_Hackathon_Final_Report_2Page.pdf)
- **Benchtop Prototype Calibration Documentation:** [`hardware/esp32/README.md`](hardware/esp32/README.md)

---

## System Architecture

```text
Crestix-Probe/
├── src/                          # Next.js 15 Web Application
│   ├── app/                      # App router (Landing, Dashboard, Simulation, Sensors, Analytics, Forecasting)
│   ├── features/
│   │   ├── simulation/           # Interactive 2D SWE canvas simulation & initial boundary condition controls
│   │   ├── sensors/              # Real-time IoT sensor telemetry feeds, hydrographs, and map views
│   │   ├── analytics/            # Catchment analysis, residual evaluation, and model comparisons
│   │   ├── forecasting/          # Hyetograph precipitation & runoff forecasting
│   │   └── landing/              # Showcase landing page components
│   └── components/               # Shared UI design system primitives
├── backend/                      # FastAPI Microservice & Scientific Backend
│   ├── app/
│   │   ├── api/                  # REST endpoints: /api/ml/*, /api/sensor/*, /api/simulation/*, /api/terrain/*
│   │   ├── core/                 # App configuration, security, JWT authentication & error handlers
│   │   ├── db/                   # SQLAlchemy database engine and session managers
│   │   ├── models/               # ORM database models (Sensors, Readings, Forecasts, Experiments)
│   │   ├── schemas/              # Pydantic v2 validation contracts & LarNO common schemas
│   │   └── services/             # ML adapters, singleton model registry cache & WebSocket telemetry manager
│   ├── tests/                    # Backend API and integration test suites
│   └── requirements.txt
├── ml/                           # Pinned Git Submodules for Model Development
│   ├── xgboost/                  # XGBoost point-station flood stage predictor
│   ├── pino/                     # 2D Fourier / Physics-Informed Neural Operator surrogate
│   ├── random-forest/            # Random Forest ensemble baseline model
│   └── linear-regression/        # Standard linear baseline & shared evaluation metric scripts
├── hardware/                     # Embedded IoT Engineering
│   ├── esp32/
│   │   ├── firmware/             # Arduino IDE sketch (crestix_hcsr04.ino) for HC-SR04 ultrasonic node
│   │   └── platformio_probe/     # Dual sonar + 6-pin galvanic contact array firmware (PlatformIO)
│   └── calibration/              # Sensor calibration matrices & sound-speed temperature compensation
├── scripts/                      # Telemetry bridge, PDF generation, and automated validation scripts
└── docs/                         # System specifications, ML integration protocols & QA testing guides
```

---

## Machine Learning Integration & Pinned Submodules

The unified ML backend (`backend/app/api/ml.py`) routes inference and evaluation through consistent Pydantic v2 schemas across 4 pinned submodules:

| Submodule Path | Upstream Repository | Role in Pipeline | Key Components |
| :--- | :--- | :--- | :--- |
| **`ml/xgboost`** | [`XGBoost-Crestix-Probe`](https://github.com/skandakn/XGBoost-Crestix-Probe) | High-speed tabular stage predictor | `src/crestix_xgb/` training, feature extraction, evaluation metrics |
| **`ml/pino`** | [`PINO-Crestix-Probe`](https://github.com/skandakn/PINO-Crestix-Probe) | 2D Spatio-temporal Neural Operator | `src/crestix_pino/` FNO model, LarNO data pipeline, physics loss validation |
| **`ml/random-forest`** | [`Random-Forest---Crestix-Probe`](https://github.com/skandakn/Random-Forest---Crestix-Probe) | Non-linear ensemble baseline | Random forest model training, inference pipeline & validation |
| **`ml/linear-regression`** | [`Linear-Regression---Crestix-Probe`](https://github.com/skandakn/Linear-Regression---Crestix-Probe) | Fast interpretable baseline | Benchmark regressors, residual analysis & common plotting utilities |

> **Production Safety Guarantee:** In accordance with [`docs/ml_integration.md`](docs/ml_integration.md), if any submodule or checkpoint weight is not initialized, prediction endpoints return clean `HTTP 503` (`MODEL_NOT_INSTALLED`) statuses rather than generating arbitrary unverified data.

---

## Quickstart & Local Setup

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+
- **Python**: v3.10+
- **Git**

### 2. Clone Repository with Submodules
```bash
git clone --recurse-submodules https://github.com/skandakn/Crestix-Probe.git
cd Crestix-Probe
```

*(If cloned without `--recurse-submodules`, initialize them with `git submodule update --init --recursive`)*.

### 3. Frontend Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Backend FastAPI Server
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
copy .env.example .env    # On Unix: cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```
Interactive Swagger API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## Physical Hardware & Live Sensor Bridge

Crestix Probe supports both virtual simulation and live ESP32 edge telemetry:
- **Dual Sensing Setup:** Non-contact HC-SR04 ultrasonic distance sensor combined with a 6-pin contact probe array for instant flash-inundation verification.
- **Acoustic Compensation:** Real-time speed-of-sound calibration using ambient thermistor measurements:
  $$c(T) \approx 331.3 \times \sqrt{1 + \frac{T}{273.15}} \text{ m/s}$$
- **Telemetry Bridge:** Use `scripts/telemetry_bridge.py` to forward live serial streams from local COM ports directly to the local or cloud backend `/api/sensor/readings` endpoint.

---

## Test & Verification Suites

Execute the comprehensive test suites across the entire stack:

```bash
# Frontend component & unit tests
npm test -- --run

# Production Next.js build
npm run build

# Backend API & service tests
pytest backend/tests

# End-to-end smoke tests
python scripts/run_smoke_tests.py
```

---

## Documentation Index

- [ML Backend Integration Guide](docs/ml_integration.md)
- [System Architecture](docs/architecture.md)
- [Hardware Setup & Flume Similitude](docs/hardware_setup.md)
- [Data Protocols & Event Splits](docs/data_protocol.md)
- [Model Comparison Protocols](docs/model_comparison.md)
- [Reproducibility Guidelines](docs/reproducibility.md)
- [QA Testing & Test Scenarios](docs/QA_TESTING_GUIDE.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)

---

## License

This project is licensed under the [MIT License](LICENSE).
