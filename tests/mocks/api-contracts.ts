/**
 * Centralized API contracts and mock payloads for Crestix Probe integration & E2E testing.
 * Mirrors the Member 9 FastAPI backend schemas and Member 4–8 frontend contracts.
 */

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
    path: string;
    timestamp: string;
  };
}

export interface SensorReadingPayload {
  experiment_id: string;
  position: "P1" | "P2" | "P3" | "P4" | string;
  timestamp: string;
  distance_cm: number;
  water_depth_cm: number;
  temperature_c: number;
}

export interface SensorReadingRecord extends SensorReadingPayload {
  id: number;
  raw_distance_cm: number;
  calculated_water_depth_cm: number;
  quality_flag: "VALID" | "STALE" | "OUT_OF_RANGE" | "SIMULATED";
  quality_score: number;
  calibration_metadata: {
    mount_height_cm: number;
    calibration_offset_cm: number;
    temperature_compensated: boolean;
    sensor_type: string;
  };
  ingested_at: string;
}

export const MOCK_HEALTH_RESPONSE = {
  status: "healthy",
  service: "Crestix Probe API",
  version: "0.1.0",
  environment: "test",
  database_connected: true,
  timestamp: "2026-11-14T10:30:00Z",
  engines: {
    hydrodynamic_solver: {
      mode: "stub",
      operational: false,
      note: "Stubbed adapter active; numerical research engine is not yet integrated.",
    },
    ai_forecast_model: {
      mode: "stub",
      operational: false,
      note: "Stubbed adapter active; AI forecast engine is not yet integrated.",
    },
  },
};

export const MOCK_SENSOR_LATEST: SensorReadingRecord = {
  id: 101,
  experiment_id: "EXP001",
  position: "P2",
  timestamp: "2026-11-14T10:30:05Z",
  distance_cm: 8.2,
  water_depth_cm: 11.8,
  raw_distance_cm: 8.2,
  calculated_water_depth_cm: 11.8,
  temperature_c: 29.0,
  quality_flag: "VALID",
  quality_score: 0.98,
  calibration_metadata: {
    mount_height_cm: 20.0,
    calibration_offset_cm: 0.0,
    temperature_compensated: true,
    sensor_type: "HC-SR04 / JSN-SR04T (ESP32)",
  },
  ingested_at: "2026-11-14T10:30:05.120Z",
};

export const MOCK_SENSOR_HISTORY = {
  items: [
    MOCK_SENSOR_LATEST,
    {
      ...MOCK_SENSOR_LATEST,
      id: 100,
      position: "P1",
      timestamp: "2026-11-14T10:29:55Z",
      distance_cm: 9.5,
      water_depth_cm: 10.5,
      raw_distance_cm: 9.5,
      calculated_water_depth_cm: 10.5,
    },
    {
      ...MOCK_SENSOR_LATEST,
      id: 99,
      position: "P3",
      timestamp: "2026-11-14T10:29:45Z",
      distance_cm: 12.1,
      water_depth_cm: 7.9,
      raw_distance_cm: 12.1,
      calculated_water_depth_cm: 7.9,
    },
  ],
  total: 3,
  page: 1,
  page_size: 50,
  total_pages: 1,
};

export const MOCK_TERRAIN_METADATA = {
  id: "TER-001",
  name: "Physical Flume Basin DEM v1",
  description: "2m x 1m physical miniature flood prototype elevation grid",
  file_name: "basin_dem_v1.tif",
  file_size_bytes: 524288,
  content_type: "image/tiff",
  crs: "LOCAL_CM_GRID",
  resolution_cm: 1.0,
  bounds: { min_x: 0, max_x: 200, min_y: 0, max_y: 100, min_z_cm: 0.0, max_z_cm: 18.5 },
  metadata: { grid_rows: 100, grid_cols: 200, nodata_value: -9999 },
  created_at: "2026-11-14T09:00:00Z",
};

export const MOCK_SIMULATION_JOB = {
  id: "SIM-2026-001",
  experiment_id: "EXP001",
  terrain_id: "TER-001",
  rainfall_scenario_id: "RAIN-001",
  status: "completed",
  adapter_mode: "stub",
  is_operational_solver: false,
  engine_notice:
    "STUBBED ADAPTER: Numerical hydrodynamic solver is not yet operational. Synthetic preview frames are provided for frontend and pipeline integration.",
  parameters: {
    duration_seconds: 120,
    time_step_seconds: 10,
    grid_nx: 16,
    grid_ny: 16,
    manning_n: 0.035,
    inflow_rate_l_min: 5.0,
  },
  summary: {
    max_depth_cm: 13.4,
    peak_velocity_m_s: 0.42,
    inundated_fraction: 0.64,
  },
  frame_count: 12,
  created_at: "2026-11-14T10:15:00Z",
  completed_at: "2026-11-14T10:15:02Z",
};

export const MOCK_SIMULATION_FRAMES = {
  simulation_id: "SIM-2026-001",
  experiment_id: "EXP001",
  adapter_mode: "stub",
  is_operational_solver: false,
  engine_notice: MOCK_SIMULATION_JOB.engine_notice,
  total_frames: 3,
  frames: [
    { frame_index: 0, time_seconds: 0, max_depth_cm: 2.1, mean_depth_cm: 0.8 },
    { frame_index: 1, time_seconds: 60, max_depth_cm: 9.8, mean_depth_cm: 4.5 },
    { frame_index: 2, time_seconds: 120, max_depth_cm: 13.4, mean_depth_cm: 6.9 },
  ],
};

export const MOCK_FORECAST_JOB = {
  id: "FC-2026-001",
  experiment_id: "EXP001",
  horizon_seconds: 60,
  status: "completed",
  adapter_mode: "stub",
  is_operational_model: false,
  engine_notice:
    "STUBBED ADAPTER: AI flood forecast research model is not yet operational. Baseline persistence/extrapolation estimates are returned for API integration.",
  input_window: { samples_used: 12, reference_position: "P2" },
  predictions: [
    { lead_time_seconds: 10, position: "P2", predicted_depth_cm: 12.1, lower_ci_cm: 11.5, upper_ci_cm: 12.7 },
    { lead_time_seconds: 30, position: "P2", predicted_depth_cm: 12.6, lower_ci_cm: 11.8, upper_ci_cm: 13.4 },
    { lead_time_seconds: 60, position: "P2", predicted_depth_cm: 13.1, lower_ci_cm: 12.0, upper_ci_cm: 14.2 },
  ],
  created_at: "2026-11-14T10:20:00Z",
  completed_at: "2026-11-14T10:20:01Z",
};

export const MOCK_VALIDATION_METRICS = {
  experiment_id: "EXP001",
  sample_count: 36,
  rmse_cm: 0.42,
  mae_cm: 0.31,
  nse: 0.91,
  r_squared: 0.94,
  bias_cm: -0.08,
  peak_depth_error_cm: 0.35,
  adapter_disclaimer:
    "Simulated and AI forecast comparison series are produced by stubbed integration adapters.",
};

export const MOCK_VALIDATION_COMPARISONS = {
  experiment_id: "EXP001",
  adapter_disclaimer: MOCK_VALIDATION_METRICS.adapter_disclaimer,
  comparisons: [
    {
      position: "P1",
      timestamp: "2026-11-14T10:29:00Z",
      observed_depth_cm: 10.5,
      simulated_depth_cm: 10.2,
      forecast_depth_cm: 10.7,
      residual_sim_cm: -0.3,
      residual_forecast_cm: 0.2,
    },
    {
      position: "P2",
      timestamp: "2026-11-14T10:30:05Z",
      observed_depth_cm: 11.8,
      simulated_depth_cm: 11.5,
      forecast_depth_cm: 12.1,
      residual_sim_cm: -0.3,
      residual_forecast_cm: 0.3,
    },
  ],
};

export function createApiErrorEnvelope(
  code: string,
  message: string,
  path: string,
  details: unknown = null
): ApiErrorEnvelope {
  return {
    error: {
      code,
      message,
      details,
      path,
      timestamp: new Date().toISOString(),
    },
  };
}

export function validateSensorPayload(payload: SensorReadingPayload, mountHeightCm = 20.0): {
  valid: boolean;
  errors: string[];
  calculatedDepthCm: number;
} {
  const errors: string[] = [];

  if (!payload.experiment_id || !/^[A-Za-z0-9_-]{2,64}$/.test(payload.experiment_id)) {
    errors.push("Invalid experiment_id format.");
  }
  if (!["P1", "P2", "P3", "P4"].includes(payload.position)) {
    errors.push("Position must be one of P1, P2, P3, or P4.");
  }
  if (!Number.isFinite(payload.distance_cm) || payload.distance_cm <= 0 || payload.distance_cm > 500) {
    errors.push("distance_cm must be a finite number between 0 and 500 cm.");
  }
  if (!Number.isFinite(payload.water_depth_cm) || payload.water_depth_cm < 0) {
    errors.push("water_depth_cm must be a non-negative finite number.");
  }
  if (payload.distance_cm === payload.water_depth_cm && mountHeightCm !== payload.distance_cm * 2) {
    errors.push("distance_cm and water_depth_cm must not be conflated.");
  }

  const calculatedDepthCm = Number(Math.max(0, mountHeightCm - payload.distance_cm).toFixed(2));
  if (Math.abs(calculatedDepthCm - payload.water_depth_cm) > 0.5) {
    errors.push(
      `Depth calibration mismatch: expected ~${calculatedDepthCm} cm from mount height ${mountHeightCm} cm and distance ${payload.distance_cm} cm, got ${payload.water_depth_cm} cm.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    calculatedDepthCm,
  };
}

export function validateTerrainUploadFile(file: {
  name: string;
  size: number;
  type?: string;
}): { valid: boolean; error?: string } {
  const allowedExtensions = [".tif", ".tiff", ".asc", ".dem", ".geojson", ".json", ".csv", ".xyz"];
  const maxBytes = 50 * 1024 * 1024; // 50 MB

  if (!file.name || file.name.trim() === "") {
    return { valid: false, error: "File name is required." };
  }
  if (file.size <= 0) {
    return { valid: false, error: "Uploaded terrain file is empty (0 bytes)." };
  }
  if (file.size > maxBytes) {
    return { valid: false, error: "Terrain file exceeds maximum allowed size of 50 MB." };
  }
  const lower = file.name.toLowerCase();
  const hasValidExt = allowedExtensions.some((ext) => lower.endsWith(ext));
  if (!hasValidExt) {
    return {
      valid: false,
      error: `Unsupported terrain format. Allowed formats: ${allowedExtensions.join(", ")}`,
    };
  }
  return { valid: true };
}
