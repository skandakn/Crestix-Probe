/**
 * CRESTIX PROBE — MEMBER 7: LIVE HARDWARE SENSOR MONITORING
 * Shared Payload & State Contracts (Coordinated with Member 9 Ingestion Backend)
 */

/**
 * Discrete calibration positions along the physical miniature flood terrain.
 * Single ultrasonic sensor does NOT measure the entire flood area at once;
 * it measures point elevation at the selected physical gantry/mount position.
 */
export type MeasurementPositionId = "P1" | "P2" | "P3";

export interface PositionCalibration {
  id: MeasurementPositionId;
  label: string;
  zoneName: string;
  coordinatesLabel: string;
  /**
   * Calibrated vertical distance (cm) from the ultrasonic transducer face
   * down to the dry terrain bed at this specific position.
   * Water Depth = max(0, referenceHeightCm - measuredDistanceCm)
   */
  referenceHeightCm: number;
  /** Warning water depth threshold (cm) at this position */
  warningDepthCm: number;
  /** Critical flood water depth threshold (cm) at this position */
  criticalDepthCm: number;
  description: string;
}

export type DataSourceMode = "LIVE" | "SIMULATED";

export type Esp32ConnectionState =
  | "CONNECTED"
  | "RECONNECTING"
  | "DISCONNECTED"
  | "SIMULATED_STREAM";

export type TransportProtocol = "WEBSOCKET" | "MQTT_OVER_WS" | "HTTP_POLL" | "LOCAL_SIMULATOR";

export type SensorHardwareStatus =
  | "ONLINE"
  | "DEGRADED"
  | "STALE"
  | "OFFLINE"
  | "FAULT"
  | "NOT_INSTALLED";

export type SensorFaultCode =
  | "NONE"
  | "ULTRASONIC_ECHO_TIMEOUT"
  | "DISTANCE_EXCEEDS_REFERENCE"
  | "TEMP_ONEWIRE_CRC_ERROR"
  | "LDR_ADC_SATURATED"
  | "STALE_TELEMETRY_WINDOW"
  | "ESP32_HEARTBEAT_LOST";

export interface IndividualSensorHealth {
  sensorId: "ultrasonic_hcsr04" | "temp_ds18b20" | "ldr_photoresistor";
  name: string;
  hardwareModel: string;
  status: SensorHardwareStatus;
  optional: boolean;
  lastUpdatedIso: string | null;
  faultCode: SensorFaultCode;
  faultMessage: string | null;
  signalQualityPct: number | null;
}

/**
 * Raw and derived telemetry frame for a single timestamped reading.
 * Distance and Water Depth are strictly separated to preserve data integrity.
 */
export interface SensorReading {
  readingId: string;
  experimentId: string;
  /** ISO-8601 UTC timestamp with millisecond precision */
  timestamp: string;
  /** Monotonic uptime milliseconds from ESP32 boot */
  deviceMillis: number;
  /** Physical position where the sensor assembly is mounted (P1, P2, or P3) */
  position: MeasurementPositionId;
  /** Explicit flag indicating whether this reading comes from live ESP32 hardware or simulation */
  sourceMode: DataSourceMode;
  /**
   * Raw ultrasonic distance from sensor face down to water surface (in cm).
   * Null if ultrasonic echo timed out or failed.
   */
  measuredDistanceCm: number | null;
  /**
   * Calibrated dry-bed distance from sensor face at `position` (in cm).
   */
  referenceHeightCm: number;
  /**
   * Calculated vertical water depth at `position` (in cm):
   * waterDepthCm = round(referenceHeightCm - measuredDistanceCm, 2).
   * Null if measuredDistanceCm is null or invalid.
   */
  calculatedWaterDepthCm: number | null;
  /**
   * True if raw distance exceeded referenceHeightCm by more than sensor tolerance,
   * clamping water depth to 0 cm and flagging a calibration anomaly.
   */
  calibrationUnderflowWarning: boolean;
  /** Ambient air/board temperature in degrees Celsius (null if sensor missing/fault) */
  ambientTemperatureC: number | null;
  /** Optional LDR ambient light level in lux or normalized % (null if optional LDR not active/fault) */
  ldrLightLevelLux: number | null;
  /** Wi-Fi RSSI in dBm from ESP32 (null in pure simulation or when disconnected) */
  rssiDbm: number | null;
  /** Fault code attached to this frame */
  faultCode: SensorFaultCode;
}

/**
 * GET /api/sensor/latest response contract (Member 7 <-> Member 9)
 */
export interface SensorLatestResponse {
  ok: boolean;
  reading: SensorReading | null;
  stale: boolean;
  staleAgeMs: number | null;
  serverTimestamp: string;
}

/**
 * GET /api/sensor/history response contract (Member 7 <-> Member 9)
 */
export interface SensorHistoryResponse {
  ok: boolean;
  experimentId: string;
  positionFilter?: MeasurementPositionId | "ALL";
  count: number;
  readings: SensorReading[];
  serverTimestamp: string;
}

/**
 * POST /api/sensor/readings ingestion payload contract (ESP32 / Simulator -> Member 9 Backend)
 */
export interface SensorIngestPayload {
  experimentId: string;
  deviceId: string;
  firmwareVersion: string;
  timestamp?: string;
  deviceMillis: number;
  position: MeasurementPositionId;
  sourceMode: DataSourceMode;
  measuredDistanceCm: number | null;
  referenceHeightCm?: number;
  ambientTemperatureC: number | null;
  ldrLightLevelLux?: number | null;
  rssiDbm?: number | null;
  faultCode?: SensorFaultCode;
}

/**
 * GET /api/sensor/status response contract (Member 7 <-> Member 9)
 */
export interface SensorStatusResponse {
  ok: boolean;
  deviceId: string;
  firmwareVersion: string;
  connectionState: Esp32ConnectionState;
  activeProtocol: TransportProtocol;
  sourceMode: DataSourceMode;
  lastHeartbeatIso: string | null;
  staleThresholdMs: number;
  isStale: boolean;
  activePosition: MeasurementPositionId;
  activeExperimentId: string;
  sensors: IndividualSensorHealth[];
  serverTimestamp: string;
}

/**
 * WebSocket / MQTT real-time envelope format
 * Topic: `crestix/probe/sensors/telemetry` or WS `/api/sensor/stream`
 */
export interface RealtimeSensorEnvelope {
  event: "sensor.reading" | "sensor.status" | "sensor.fault";
  topic: string;
  payload: SensorReading | SensorStatusResponse;
  sentAt: string;
}
