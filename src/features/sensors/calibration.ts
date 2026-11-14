import type {
  MeasurementPositionId,
  PositionCalibration,
  SensorFaultCode,
  SensorIngestPayload,
  SensorReading,
} from "./types.ts";

/**
 * Calibrated physical positions on the miniature flood terrain rig.
 * Note: A single ultrasonic probe mounted at a position only measures point elevation
 * at that specific channel location, NOT the entire flood basin.
 */
export const POSITION_CALIBRATIONS: Record<
  MeasurementPositionId,
  PositionCalibration
> = {
  P1: {
    id: "P1",
    label: "P1 — Upstream Headwater Channel",
    zoneName: "Upper Gorge Inflow",
    coordinatesLabel: "X: 12.0 cm, Y: 8.5 cm (Bed Elev: +4.2 cm)",
    referenceHeightCm: 28.0,
    warningDepthCm: 6.5,
    criticalDepthCm: 10.0,
    description:
      "Primary inflow neck right below the miniature spillway gate. Detects initial surge wave arrival.",
  },
  P2: {
    id: "P2",
    label: "P2 — Mid-Basin Floodplain Bridge",
    zoneName: "Central Settlement Plain",
    coordinatesLabel: "X: 45.0 cm, Y: 22.0 cm (Bed Elev: +2.0 cm)",
    referenceHeightCm: 32.5,
    warningDepthCm: 8.0,
    criticalDepthCm: 12.5,
    description:
      "Central floodplain constriction near scaled urban structures. Critical for overbank inundation monitoring.",
  },
  P3: {
    id: "P3",
    label: "P3 — Downstream Retention Outflow",
    zoneName: "Lower Delta Basin",
    coordinatesLabel: "X: 78.5 cm, Y: 31.0 cm (Bed Elev: +0.5 cm)",
    referenceHeightCm: 35.0,
    warningDepthCm: 9.5,
    criticalDepthCm: 14.5,
    description:
      "Downstream drainage weir and retention basin. Measures cumulative flood retention and drainage lag.",
  },
};

export const DEFAULT_STALE_THRESHOLD_MS = 6000;

/**
 * Tolerance (in cm) for minor ultrasonic acoustic jitter when the bed is dry.
 * If measuredDistanceCm > referenceHeightCm + UNDERFLOW_TOLERANCE_CM,
 * we flag a calibration underflow warning (e.g. sensor mount bumped or wrong position selected).
 */
export const UNDERFLOW_TOLERANCE_CM = 0.5;

export interface WaterDepthCalculationResult {
  calculatedWaterDepthCm: number | null;
  calibrationUnderflowWarning: boolean;
  derivedFaultCode: SensorFaultCode;
}

/**
 * Computes water depth from ultrasonic distance to water surface and calibrated reference height.
 *
 * Formula:
 *   Water Depth (cm) = max(0, Reference Height (cm) - Measured Distance (cm))
 *
 * Rules:
 * - Never confuses measured distance (sensor-to-water air gap) with water depth.
 * - If measuredDistanceCm is null, NaN, or <= 0 (sensor blind zone / echo timeout), returns null.
 * - If measuredDistanceCm > referenceHeightCm + tolerance, clamps water depth to 0 and sets
 *   calibrationUnderflowWarning = true so the operator knows the reference height or position may be mismatched.
 */
export function calculateWaterDepth(
  measuredDistanceCm: number | null | undefined,
  referenceHeightCm: number
): WaterDepthCalculationResult {
  if (
    measuredDistanceCm === null ||
    measuredDistanceCm === undefined ||
    !Number.isFinite(measuredDistanceCm) ||
    measuredDistanceCm <= 0
  ) {
    return {
      calculatedWaterDepthCm: null,
      calibrationUnderflowWarning: false,
      derivedFaultCode: "ULTRASONIC_ECHO_TIMEOUT",
    };
  }

  if (!Number.isFinite(referenceHeightCm) || referenceHeightCm <= 0) {
    return {
      calculatedWaterDepthCm: null,
      calibrationUnderflowWarning: true,
      derivedFaultCode: "DISTANCE_EXCEEDS_REFERENCE",
    };
  }

  const rawDelta = referenceHeightCm - measuredDistanceCm;

  if (rawDelta < -UNDERFLOW_TOLERANCE_CM) {
    return {
      calculatedWaterDepthCm: 0,
      calibrationUnderflowWarning: true,
      derivedFaultCode: "DISTANCE_EXCEEDS_REFERENCE",
    };
  }

  const clampedDepth = Math.max(0, Math.round(rawDelta * 100) / 100);
  return {
    calculatedWaterDepthCm: clampedDepth,
    calibrationUnderflowWarning: false,
    derivedFaultCode: "NONE",
  };
}

/**
 * Evaluates whether a sensor reading timestamp is stale compared to `nowMs`.
 */
export function evaluateStaleStatus(
  timestampIso: string | null | undefined,
  nowMs: number = Date.now(),
  thresholdMs: number = DEFAULT_STALE_THRESHOLD_MS
): { isStale: boolean; ageMs: number | null } {
  if (!timestampIso) {
    return { isStale: true, ageMs: null };
  }
  const parsed = Date.parse(timestampIso);
  if (Number.isNaN(parsed)) {
    return { isStale: true, ageMs: null };
  }
  const ageMs = Math.max(0, nowMs - parsed);
  return {
    isStale: ageMs > thresholdMs,
    ageMs,
  };
}

/**
 * Normalizes an incoming ingestion payload into a full `SensorReading` record.
 */
export function normalizeIngestedReading(
  payload: SensorIngestPayload,
  readingIndex: number = 1
): SensorReading {
  const position: MeasurementPositionId =
    payload.position && POSITION_CALIBRATIONS[payload.position]
      ? payload.position
      : "P1";

  const referenceHeightCm =
    typeof payload.referenceHeightCm === "number" &&
    payload.referenceHeightCm > 0
      ? payload.referenceHeightCm
      : POSITION_CALIBRATIONS[position].referenceHeightCm;

  const normalizedDistance =
    typeof payload.measuredDistanceCm === "number" &&
    Number.isFinite(payload.measuredDistanceCm)
      ? Math.round(payload.measuredDistanceCm * 100) / 100
      : null;

  const depthResult = calculateWaterDepth(
    normalizedDistance,
    referenceHeightCm
  );

  const faultCode: SensorFaultCode =
    payload.faultCode && payload.faultCode !== "NONE"
      ? payload.faultCode
      : depthResult.derivedFaultCode;

  const timestamp = payload.timestamp || new Date().toISOString();

  return {
    readingId: `rd-${Date.parse(timestamp) || Date.now()}-${readingIndex}`,
    experimentId: payload.experimentId || "EXP-2026-FLOOD-01",
    deviceId: payload.deviceId,
    firmwareVersion: payload.firmwareVersion,
    timestamp,
    deviceMillis: payload.deviceMillis ?? 0,
    position,
    sourceMode: payload.sourceMode === "LIVE" ? "LIVE" : "SIMULATED",
    measuredDistanceCm: normalizedDistance,
    referenceHeightCm,
    calculatedWaterDepthCm: depthResult.calculatedWaterDepthCm,
    calibrationUnderflowWarning: depthResult.calibrationUnderflowWarning,
    ambientTemperatureC:
      typeof payload.ambientTemperatureC === "number" &&
      Number.isFinite(payload.ambientTemperatureC)
        ? Math.round(payload.ambientTemperatureC * 10) / 10
        : null,
    ldrLightLevelLux:
      typeof payload.ldrLightLevelLux === "number" &&
      Number.isFinite(payload.ldrLightLevelLux)
        ? Math.round(payload.ldrLightLevelLux)
        : null,
    rssiDbm:
      typeof payload.rssiDbm === "number" && Number.isFinite(payload.rssiDbm)
        ? Math.round(payload.rssiDbm)
        : null,
    faultCode,
  };
}
