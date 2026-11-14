/**
 * CRESTIX PROBE — MEMBER 5: FLOOD SIMULATION WORKSPACE
 * Data Contract Coordinated with Member 9 (Backend Simulation Engine)
 * 
 * Strict SI Units:
 * - Depths, elevation, cell size: meters (m)
 * - Rainfall intensity: millimeters per hour (mm/h)
 * - Time: seconds (s) or minutes (min) as specified
 * - Roughness: Manning's roughness coefficient n (s·m^(-1/3))
 */

export type BoundaryConditionType = "closed" | "open" | "weir" | "inflow";

export type SimulationJobStatus = "idle" | "queued" | "running" | "completed" | "failed";

export interface BoundaryConditionsConfig {
  north: BoundaryConditionType;
  south: BoundaryConditionType;
  east: BoundaryConditionType;
  west: BoundaryConditionType;
}

export interface GridDimensions {
  rows: number;
  cols: number;
  cellSizeMeters: number;
}

export interface TerrainPreset {
  id: string;
  name: string;
  description: string;
  rows: number;
  cols: number;
  cellSizeMeters: number;
  elevationGrid: number[][];
  defaultRoughness: number;
  suggestedRainfallMmPerHour: number;
  suggestedDurationMinutes: number;
}

export interface RainfallConfig {
  intensityMmPerHour: number;
  durationMinutes: number;
}

export interface SimulationRunRequest {
  terrainId: string;
  gridDimensions: GridDimensions;
  elevationGrid?: number[][];
  rainfall: RainfallConfig;
  initialWaterDepthMeters: number;
  surfaceRoughnessManning: number;
  boundaryConditions: BoundaryConditionsConfig;
  timeStepSeconds: number;
  totalDurationMinutes: number;
}

export interface SimulationRunResponse {
  simulationId: string;
  status: SimulationJobStatus;
  createdAt: string;
  totalSteps: number;
  estimatedDurationSeconds?: number;
  message?: string;
}

export interface SimulationStatusResponse {
  simulationId: string;
  status: SimulationJobStatus;
  progressPercentage: number;
  currentStep: number;
  totalSteps: number;
  executionTimeMs: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
  config: SimulationRunRequest;
}

export interface SimulationFrame {
  step: number;
  timeSeconds: number;
  waterDepthGrid: number[][];
  maxDepthMeters: number;
  avgDepthMeters: number;
  floodedCellCount: number;
  totalWaterVolumeM3: number;
}

export interface SimulationFramesResponse {
  simulationId: string;
  rows: number;
  cols: number;
  cellSizeMeters: number;
  elevationGrid: number[][];
  totalFrames: number;
  timeStepSeconds: number;
  frames: SimulationFrame[];
}

export interface DepthThresholdConfig {
  dryThreshold: number;      // e.g. 0.01m (depth <= dryThreshold is Dry)
  shallowThreshold: number;  // e.g. 0.15m (dryThreshold < depth <= shallowThreshold is Shallow)
  moderateThreshold: number; // e.g. 0.50m (shallowThreshold < depth <= moderateThreshold is Moderate; > moderateThreshold is Deep)
  unit: string;
  disclaimer: string;
}

export const DEFAULT_DEPTH_THRESHOLDS: DepthThresholdConfig = {
  dryThreshold: 0.01,
  shallowThreshold: 0.15,
  moderateThreshold: 0.50,
  unit: "m",
  disclaimer: "Visualization classification intervals for UI analysis; not universal safety standards or regulatory flood hazards.",
};
