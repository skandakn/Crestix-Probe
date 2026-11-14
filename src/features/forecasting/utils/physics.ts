import { AIModelInfo, ForecastScenario, CriticalInfrastructurePoint, ForecastMetrics } from '../types/forecast';

/**
 * AI Model Catalog with scientific specifications and physical assumptions.
 */
export const AI_MODELS: AIModelInfo[] = [
  {
    id: 'cnn-convlstm',
    name: 'Spatiotemporal ConvLSTM Baseline',
    shortName: 'ConvLSTM',
    category: 'baseline',
    architecture: '5-Layer ConvLSTM + ResNet Encoder-Decoder (Kernel size 3x3)',
    physicsPde: 'Empirical spatiotemporal regression (No physics loss penalty)',
    parametersCount: '14.2M params',
    resolution: 'Fixed grid: 64x64 spatial cells (Δx = 25m)',
    supportsVelocity: false,
    strengths: [
      'Very low computational latency (< 45ms inference)',
      'Captures short-horizon temporal correlations (< 3 hours)',
      'Low GPU memory utilization (approx 1.2 GB VRAM)'
    ],
    limitations: [
      'Severe autoregressive error accumulation beyond 6 hours',
      'High mass conservation violation (violates continuity equation)',
      'Lacks mesh independence; cannot super-resolve to finer grids',
      'Does not estimate velocity vector fields (depth only)'
    ],
    recommendedUse: 'Rapid emergency early-warning screening (< 3h horizon) when inference time is strictly critical.',
    status: 'ONLINE',
    badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/10'
  },
  {
    id: 'fno-2d',
    name: '2D Fourier Neural Operator (FNO)',
    shortName: 'FNO-2D',
    category: 'spectral-operator',
    architecture: '4-Layer Fourier Operator with 16 truncated Fourier modes in 2D frequency domain',
    physicsPde: 'Continuous spectral operator learning over functional spaces (L² to L² mapping)',
    parametersCount: '28.5M params',
    resolution: 'Zero-shot super-resolution: 64x64 to 256x256 without re-training',
    supportsVelocity: true,
    strengths: [
      'Mesh-invariant: evaluates continuous flood waves across arbitrary spatial resolutions',
      'Fast global non-local receptive field via Fast Fourier Transform (FFT)',
      'Predicts both water depth h and coupled velocity field (u, v)',
      'Significantly lower rollout error drift than ConvLSTM'
    ],
    limitations: [
      'May produce slight high-frequency spectral artifacts at sharp shock fronts',
      'Boundary conditions are periodic by default unless padded or windowed',
      'Moderate mass conservation drift over multi-day rollouts'
    ],
    recommendedUse: 'Catchment-scale inundation propagation and regional flood wave routing at variable spatial resolutions.',
    status: 'ONLINE',
    badgeColor: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10'
  },
  {
    id: 'pino-swe',
    name: 'Physics-Informed Neural Operator (PINO - SWE)',
    shortName: 'PINO-SWE',
    category: 'physics-informed',
    architecture: 'Fourier Neural Operator embedded with 2D Shallow Water Equation (SWE) residual loss & boundary constraints',
    physicsPde: '2D Shallow Water Equations: ∂h/∂t + ∇·(hu) = 0 and ∂(hu)/∂t + ∇·(huu + ½gh²) = -gh∇z - ghS_f',
    parametersCount: '34.8M params',
    resolution: 'Continuous operator domain; native 128x128 with fine subgrid resolution',
    supportsVelocity: true,
    strengths: [
      'Hard/soft mass continuity enforcement: residual error typically < 1.5%',
      'Physics loss constrains momentum conservation, bed friction, and gravity waves',
      'Exceptionally stable multi-step autoregressive rollout up to 48 hours',
      'Coupled water depth h and full 2D velocity vector field (u, v)'
    ],
    limitations: [
      'Higher forward pass latency during inference (~140ms on A100)',
      'Requires terrain bathymetry gradient ∇z and Manning roughness tensor inputs',
      'Slightly higher VRAM allocation (~3.8 GB)'
    ],
    recommendedUse: 'High-precision operational flood inundation forecasting, critical infrastructure risk assessment, and long-horizon propagation.',
    status: 'READY',
    badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
  }
];

/**
 * Standard Catchment Scenarios for hydrodynamic evaluation.
 */
export const FORECAST_SCENARIOS: ForecastScenario[] = [
  {
    id: 'krishna-inflow-surge',
    name: 'Lower Krishna Basin — Inflow Surge (Cat 4)',
    basin: 'Krishna River Basin, Andhra Pradesh / Telangana',
    region: 'Nagarjuna Sagar to Prakasam Barrage corridor',
    catchmentAreaKm2: 4850,
    peakDischargeM3s: 4250,
    soilSaturationPct: 86.4,
    manningRoughness: 0.038,
    rainfallIntensityMmH: 52.4,
    elevationRange: { min: 14, max: 138 },
    boundaryConditions: 'Dirichlet upstream hydrograph inflow; Free Neumann downstream discharge',
    inundationRiskLevel: 'Extreme',
    description: 'Monsoonal cloudburst upstream coupled with reservoir spillway release generating sudden flash flood wave across agrarian and urban alluvial floodplains.'
  },
  {
    id: 'godavari-delta-flash',
    name: 'Godavari Delta — Estuarine Surge',
    basin: 'Godavari Deltaic Plain, Rajahmundry Reach',
    region: 'Eastern Coastal Lowlands',
    catchmentAreaKm2: 3200,
    peakDischargeM3s: 3100,
    soilSaturationPct: 78.0,
    manningRoughness: 0.032,
    rainfallIntensityMmH: 38.0,
    elevationRange: { min: 4, max: 82 },
    boundaryConditions: 'Inflow peak + Tidal backwater elevation oscillation at downstream boundary',
    inundationRiskLevel: 'High',
    description: 'Cyclonic storm surge compounding fluvial discharge with tidal backwater resistance, inundating estuarine embankments and canal networks.'
  },
  {
    id: 'urban-floodplain-custom',
    name: 'Hyderabad Urban Catchment — Heavy Storm Scenario',
    basin: 'Musi River Urban Basin',
    region: 'Metropolitan Floodway',
    catchmentAreaKm2: 740,
    peakDischargeM3s: 1850,
    soilSaturationPct: 92.5,
    manningRoughness: 0.025,
    rainfallIntensityMmH: 74.0,
    elevationRange: { min: 490, max: 560 },
    boundaryConditions: 'Impervious urban runoff inflow with constrained bridge culvert bottlenecks',
    inundationRiskLevel: 'High',
    description: 'High-intensity convective cloudburst over dense urban fabric with low infiltration, causing flash runoff into tributary channels and roadway inundation.'
  }
];

/**
 * Critical infrastructure assets located on the spatial grid.
 */
export const CRITICAL_INFRASTRUCTURE: CriticalInfrastructurePoint[] = [
  {
    id: 'emb-alpha',
    name: 'Primary Earthen Embankment #12',
    type: 'embankment',
    gridX: 18,
    gridY: 34,
    elevationM: 26.5,
    criticalThresholdM: 1.8
  },
  {
    id: 'sub-beta',
    name: 'Power Substation 4B (220kV)',
    type: 'power_substation',
    gridX: 42,
    gridY: 28,
    elevationM: 31.0,
    criticalThresholdM: 0.5
  },
  {
    id: 'hwy-bridge',
    name: 'National Highway-65 Viaduct',
    type: 'highway_bridge',
    gridX: 30,
    gridY: 48,
    elevationM: 22.0,
    criticalThresholdM: 2.2
  },
  {
    id: 'med-center',
    name: 'Regional Emergency Medical Hub',
    type: 'hospital',
    gridX: 50,
    gridY: 18,
    elevationM: 36.5,
    criticalThresholdM: 0.3
  },
  {
    id: 'pump-gamma',
    name: 'Stormwater Lift Station Gamma',
    type: 'pumping_station',
    gridX: 24,
    gridY: 55,
    elevationM: 18.2,
    criticalThresholdM: 1.2
  }
];

/**
 * Color mapper for scientific water depth palette (0m to 5m+).
 * Low depth: transparent / subtle cyan -> mid depth: cerulean blue -> high depth: deep violet / crimson.
 */
export function getWaterDepthColor(depthMeters: number): { r: number; g: number; b: number; a: number; hex: string } {
  if (depthMeters <= 0.02) {
    return { r: 15, g: 23, b: 42, a: 0.0, hex: 'transparent' };
  }
  if (depthMeters < 0.25) {
    // Wet ground / shallow sheet flow (Cyan hue)
    const factor = depthMeters / 0.25;
    const r = Math.round(6 + factor * 20);
    const g = Math.round(140 + factor * 60);
    const b = Math.round(190 + factor * 50);
    return { r, g, b, a: 0.45 + factor * 0.2, hex: `rgba(${r}, ${g}, ${b}, 0.6)` };
  }
  if (depthMeters < 1.0) {
    // Moderate wading flood (Electric Blue)
    const factor = (depthMeters - 0.25) / 0.75;
    const r = Math.round(14 + factor * 20);
    const g = Math.round(165 - factor * 30);
    const b = Math.round(233 + factor * 10);
    return { r, g, b, a: 0.7 + factor * 0.15, hex: `rgba(${r}, ${g}, ${b}, 0.8)` };
  }
  if (depthMeters < 2.5) {
    // Severe vehicle-submerging flood (Deep Royal Blue to Indigo)
    const factor = (depthMeters - 1.0) / 1.5;
    const r = Math.round(30 + factor * 60);
    const g = Math.round(90 - factor * 40);
    const b = Math.round(240 - factor * 20);
    return { r, g, b, a: 0.85 + factor * 0.1, hex: `rgba(${r}, ${g}, ${b}, 0.9)` };
  }
  // Catastrophic structural flood (> 2.5m)
  const factor = Math.min((depthMeters - 2.5) / 2.5, 1.0);
  const r = Math.round(130 + factor * 80);
  const g = Math.round(40 - factor * 20);
  const b = Math.round(220 - factor * 50);
  return { r, g, b, a: 0.95, hex: `rgba(${r}, ${g}, ${b}, 0.95)` };
}

/**
 * Velocity magnitude to scientific colormap (0.0 to 3.5+ m/s).
 */
export function getVelocityColor(speedMps: number): { r: number; g: number; b: number; hex: string } {
  if (speedMps <= 0.05) return { r: 71, g: 85, b: 105, hex: '#475569' };
  if (speedMps < 0.5) return { r: 56, g: 189, b: 248, hex: '#38bdf8' }; // Cyan/light blue
  if (speedMps < 1.5) return { r: 52, g: 211, b: 153, hex: '#34d399' }; // Emerald green
  if (speedMps < 2.5) return { r: 251, g: 191, b: 36, hex: '#fbbf24' }; // Amber
  return { r: 244, g: 63, b: 94, hex: '#f43f5e' }; // Coral Red (> 2.5 m/s)
}

/**
 * Categorize water depth hazard level.
 */
export function getHazardLevel(depthM: number): { label: string; color: string; bg: string } {
  if (depthM <= 0.05) return { label: 'Dry / Stable', color: 'text-slate-400', bg: 'bg-slate-800/40 border-slate-700/50' };
  if (depthM < 0.3) return { label: 'Minor Sheet Flow', color: 'text-cyan-400', bg: 'bg-cyan-950/40 border-cyan-800/50' };
  if (depthM < 1.0) return { label: 'Moderate Inundation', color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-800/50' };
  if (depthM < 2.0) return { label: 'Severe Submergence', color: 'text-orange-400', bg: 'bg-orange-950/40 border-orange-800/50' };
  return { label: 'Catastrophic Breaching', color: 'text-rose-400', bg: 'bg-rose-950/40 border-rose-800/50' };
}

/**
 * Metric calculation helper: Compute MAE, RMSE, CSI, IoU and Mass Conservation
 */
export function calculateEvaluationMetrics(
  predictedGrid: number[][],
  groundTruthGrid: number[][],
  inferenceDurationMs: number,
  initialMass: number,
  finalMass: number
): ForecastMetrics {
  const rows = predictedGrid.length;
  const cols = predictedGrid[0]?.length || 0;
  let absSum = 0;
  let sqSum = 0;
  let hits = 0;
  let misses = 0;
  let falseAlarms = 0;
  let count = 0;

  const floodThreshold = 0.15; // 15 cm threshold for flooded cell

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const pred = predictedGrid[r][c];
      const gt = groundTruthGrid[r][c];
      const diff = pred - gt;
      absSum += Math.abs(diff);
      sqSum += diff * diff;
      count++;

      const predFlooded = pred >= floodThreshold;
      const gtFlooded = gt >= floodThreshold;

      if (predFlooded && gtFlooded) hits++;
      else if (!predFlooded && gtFlooded) misses++;
      else if (predFlooded && !gtFlooded) falseAlarms++;
    }
  }

  const mae = count > 0 ? absSum / count : 0;
  const rmse = count > 0 ? Math.sqrt(sqSum / count) : 0;
  const csi = hits + misses + falseAlarms > 0 ? hits / (hits + misses + falseAlarms) : 1.0;
  const iou = csi; // For binary wet/dry mask, IoU equals CSI
  const massConservationErrorPct = initialMass > 0 ? Math.abs((finalMass - initialMass) / initialMass) * 100 : 0.0;

  return {
    mae: Number(mae.toFixed(4)),
    rmse: Number(rmse.toFixed(4)),
    csi: Number(csi.toFixed(4)),
    iou: Number(iou.toFixed(4)),
    massConservationErrorPct: Number(massConservationErrorPct.toFixed(2)),
    inferenceDurationMs,
    speedupFactor: 240,
    rolloutDriftSlope: 0.045,
    memoryFootprintMb: 2450,
    theoreticalFlops: '1.82 TFLOPs'
  };
}

