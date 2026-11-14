export interface ProductFeature {
  id: string;
  badge: string;
  title: string;
  description: string;
  technicalSpec: string;
  iconName: string;
  metrics: { label: string; value: string }[];
}

export const PRODUCT_FEATURES: ProductFeature[] = [
  {
    id: "sub-second-inference",
    badge: "AI Surrogate Engine",
    title: "Sub-Second Inundation Inference",
    description:
      "Replaces hours of computationally burdensome finite-volume numerical integration with Fourier Neural Operator forward passes, producing complete 4-hour forward flood forecasts in under 45 milliseconds.",
    technicalSpec: "Spectral FFT operator with parameter truncation at wave number k_max = 32.",
    iconName: "Zap",
    metrics: [
      { label: "Surrogate Latency", value: "< 42 ms" },
      { label: "Benchmark Speedup", value: "3,800x" },
      { label: "Forecast Horizon", value: "4 Hours" },
    ],
  },
  {
    id: "hyperlocal-mesh",
    badge: "Geospatial Bathymetry",
    title: "Hyper-Local 0.5m Topographic Mesh",
    description:
      "Ingests high-resolution airborne LiDAR point clouds, building footprints, curb heights, and underground culvert conduits. Resolves micro-topographic flow pathways that dictate urban flash floods.",
    technicalSpec: "Continuous mesh-invariant representation via coordinate embedding layers.",
    iconName: "Mountain",
    metrics: [
      { label: "Spatial Resolution", value: "0.5 Meter" },
      { label: "Micro-Topography", value: "Curb/Channel" },
      { label: "Obstacle Masking", value: "Cadastral" },
    ],
  },
  {
    id: "mass-conservation",
    badge: "Physics Enforcement",
    title: "Physics-Constrained Mass Conservation",
    description:
      "Unlike unconstrained black-box deep learning models that produce phantom water or unphysical drying, Crestix Probe embeds Saint-Venant residual equations directly into the neural training loss.",
    technicalSpec: "PINO loss formulation: L_total = L_data + λ_mass · ‖∇ · (hu) + ∂h/∂t - R‖².",
    iconName: "ShieldCheck",
    metrics: [
      { label: "Mass Violation", value: "< 0.4% (Illustrative)" },
      { label: "Continuity Error", value: "Bounded" },
      { label: "Stability", value: "CFL-Free" },
    ],
  },
  {
    id: "iot-mesh",
    badge: "Hardware Telemetry",
    title: "Autonomous Edge IoT Sensor Mesh",
    description:
      "Field-deployed ESP32 ultrasonic water-level probes continuously measure real-time stage height at drainage bottlenecks, streaming telemetry via LoRaWAN and Cellular backhaul for closed-loop data assimilation.",
    technicalSpec: "Weatherproof JSN-SR04T acoustic transducer with temperature-compensated time-of-flight.",
    iconName: "Radio",
    metrics: [
      { label: "Measurement Accuracy", value: "±2 mm" },
      { label: "Wireless Protocol", value: "LoRa / NB-IoT" },
      { label: "Battery Autonomy", value: "Solar + 180 Days" },
    ],
  },
  {
    id: "evacuation-routing",
    badge: "Decision Support",
    title: "Hydro-Dynamic Evacuation Routing",
    description:
      "Generates dynamically weighted road network graphs factoring forecasted water depth, flow velocity, and vehicle clearance thresholds (e.g. 15cm for sedans, 30cm for emergency response vehicles).",
    technicalSpec: "Modified Dijkstra graph traversal parameterized by hydrodynamic hazard index (h · v).",
    iconName: "Compass",
    metrics: [
      { label: "Graph Recalculation", value: "Real-time" },
      { label: "Vehicle Thresholds", value: "Multi-Tier" },
      { label: "Route Safety Index", value: "Continuous" },
    ],
  },
  {
    id: "open-standards",
    badge: "Interoperability",
    title: "Open Geospatial & OGC API Pipelines",
    description:
      "Seamlessly export forecast raster depth fields, vector inundation contours, and sensor telemetry directly into GIS tools (QGIS, ArcGIS), GeoServer, and municipal emergency dispatch dashboards.",
    technicalSpec: "Native GeoJSON, Cloud-Optimized GeoTIFF (COG), WMS/WFS map tiles, and NetCDF-4.",
    iconName: "Server",
    metrics: [
      { label: "Export Formats", value: "GeoTIFF / NetCDF" },
      { label: "Web Standards", value: "OGC WMS / WFS" },
      { label: "Streaming API", value: "WebSocket / REST" },
    ],
  },
];

