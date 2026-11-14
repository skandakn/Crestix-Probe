/**
 * Types for AI Forecasting Module (Crestix Probe - Member 6)
 * Supports physics-informed AI models for flood-depth and propagation forecasting.
 */

export type AIModelId = 'cnn-convlstm' | 'fno-2d' | 'pino-swe';

export type ModelCategory = 'baseline' | 'spectral-operator' | 'physics-informed';

export interface AIModelInfo {
  id: AIModelId;
  name: string;
  shortName: string;
  category: ModelCategory;
  architecture: string;
  physicsPde: string;
  parametersCount: string;
  resolution: string;
  supportsVelocity: boolean;
  strengths: string[];
  limitations: string[];
  recommendedUse: string;
  status: 'ONLINE' | 'READY' | 'STANDBY';
  badgeColor: string;
}

export interface ForecastScenario {
  id: string;
  name: string;
  basin: string;
  region: string;
  catchmentAreaKm2: number;
  peakDischargeM3s: number;
  soilSaturationPct: number;
  manningRoughness: number;
  rainfallIntensityMmH: number;
  elevationRange: {
    min: number;
    max: number;
  };
  boundaryConditions: string;
  inundationRiskLevel: 'Moderate' | 'High' | 'Extreme';
  description: string;
}

export type PredictionHorizonHours = 1 | 3 | 6 | 12 | 24 | 48;

export interface CriticalInfrastructurePoint {
  id: string;
  name: string;
  type: 'embankment' | 'power_substation' | 'highway_bridge' | 'hospital' | 'pumping_station';
  gridX: number;
  gridY: number;
  elevationM: number;
  criticalThresholdM: number;
}

export interface ForecastFrame {
  frameIndex: number;
  timestepMinutes: number;
  timestamp: string;
  simulationHour: number;
  inflowM3s: number;
  maxDepthMeters: number;
  meanDepthMeters: number;
  floodedAreaKm2: number;
  massConservationResidual: number;
  /** 2D grid of water depth (meters) */
  depthGrid: number[][];
  /** Optional velocity vector field (m/s) */
  velocityGrid?: {
    u: number[][];
    v: number[][];
    speed: number[][];
  };
  criticalPointDepths: Record<string, number>;
}

export interface ForecastMetrics {
  /** Mean Absolute Error in meters compared to hydrodynamic benchmark */
  mae: number;
  /** Root Mean Squared Error in meters */
  rmse: number;
  /** Critical Success Index / Threat Score (0.0 to 1.0) */
  csi: number;
  /** Intersection over Union of flooded area */
  iou: number;
  /** Mass conservation relative error percentage (ΔM / M₀) */
  massConservationErrorPct: number;
  /** Execution latency for forward pass in milliseconds */
  inferenceDurationMs: number;
  /** Speedup factor compared to 2D Saint-Venant numerical solver */
  speedupFactor: number;
  /** Rollout error drift slope (% increase per simulation hour) */
  rolloutDriftSlope: number;
  /** Hardware memory footprint in MB */
  memoryFootprintMb: number;
  /** Computational FLOPs */
  theoreticalFlops: string;
}

export interface RolloutErrorPoint {
  step: number;
  hour: number;
  mae: number;
  rmse: number;
  massErrorPct: number;
  uncertaintyLower: number;
  uncertaintyUpper: number;
}

export interface ForecastMetadata {
  id: string;
  modelId: AIModelId;
  scenarioId: string;
  horizonHours: PredictionHorizonHours;
  timeStepMinutes: number;
  totalFrames: number;
  gridResolution: {
    width: number;
    height: number;
    dxMeters: number;
    dyMeters: number;
  };
  hardwareBackend: string;
  precision: 'float32' | 'bfloat16' | 'mixed';
  checkpointHash: string;
  physicsLossWeight?: number;
  massConservationEnforced: boolean;
  createdAt: string;
  completedAt: string;
  inferenceDurationMs: number;
  /** Crucial scientific transparency tag */
  isMock: boolean;
  dataSource: 'LIVE_PYTORCH_INFERENCE' | 'SAMPLE_BENCHMARK_DATA';
  scientificDisclaimer: string;
}

export interface ForecastSummary {
  peakDepthM: number;
  peakInundationKm2: number;
  timeToPeakHours: number;
  criticalInfraAtRiskCount: number;
  massResidualPeak: number;
}

export interface ForecastRecord {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  metadata: ForecastMetadata;
  summary: ForecastSummary;
  metrics: ForecastMetrics;
  rolloutErrors: RolloutErrorPoint[];
  frames: ForecastFrame[];
  errorMessage?: string;
}

export interface ForecastPredictParams {
  modelId: AIModelId;
  scenarioId: string;
  horizonHours: PredictionHorizonHours;
  parameters?: {
    physicsLossWeight?: number;
    enforceConservation?: boolean;
    spatialSuperResolution?: 1 | 2 | 4;
    gridResolution?: number;
  };
}

export interface ForecastInitiationResponse {
  id: string;
  status: 'pending' | 'running' | 'completed';
  modelId: AIModelId;
  scenarioId: string;
  horizonHours: number;
  createdAt: string;
  estimatedDurationMs: number;
  isMock: boolean;
  dataSource: 'LIVE_PYTORCH_INFERENCE' | 'SAMPLE_BENCHMARK_DATA';
}

export interface ForecastFramesResponse {
  id: string;
  totalFrames: number;
  timeStepMinutes: number;
  horizonHours: number;
  isMock: boolean;
  frames: ForecastFrame[];
}

export interface ForecastMetricsResponse {
  id: string;
  modelId: AIModelId;
  metrics: ForecastMetrics;
  rolloutErrors: RolloutErrorPoint[];
  isMock: boolean;
}

export interface ModelComparisonRecord {
  modelId: AIModelId;
  modelName: string;
  shortName: string;
  category: ModelCategory;
  supportsVelocity: boolean;
  metrics: ForecastMetrics;
  rolloutErrors: RolloutErrorPoint[];
  isMock: boolean;
  dataSource: 'LIVE_PYTORCH_INFERENCE' | 'SAMPLE_BENCHMARK_DATA';
  testedHorizonHours: number;
  scenarioId: string;
  tradeoffSummary: string;
}

