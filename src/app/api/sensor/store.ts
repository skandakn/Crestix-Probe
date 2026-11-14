import {
  DEFAULT_STALE_THRESHOLD_MS,
  POSITION_CALIBRATIONS,
  calculateWaterDepth,
  evaluateStaleStatus,
  normalizeIngestedReading,
} from "@/features/sensors/calibration";
import {
  buildSensorStatusSnapshot,
  deriveIndividualSensorHealth,
  generateSeedHistory,
} from "@/features/sensors/api";
import type {
  DataSourceMode,
  Esp32ConnectionState,
  MeasurementPositionId,
  RealtimeSensorEnvelope,
  SensorFaultCode,
  SensorIngestPayload,
  SensorReading,
  SensorStatusResponse,
} from "@/features/sensors/types";

// Maximum historical readings retained in memory
const MAX_HISTORY_ITEMS = 500;

interface GlobalSensorTelemetryState {
  readings: SensorReading[];
  latestByKey: Map<string, SensorReading>;
  lastHeartbeatIso: string | null;
  deviceId: string;
  firmwareVersion: string;
  subscribers: Set<(envelope: RealtimeSensorEnvelope) => void>;
}

// Global singleton pattern for Next.js hot-reloading preservation
declare global {
  // eslint-disable-next-line no-var
  var __crestixSensorStore: GlobalSensorTelemetryState | undefined;
}

function initializeStore(): GlobalSensorTelemetryState {
  const seedReadings = generateSeedHistory(24, {
    experimentId: "EXP-2026-FLOOD-01",
    position: "P2",
    ldrEnabled: true,
    injectedFault: "NONE",
    esp32ConnectionSimulated: "SIMULATED_STREAM",
  });

  const latestMap = new Map<string, SensorReading>();
  for (const r of seedReadings) {
    latestMap.set(`${r.experimentId}:${r.position}`, r);
    latestMap.set(`ALL:${r.position}`, r);
  }

  return {
    readings: seedReadings,
    latestByKey: latestMap,
    lastHeartbeatIso: seedReadings[seedReadings.length - 1]?.timestamp ?? null,
    deviceId: "ESP32-WROOM-FLOOD-01",
    firmwareVersion: "v2.5.0-aqua",
    subscribers: new Set(),
  };
}

const store: GlobalSensorTelemetryState =
  globalThis.__crestixSensorStore ?? (globalThis.__crestixSensorStore = initializeStore());

/**
 * Normalizes any incoming JSON payload from ESP32 firmware, HTTP bridge, or manual test bench.
 * Supports both snake_case (standard Arduino/C++ conventions) and camelCase (TypeScript contracts).
 */
export function normalizeIncomingPayload(
  raw: Record<string, unknown>,
  stepIndex: number = store.readings.length + 1
): SensorReading {
  const experimentId = String(
    raw.experimentId || raw.experiment_id || "EXP-2026-FLOOD-01"
  );
  const deviceId = String(
    raw.deviceId || raw.device_id || raw.node_id || raw.nodeId || "ESP32-WROOM-FLOOD-01"
  );
  const firmwareVersion = String(
    raw.firmwareVersion || raw.firmware_version || "v2.5.0-aqua"
  );

  // Position normalization (P1, P2, P3)
  const rawPos = String(
    raw.position || raw.location_id || "P2"
  ).toUpperCase();
  const position: MeasurementPositionId =
    rawPos === "P1" || rawPos === "P2" || rawPos === "P3" ? rawPos : "P2";

  // Teammate firmware calibration: totalHeightCm = 28.63 cm
  const defaultRef =
    typeof raw.totalHeightCm === "number" && raw.totalHeightCm > 0
      ? raw.totalHeightCm
      : typeof raw.total_height_cm === "number" && raw.total_height_cm > 0
      ? raw.total_height_cm
      : POSITION_CALIBRATIONS[position]?.referenceHeightCm ?? 28.63;

  const rawRefHeight =
    raw.referenceHeightCm ??
    raw.reference_height_cm ??
    raw.mount_height_cm ??
    defaultRef;
  const referenceHeightCm =
    typeof rawRefHeight === "number" && Number.isFinite(rawRefHeight) && rawRefHeight > 0
      ? rawRefHeight
      : defaultRef;

  // Direct water depth from teammate's ESP32 probe (depth_sonic)
  const candidateDirectDepth =
    typeof raw.depth_sonic === "number" && Number.isFinite(raw.depth_sonic)
      ? raw.depth_sonic
      : typeof raw.depthSonic === "number" && Number.isFinite(raw.depthSonic)
      ? raw.depthSonic
      : typeof raw.water_depth_cm === "number" && Number.isFinite(raw.water_depth_cm)
      ? raw.water_depth_cm
      : null;

  // Raw distance parsing
  let measuredDistanceCm: number | null = null;
  const candidateDistance =
    raw.measuredDistanceCm ??
    raw.measured_distance_cm ??
    raw.raw_distance_cm ??
    raw.distance_cm ??
    raw.distance;

  if (
    candidateDistance !== null &&
    candidateDistance !== undefined &&
    typeof candidateDistance === "number" &&
    Number.isFinite(candidateDistance) &&
    candidateDistance > 0
  ) {
    measuredDistanceCm = Math.round(candidateDistance * 100) / 100;
  } else if (candidateDirectDepth !== null) {
    // If ESP32 sends calculated depth_sonic directly:
    measuredDistanceCm = Math.max(0, Math.round((referenceHeightCm - candidateDirectDepth) * 100) / 100);
  }

  // Temperature parsing (supports temp_c from Dallas DS18B20)
  let ambientTemperatureC: number | null = null;
  const candidateTemp =
    raw.ambientTemperatureC ??
    raw.ambient_temperature_c ??
    raw.temperature_c ??
    raw.temp_c ??
    raw.temperature;
  if (
    candidateTemp !== null &&
    candidateTemp !== undefined &&
    typeof candidateTemp === "number" &&
    Number.isFinite(candidateTemp)
  ) {
    ambientTemperatureC = Math.round(candidateTemp * 10) / 10;
  }

  // Teammate 6-pin contact probe array parsing [p0, p1, p2, p3, p4, p5]
  let depthProbes: number[] | undefined = undefined;
  if (Array.isArray(raw.depth_probes)) {
    depthProbes = raw.depth_probes.map((v) => (Number(v) > 0 ? 1 : 0));
  } else if (Array.isArray(raw.depthProbes)) {
    depthProbes = raw.depthProbes.map((v) => (Number(v) > 0 ? 1 : 0));
  }

  // LDR parsing
  let ldrLightLevelLux: number | null = null;
  const candidateLdr =
    raw.ldrLightLevelLux ??
    raw.ldr_light_level_lux ??
    raw.light_lux ??
    raw.ldr;
  if (
    candidateLdr !== null &&
    candidateLdr !== undefined &&
    typeof candidateLdr === "number" &&
    Number.isFinite(candidateLdr)
  ) {
    ldrLightLevelLux = Math.round(candidateLdr);
  }

  // RSSI parsing
  let rssiDbm: number | null = null;
  const candidateRssi = raw.rssiDbm ?? raw.rssi_dbm ?? raw.rssi;
  if (
    candidateRssi !== null &&
    candidateRssi !== undefined &&
    typeof candidateRssi === "number" &&
    Number.isFinite(candidateRssi)
  ) {
    rssiDbm = Math.round(candidateRssi);
  }

  // Source Mode & Fault Code
  const sourceMode: DataSourceMode =
    raw.sourceMode === "SIMULATED" || raw.source_mode === "SIMULATED"
      ? "SIMULATED"
      : "LIVE";

  const rawFault = String(raw.faultCode || raw.fault_code || "NONE");
  const faultCode: SensorFaultCode =
    rawFault === "ULTRASONIC_ECHO_TIMEOUT" ||
    rawFault === "DISTANCE_EXCEEDS_REFERENCE" ||
    rawFault === "TEMP_ONEWIRE_CRC_ERROR" ||
    rawFault === "LDR_ADC_SATURATED" ||
    rawFault === "STALE_TELEMETRY_WINDOW" ||
    rawFault === "ESP32_HEARTBEAT_LOST"
      ? rawFault
      : "NONE";

  const timestamp =
    typeof raw.timestamp === "string" && raw.timestamp.length > 0
      ? raw.timestamp
      : new Date().toISOString();

  const deviceMillis =
    typeof raw.deviceMillis === "number"
      ? raw.deviceMillis
      : typeof raw.device_millis === "number"
        ? raw.device_millis
        : Date.now() % 10000000;

  const ingestPayload: SensorIngestPayload = {
    experimentId,
    deviceId,
    firmwareVersion,
    timestamp,
    deviceMillis,
    position,
    sourceMode,
    measuredDistanceCm,
    referenceHeightCm,
    ambientTemperatureC,
    ldrLightLevelLux,
    rssiDbm,
    faultCode,
    depthProbes,
  };

  return normalizeIngestedReading(ingestPayload, stepIndex);
}

/**
 * Persists an incoming sensor reading, updates device heartbeat, and broadcasts via SSE.
 */
export function recordSensorReading(rawPayload: Record<string, unknown>): SensorReading {
  const reading = normalizeIncomingPayload(rawPayload, store.readings.length + 1);

  // Append to ring buffer
  store.readings.push(reading);
  if (store.readings.length > MAX_HISTORY_ITEMS) {
    store.readings = store.readings.slice(store.readings.length - MAX_HISTORY_ITEMS);
  }

  // Update latest caches
  store.latestByKey.set(`${reading.experimentId}:${reading.position}`, reading);
  store.latestByKey.set(`ALL:${reading.position}`, reading);
  store.latestByKey.set("LATEST_OVERALL", reading);

  store.lastHeartbeatIso = reading.timestamp;
  if (rawPayload.deviceId || rawPayload.device_id) {
    store.deviceId = String(rawPayload.deviceId || rawPayload.device_id);
  }
  if (rawPayload.firmwareVersion || rawPayload.firmware_version) {
    store.firmwareVersion = String(rawPayload.firmwareVersion || rawPayload.firmware_version);
  }

  // Dispatch real-time envelope to all active SSE subscribers
  const envelope: RealtimeSensorEnvelope = {
    event: "sensor.reading",
    topic: "crestix/probe/sensors/telemetry",
    payload: reading,
    sentAt: new Date().toISOString(),
  };

  for (const subscriber of store.subscribers) {
    try {
      subscriber(envelope);
    } catch {
      // Ignore dead subscriber; handled in onclose
    }
  }

  return reading;
}

/**
 * Retrieves latest sensor reading.
 */
export function getLatestSensorReading(
  experimentId?: string,
  position?: MeasurementPositionId
): SensorReading | null {
  if (experimentId && position) {
    const key = `${experimentId}:${position}`;
    if (store.latestByKey.has(key)) return store.latestByKey.get(key)!;
  }

  if (position) {
    const key = `ALL:${position}`;
    if (store.latestByKey.has(key)) return store.latestByKey.get(key)!;
  }

  // Search in reverse
  for (let i = store.readings.length - 1; i >= 0; i--) {
    const r = store.readings[i];
    if (experimentId && r.experimentId !== experimentId) continue;
    if (position && r.position !== position) continue;
    return r;
  }

  return store.readings[store.readings.length - 1] ?? null;
}

/**
 * Retrieves historical readings list with optional filters.
 */
export function getSensorHistory(
  experimentId?: string,
  position?: MeasurementPositionId | "ALL",
  limit: number = 50
): SensorReading[] {
  let list = store.readings;
  if (experimentId) {
    list = list.filter((r) => r.experimentId === experimentId);
  }
  if (position && position !== "ALL") {
    list = list.filter((r) => r.position === position);
  }
  return list.slice(Math.max(0, list.length - limit));
}

/**
 * Derives current sensor status snapshot.
 */
export function getSensorStatus(
  experimentId?: string,
  position?: MeasurementPositionId
): SensorStatusResponse {
  const activePosition: MeasurementPositionId = position ?? "P2";
  const activeExperimentId = experimentId ?? "EXP-2026-FLOOD-01";
  const latest = getLatestSensorReading(activeExperimentId, activePosition);
  const nowMs = Date.now();

  const staleEval = evaluateStaleStatus(
    latest?.timestamp,
    nowMs,
    DEFAULT_STALE_THRESHOLD_MS
  );

  const connectionState: Esp32ConnectionState =
    latest === null
      ? "DISCONNECTED"
      : staleEval.isStale
        ? "RECONNECTING"
        : latest.sourceMode === "LIVE"
          ? "CONNECTED"
          : "SIMULATED_STREAM";

  return {
    ok: true,
    deviceId: store.deviceId,
    firmwareVersion: store.firmwareVersion,
    connectionState,
    activeProtocol: "WEBSOCKET",
    sourceMode: latest?.sourceMode ?? "LIVE",
    lastHeartbeatIso: store.lastHeartbeatIso,
    staleThresholdMs: DEFAULT_STALE_THRESHOLD_MS,
    isStale: staleEval.isStale,
    activePosition,
    activeExperimentId,
    sensors: deriveIndividualSensorHealth(
      latest,
      connectionState,
      staleEval.isStale,
      true
    ),
    serverTimestamp: new Date(nowMs).toISOString(),
  };
}

/**
 * Adds an SSE stream listener. Returns unsubscription cleanup callback.
 */
export function subscribeToSensorStream(
  listener: (envelope: RealtimeSensorEnvelope) => void
): () => void {
  store.subscribers.add(listener);
  return () => {
    store.subscribers.delete(listener);
  };
}
