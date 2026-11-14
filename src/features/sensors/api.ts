import {
  DEFAULT_STALE_THRESHOLD_MS,
  POSITION_CALIBRATIONS,
  evaluateStaleStatus,
  normalizeIngestedReading,
} from "./calibration";
import type {
  DataSourceMode,
  Esp32ConnectionState,
  IndividualSensorHealth,
  MeasurementPositionId,
  SensorFaultCode,
  SensorHistoryResponse,
  SensorIngestPayload,
  SensorLatestResponse,
  SensorReading,
  SensorStatusResponse,
  TransportProtocol,
} from "./types";

export interface SimulationConfig {
  experimentId: string;
  position: MeasurementPositionId;
  customReferenceHeightCm?: number;
  ldrEnabled: boolean;
  injectedFault: SensorFaultCode;
  esp32ConnectionSimulated: Esp32ConnectionState;
}

/**
 * Generates a realistic hydrograph wave reading for the physical flood terrain prototype.
 * Used ONLY when sourceMode is explicitly "SIMULATED" or for seeding initial history.
 */
export function createSimulatedReading(
  stepIndex: number,
  config: SimulationConfig,
  timestampIso: string = new Date().toISOString()
): SensorReading {
  const cal = POSITION_CALIBRATIONS[config.position];
  const refHeight = config.customReferenceHeightCm ?? cal.referenceHeightCm;

  // Hydrograph wave simulation: rises, crests, and slowly recedes
  const phase = (stepIndex % 60) / 60;
  const surgeWaveCm =
    Math.sin(phase * Math.PI) * (cal.warningDepthCm * 1.15) +
    Math.sin(stepIndex * 0.45) * 0.45;
  const targetDepthCm = Math.max(0.4, Math.min(refHeight - 3.5, surgeWaveCm));

  let measuredDistanceCm: number | null =
    Math.round((refHeight - targetDepthCm) * 100) / 100;
  let ambientTemperatureC: number | null =
    Math.round((24.2 + Math.sin(stepIndex * 0.12) * 0.6) * 10) / 10;
  let ldrLightLevelLux: number | null = config.ldrEnabled
    ? Math.round(410 + Math.cos(stepIndex * 0.2) * 35)
    : null;

  if (config.injectedFault === "ULTRASONIC_ECHO_TIMEOUT") {
    measuredDistanceCm = null;
  } else if (config.injectedFault === "DISTANCE_EXCEEDS_REFERENCE") {
    measuredDistanceCm = refHeight + 4.25;
  } else if (config.injectedFault === "TEMP_ONEWIRE_CRC_ERROR") {
    ambientTemperatureC = null;
  } else if (config.injectedFault === "LDR_ADC_SATURATED" && config.ldrEnabled) {
    ldrLightLevelLux = 4095;
  }

  return normalizeIngestedReading(
    {
      experimentId: config.experimentId,
      deviceId: "ESP32-WROOM-FLOOD-01",
      firmwareVersion: "v2.4.1-probe",
      timestamp: timestampIso,
      deviceMillis: stepIndex * 1500,
      position: config.position,
      sourceMode: "SIMULATED",
      measuredDistanceCm,
      referenceHeightCm: refHeight,
      ambientTemperatureC,
      ldrLightLevelLux,
      rssiDbm: -58 + Math.round(Math.sin(stepIndex * 0.3) * 4),
      faultCode: config.injectedFault,
    },
    stepIndex
  );
}

/**
 * Generates an initial sequence of historical readings so the chart and table
 * immediately show meaningful context upon opening the operational console.
 */
export function generateSeedHistory(
  count: number = 24,
  config: SimulationConfig,
  nowMs?: number
): SensorReading[] {
  const currentMs = nowMs ?? 1773489600000;
  const readings: SensorReading[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const ts = new Date(currentMs - i * 2000).toISOString();
    readings.push(
      createSimulatedReading(count - i, { ...config, injectedFault: "NONE" }, ts)
    );
  }
  return readings;
}

/**
 * Derives per-sensor hardware status indicators from the latest reading, connection state,
 * and staleness evaluation. Never reports a disconnected or timed-out sensor as ONLINE.
 */
export function deriveIndividualSensorHealth(
  latest: SensorReading | null,
  connectionState: Esp32ConnectionState,
  isStale: boolean,
  ldrEnabled: boolean
): IndividualSensorHealth[] {
  const isDisconnected = connectionState === "DISCONNECTED";
  const lastUpdatedIso = latest?.timestamp ?? null;

  // 1. Ultrasonic Water-Distance Sensor (HC-SR04 / JSN-SR04T)
  let ultrasonicStatus: IndividualSensorHealth["status"] = "ONLINE";
  let ultrasonicFault: SensorFaultCode = "NONE";
  let ultrasonicMsg: string | null =
    "Acoustic echo locked on water surface; reference depth computation nominal.";

  if (isDisconnected || !latest) {
    ultrasonicStatus = "OFFLINE";
    ultrasonicFault = "ESP32_HEARTBEAT_LOST";
    ultrasonicMsg = "ESP32 telemetry link offline — no ultrasonic echo frames received.";
  } else if (
    latest.measuredDistanceCm === null ||
    latest.faultCode === "ULTRASONIC_ECHO_TIMEOUT"
  ) {
    ultrasonicStatus = "FAULT";
    ultrasonicFault = "ULTRASONIC_ECHO_TIMEOUT";
    ultrasonicMsg =
      "Ultrasonic echo timeout (no pulse return within 38 ms). Check transducer alignment or foam scatter.";
  } else if (
    latest.calibrationUnderflowWarning ||
    latest.faultCode === "DISTANCE_EXCEEDS_REFERENCE"
  ) {
    ultrasonicStatus = "DEGRADED";
    ultrasonicFault = "DISTANCE_EXCEEDS_REFERENCE";
    ultrasonicMsg = `Measured distance (${latest.measuredDistanceCm.toFixed(2)} cm) exceeds reference height (${latest.referenceHeightCm.toFixed(2)} cm). Depth clamped to 0.00 cm; verify P1/P2/P3 mount calibration.`;
  } else if (isStale) {
    ultrasonicStatus = "STALE";
    ultrasonicFault = "STALE_TELEMETRY_WINDOW";
    ultrasonicMsg =
      "Last ultrasonic reading exceeded freshness window (>6.0 s). Holding last known frame with stale warning.";
  }

  // 2. Ambient Temperature Sensor (DS18B20 / DHT22)
  let tempStatus: IndividualSensorHealth["status"] = "ONLINE";
  let tempFault: SensorFaultCode = "NONE";
  let tempMsg: string | null =
    "Ambient air temperature nominal; speed-of-sound acoustic compensation active.";

  if (isDisconnected || !latest) {
    tempStatus = "OFFLINE";
    tempFault = "ESP32_HEARTBEAT_LOST";
    tempMsg = "ESP32 telemetry link offline — ambient temperature unavailable.";
  } else if (
    latest.ambientTemperatureC === null ||
    latest.faultCode === "TEMP_ONEWIRE_CRC_ERROR"
  ) {
    tempStatus = "FAULT";
    tempFault = "TEMP_ONEWIRE_CRC_ERROR";
    tempMsg =
      "OneWire bus CRC mismatch or sensor unplugged on GPIO4. Falling back to default 24.0 °C acoustic speed.";
  } else if (isStale) {
    tempStatus = "STALE";
    tempFault = "STALE_TELEMETRY_WINDOW";
    tempMsg = "Ambient temperature reading is stale (>6.0 s).";
  }

  // 3. Optional LDR (Photoresistor on ADC1_CH6)
  let ldrStatus: IndividualSensorHealth["status"] = ldrEnabled
    ? "ONLINE"
    : "NOT_INSTALLED";
  let ldrFault: SensorFaultCode = "NONE";
  let ldrMsg: string | null = ldrEnabled
    ? "Auxiliary laboratory illumination telemetry active on GPIO34 (ADC1)."
    : "Optional LDR channel disabled for this experiment profile.";

  if (ldrEnabled) {
    if (isDisconnected || !latest) {
      ldrStatus = "OFFLINE";
      ldrFault = "ESP32_HEARTBEAT_LOST";
      ldrMsg = "ESP32 telemetry link offline — LDR ADC channel unavailable.";
    } else if (latest.faultCode === "LDR_ADC_SATURATED") {
      ldrStatus = "DEGRADED";
      ldrFault = "LDR_ADC_SATURATED";
      ldrMsg =
        "ADC1 reading saturated at 4095 (12-bit rail). Check overhead floodlight glare or voltage divider resistor.";
    } else if (latest.ldrLightLevelLux === null) {
      ldrStatus = "OFFLINE";
      ldrFault = "NONE";
      ldrMsg = "No LDR reading present in latest ESP32 frame.";
    } else if (isStale) {
      ldrStatus = "STALE";
      ldrFault = "STALE_TELEMETRY_WINDOW";
      ldrMsg = "LDR telemetry reading is stale (>6.0 s).";
    }
  }

  return [
    {
      sensorId: "ultrasonic_hcsr04",
      name: "Ultrasonic Water-Distance Probe",
      hardwareModel: "JSN-SR04T / HC-SR04 (Trig GPIO5, Echo GPIO18)",
      status: ultrasonicStatus,
      optional: false,
      lastUpdatedIso,
      faultCode: ultrasonicFault,
      faultMessage: ultrasonicMsg,
      signalQualityPct:
        ultrasonicStatus === "ONLINE"
          ? 98
          : ultrasonicStatus === "DEGRADED" || ultrasonicStatus === "STALE"
            ? 64
            : 0,
    },
    {
      sensorId: "temp_ds18b20",
      name: "Ambient Temperature Probe",
      hardwareModel: "DS18B20 Waterproof 1-Wire (GPIO4)",
      status: tempStatus,
      optional: false,
      lastUpdatedIso,
      faultCode: tempFault,
      faultMessage: tempMsg,
      signalQualityPct:
        tempStatus === "ONLINE" ? 99 : tempStatus === "STALE" ? 70 : 0,
    },
    {
      sensorId: "ldr_photoresistor",
      name: "Ambient Light Sensor (Optional LDR)",
      hardwareModel: "GL5528 Photoresistor ADC1_CH6 (GPIO34)",
      status: ldrStatus,
      optional: true,
      lastUpdatedIso: ldrEnabled ? lastUpdatedIso : null,
      faultCode: ldrFault,
      faultMessage: ldrMsg,
      signalQualityPct: !ldrEnabled
        ? null
        : ldrStatus === "ONLINE"
          ? 95
          : ldrStatus === "DEGRADED" || ldrStatus === "STALE"
            ? 55
            : 0,
    },
  ];
}

export const DEFAULT_HARDWARE_BACKEND_URL = "https://crestix-probe-aqua.onrender.com";
export const DEFAULT_HARDWARE_INGEST_URL = `${DEFAULT_HARDWARE_BACKEND_URL}/api/sensor/readings`;
export const DEFAULT_HARDWARE_STREAM_URL = `${DEFAULT_HARDWARE_BACKEND_URL}/api/sensor/stream`;

/**
 * Helper to resolve backend endpoint on server or client.
 */
export function getSensorApiEndpoint(path: string, baseUrl?: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (baseUrl && baseUrl.trim() !== "") {
    return `${baseUrl.replace(/\/$/, "")}${cleanPath}`;
  }
  if (typeof window === "undefined" && process.env.BACKEND_URL) {
    return `${process.env.BACKEND_URL.replace(/\/$/, "")}${cleanPath}`;
  }
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SENSOR_API_URL) {
    return `${process.env.NEXT_PUBLIC_SENSOR_API_URL.replace(/\/$/, "")}${cleanPath}`;
  }
  return cleanPath;
}

/**
 * Client API helpers for Member 9 Backend Endpoints:
 * - GET /api/sensor/latest
 * - GET /api/sensor/history
 * - POST /api/sensor/readings
 * - GET /api/sensor/status
 */
export async function fetchSensorLatest(
  experimentId?: string,
  position?: MeasurementPositionId,
  baseUrl?: string
): Promise<SensorLatestResponse | null> {
  try {
    const params = new URLSearchParams();
    if (experimentId) params.set("experimentId", experimentId);
    if (position) params.set("position", position);
    const url = getSensorApiEndpoint(`/api/sensor/latest?${params.toString()}`, baseUrl);
    const res = await fetch(url, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as SensorLatestResponse;
  } catch {
    return null;
  }
}

export async function fetchSensorHistory(
  experimentId?: string,
  position?: MeasurementPositionId | "ALL",
  limit: number = 50,
  baseUrl?: string
): Promise<SensorHistoryResponse | null> {
  try {
    const params = new URLSearchParams();
    if (experimentId) params.set("experimentId", experimentId);
    if (position) params.set("position", position);
    params.set("limit", String(limit));
    const url = getSensorApiEndpoint(`/api/sensor/history?${params.toString()}`, baseUrl);
    const res = await fetch(url, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as SensorHistoryResponse;
  } catch {
    return null;
  }
}

export async function postSensorReading(
  payload: SensorIngestPayload,
  baseUrl?: string
): Promise<{ ok: boolean; reading?: SensorReading; error?: string }> {
  try {
    const url = getSensorApiEndpoint("/api/sensor/readings", baseUrl);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    return (await res.json()) as { ok: boolean; reading?: SensorReading };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export async function fetchSensorStatus(baseUrl?: string): Promise<SensorStatusResponse | null> {
  try {
    const url = getSensorApiEndpoint("/api/sensor/status", baseUrl);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as SensorStatusResponse;
  } catch {
    return null;
  }
}

/**
 * Establishes a real-time Server-Sent Events (SSE) telemetry connection.
 * Returns an unsubscription callback.
 */
export function connectSensorSseStream(
  onReading: (reading: SensorReading) => void,
  onStatusChange?: (state: Esp32ConnectionState) => void,
  customStreamUrl?: string
): () => void {
  if (typeof window === "undefined" || typeof EventSource === "undefined") {
    return () => {};
  }

  const endpoint = customStreamUrl || getSensorApiEndpoint("/api/sensor/stream");
  let eventSource: EventSource | null = null;
  let isClosed = false;

  try {
    onStatusChange?.("RECONNECTING");
    eventSource = new EventSource(endpoint);

    eventSource.onopen = () => {
      if (isClosed) return;
      onStatusChange?.("CONNECTED");
    };

    eventSource.addEventListener("sensor.reading", (e: MessageEvent) => {
      if (isClosed) return;
      try {
        const parsed = JSON.parse(e.data);
        const reading = "payload" in parsed ? (parsed.payload as SensorReading) : (parsed as SensorReading);
        if (reading && ("measuredDistanceCm" in reading || "calculatedWaterDepthCm" in reading)) {
          onReading(reading);
          onStatusChange?.("CONNECTED");
        }
      } catch {
        // Ignore malformed frame
      }
    });

    eventSource.addEventListener("connect", () => {
      if (isClosed) return;
      onStatusChange?.("CONNECTED");
    });

    eventSource.onerror = () => {
      if (isClosed) return;
      onStatusChange?.("DISCONNECTED");
    };
  } catch {
    onStatusChange?.("DISCONNECTED");
  }

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}

/**
 * Builds a complete `SensorStatusResponse` object from current telemetry state.
 */
export function buildSensorStatusSnapshot(params: {
  latest: SensorReading | null;
  connectionState: Esp32ConnectionState;
  activeProtocol: TransportProtocol;
  sourceMode: DataSourceMode;
  activePosition: MeasurementPositionId;
  activeExperimentId: string;
  ldrEnabled: boolean;
  nowMs?: number;
}): SensorStatusResponse {
  const staleEval = evaluateStaleStatus(
    params.latest?.timestamp,
    params.nowMs ?? Date.now(),
    DEFAULT_STALE_THRESHOLD_MS
  );

  // Never show a disconnected sensor as connected
  const effectiveConnectionState: Esp32ConnectionState =
    params.sourceMode === "SIMULATED" && params.connectionState === "CONNECTED"
      ? "SIMULATED_STREAM"
      : params.connectionState;

  const isStale =
    effectiveConnectionState === "DISCONNECTED" ? true : staleEval.isStale;

  return {
    ok: true,
    deviceId: "ESP32-WROOM-FLOOD-01",
    firmwareVersion: "v2.4.1-probe",
    connectionState: effectiveConnectionState,
    activeProtocol: params.activeProtocol,
    sourceMode: params.sourceMode,
    lastHeartbeatIso: params.latest?.timestamp ?? null,
    staleThresholdMs: DEFAULT_STALE_THRESHOLD_MS,
    isStale,
    activePosition: params.activePosition,
    activeExperimentId: params.activeExperimentId,
    sensors: deriveIndividualSensorHealth(
      params.latest,
      effectiveConnectionState,
      isStale,
      params.ldrEnabled
    ),
    serverTimestamp: new Date(params.nowMs ?? Date.now()).toISOString(),
  };
}
