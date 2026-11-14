export interface SimulationScenario {
  id: string;
  name: string;
  subtitle: string;
  rainfallIntensity: string; // e.g., "78 mm/h"
  durationMinutes: number;
  returnPeriod: string; // e.g., "1-in-100 Year"
  description: string;
  timesteps: {
    minute: number;
    maxDepthMeters: number;
    inundatedAreaKm2: number;
    peakDischargeM3s: number;
    riskLevel: "nominal" | "advisory" | "warning" | "critical";
    sensorReadings: {
      nodeId: string;
      label: string;
      elevationM: number;
      waterDepthM: number;
      surfaceVelocityMs: number;
      status: "nominal" | "rising" | "critical";
    }[];
    // Polyline or grid contour points for vector rendering
    floodZones: {
      id: string;
      path: string;
      depthLevel: number; // 1 to 4
      velocityVector: { x: number; y: number };
    }[];
  }[];
}

export interface WorkflowStage {
  step: string;
  title: string;
  category: string;
  summary: string;
  formula?: string;
  formulaNote?: string;
  inputs: string[];
  outputs: string[];
  resolution: string;
  processingTime: string;
  iconName: string;
}

export interface SensorNodeTelemetry {
  nodeId: string;
  hwVersion: string;
  status: "ONLINE" | "TRANSMITTING" | "SLEEP";
  distanceCm: number;
  waterLevelM: number;
  rateOfRiseCmH: number;
  batteryV: number;
  rssiDbm: number;
  tempC: number;
  lastPing: string;
  coordinates: { lat: number; lng: number };
}

export interface TechnologyPillar {
  id: string;
  num: string;
  title: string;
  tagline: string;
  primaryEquation: string;
  equationDescription: string;
  breakdown: {
    term: string;
    meaning: string;
  }[];
  coreAdvantages: string[];
  academicContext: string;
}

export interface ResearchBenchmark {
  gridResolution: string;
  spatialNodes: string;
  numericalSolverTime: string;
  fnoSurrogateTime: string;
  speedupFactor: string;
  relativeL2Error: string;
  massConservationLoss: string;
  calibrationStatus: "Illustrative Prototype";
}

