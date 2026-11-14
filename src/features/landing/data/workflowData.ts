import { WorkflowStage } from "../types";

export const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    step: "01",
    title: "Topographic & Built-Environment Ingestion",
    category: "Geospatial Preprocessing",
    summary:
      "Ingests raw 0.5-meter airborne LiDAR point clouds, sub-meter Digital Elevation Models (DEM), building footprint GIS vectors, and subsurface culvert network geometries.",
    formula: "z_bed = DEM(x, y) + StructuralMask(building, curb, wall)",
    formulaNote:
      "Derives continuous 2D urban bathymetric mesh, hydraulic slopes, and impervious land-cover roughness indices (Manning n).",
    inputs: [
      "0.5m Airborne LiDAR GeoTIFFs",
      "OpenStreetMap / Cadastral Footprints",
      "Municipal Storm Drain Shapefiles",
    ],
    outputs: [
      "Structured Hydro-Bathymetric Grid",
      "Manning Friction Tensor Field",
      "Hydraulic Boundary Infiltration Matrix",
    ],
    resolution: "0.5m x 0.5m cell mesh",
    processingTime: "Static / One-time ingest",
    iconName: "Mountain",
  },
  {
    step: "02",
    title: "Meteorological Precipitation Forcing",
    category: "Atmospheric Telemetry",
    summary:
      "Streams live dual-polarization Doppler radar reflectivity (NEXRAD), satellite cloud-top microphysics, and municipal tipping-bucket rain gauge telemetry.",
    formula: "R(x, y, t) = a · Z(x, y, t)^b (Marshall-Palmer Z-R conversion)",
    formulaNote:
      "Blends quantitative precipitation estimations (QPE) with numerical weather prediction ensembles (HRRR / ECMWF) for 4-hour forward rain rates.",
    inputs: [
      "Dual-Pol Doppler Radar Reflectivity",
      "High-Resolution Rapid Refresh (HRRR)",
      "Municipal Tipping Bucket Gauges",
    ],
    outputs: [
      "Space-Time Spatially Distributed Rain Field",
      "Ensemble Precipitation Probability Scenarios",
      "Catchment Hyetograph Vectors",
    ],
    resolution: "100m grid / 1-minute cadence",
    processingTime: "Continuous real-time stream",
    iconName: "CloudRain",
  },
  {
    step: "03",
    title: "Hydrodynamic Solver Benchmark Baseline",
    category: "Physics Ground Truth",
    summary:
      "Runs high-fidelity 2D Shallow Water Equations using Godunov-type finite-volume numerical schemes to produce physically conservative training basins.",
    formula: "∂U/∂t + ∂F(U)/∂x + ∂G(U)/∂y = S(U)",
    formulaNote:
      "High-order Riemann solvers (HLLC/Roe) with hydrostatic reconstruction and wet-dry front tracking across complex curbs and channels.",
    inputs: [
      "Topographic Hydro-Mesh",
      "Precipitation Forcing Hyetographs",
      "Inflow / Outflow Boundary Conditions",
    ],
    outputs: [
      "Conservation Ground-Truth Ensembles",
      "2D Water Depth Field: h(x, y, t)",
      "Velocity Vector Fields: u, v(x, y, t)",
    ],
    resolution: "Full mesh cells (10^6 nodes)",
    processingTime: "240 mins (Offline Benchmark)",
    iconName: "Cpu",
  },
  {
    step: "04",
    title: "Physics-Informed Neural Operator Forecast",
    category: "Sub-Second AI Inference",
    summary:
      "The Crestix Fourier Neural Operator (FNO/PINO) ingests current terrain, water state, and forecasted rainfall to predict forward inundation depths in under 50 milliseconds.",
    formula: "G_θ: (z_bed, R_t, h_t) ↦ (h_{t+Δt}, u_{t+Δt}, v_{t+Δt})",
    formulaNote:
      "Spectral convolution layers with hard physics-loss residual penalty enforcing near-zero fluid mass destruction and momentum equilibrium.",
    inputs: [
      "Continuous Topographic Embeddings",
      "4-Hour Projected Rainfall Hyetographs",
      "Current Sensor Water Depth Vector",
    ],
    outputs: [
      "4-Hour Continuous Inundation Field",
      "Street-Level Peak Water Depth & Timing",
      "Critical Transportation Asset Hazard Mask",
    ],
    resolution: "Continuous (Mesh-Invariant)",
    processingTime: "< 42 milliseconds",
    iconName: "Zap",
  },
  {
    step: "05",
    title: "Physical Sensor Validation & Closed Loop",
    category: "Edge Hardware Feedback",
    summary:
      "Autonomous solar-powered ESP32 nodes equipped with waterproof ultrasonic transducers measure physical surface water levels, streaming backhaul data for Kalman assimilation.",
    formula: "d_water = H_datum - (v_sound(T) · Δt_echo / 2)",
    formulaNote:
      "Temperature-compensated acoustic time-of-flight verification cross-checks surrogate predictions at critical culverts, bridges, and underpasses.",
    inputs: [
      "Ultrasonic Acoustic Return Echoes (μs)",
      "Ambient Temperature Thermistor (NTC)",
      "Cellular / LoRaWAN RSSI Telemetry",
    ],
    outputs: [
      "Calibrated Real-World Water Depth (±2mm)",
      "Surrogate Error Residual Covariance",
      "Dynamic Catchment Feedback Correction",
    ],
    resolution: "±2mm acoustic precision",
    processingTime: "10-second pulse interval",
    iconName: "Radio",
  },
];
