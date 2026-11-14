# CRESTIX PROBE — MEMBER 7 ↔ MEMBER 9 SENSOR TELEMETRY PAYLOAD CONTRACT

**Owner (Frontend / Sensor Monitoring UI):** Member 7 (`feature/member-7-sensors`)  
**Owner (Backend Ingestion / Broker Bridge):** Member 9  
**Hardware Node:** ESP32 (`ESP32-WROOM-FLOOD-01`) + Ultrasonic Water-Distance Probe (`HC-SR04` / `JSN-SR04T`) + Ambient Temperature Probe (`DS18B20`) + Optional LDR (`GL5528`)

---

## 1. Physical Geometry & Data Integrity Rules

1. **Distance vs. Water Depth Separation (Mandatory):**
   - `measuredDistanceCm` is the raw vertical air-gap distance from the ultrasonic transducer face down to the water surface.
   - `referenceHeightCm` is the calibrated vertical distance from the ultrasonic transducer face down to the dry miniature terrain bed at the active measurement position (`P1`, `P2`, or `P3`).
   - `calculatedWaterDepthCm` is strictly derived as:
     $$\text{Water Depth (cm)} = \max\left(0, \text{referenceHeightCm} - \text{measuredDistanceCm}\right)$$
   - If `measuredDistanceCm > referenceHeightCm + 0.5 cm`, `calculatedWaterDepthCm` is clamped to `0` and `calibrationUnderflowWarning` is set to `true` (`faultCode: "DISTANCE_EXCEEDS_REFERENCE"`).
2. **Point-Elevation Scope Disclaimer:**
   - The single ultrasonic probe mounted at `P1`, `P2`, or `P3` measures **point water elevation at that specific station only** and must never be labeled as full-basin coverage.
3. **Truthful Connection & Simulation Status:**
   - Simulated readings MUST carry `"sourceMode": "SIMULATED"`.
   - When the ESP32 heartbeat or WebSocket/MQTT stream drops, `connectionState` MUST transition to `"DISCONNECTED"` or `"RECONNECTING"` — never report a disconnected sensor as `"ONLINE"` or `"CONNECTED"`.
4. **Staleness Window:**
   - Readings older than `staleThresholdMs` (default `6000` ms) are flagged as `"STALE"` (`faultCode: "STALE_TELEMETRY_WINDOW"`).

---

## 2. REST API Endpoints

### `POST /api/sensor/readings`
Ingests a new raw reading from the ESP32 HTTP bridge, MQTT worker, or hardware test bench.

**Request Body (`SensorIngestPayload`):**
```json
{
  "experimentId": "EXP-2026-FLOOD-01",
  "deviceId": "ESP32-WROOM-FLOOD-01",
  "firmwareVersion": "v2.4.1-probe",
  "timestamp": "2026-11-14T08:00:00.000Z",
  "deviceMillis": 148500,
  "position": "P2",
  "sourceMode": "LIVE",
  "measuredDistanceCm": 23.40,
  "referenceHeightCm": 32.50,
  "ambientTemperatureC": 24.3,
  "ldrLightLevelLux": 418,
  "rssiDbm": -56,
  "faultCode": "NONE"
}
```

### `GET /api/sensor/latest?experimentId=EXP-2026-FLOOD-01&position=P2`
Returns the latest normalized `SensorReading` and freshness evaluation.

**Response (`SensorLatestResponse`):**
```json
{
  "ok": true,
  "reading": {
    "readingId": "rd-1794643200000-42",
    "experimentId": "EXP-2026-FLOOD-01",
    "timestamp": "2026-11-14T08:00:00.000Z",
    "deviceMillis": 148500,
    "position": "P2",
    "sourceMode": "LIVE",
    "measuredDistanceCm": 23.4,
    "referenceHeightCm": 32.5,
    "calculatedWaterDepthCm": 9.1,
    "calibrationUnderflowWarning": false,
    "ambientTemperatureC": 24.3,
    "ldrLightLevelLux": 418,
    "rssiDbm": -56,
    "faultCode": "NONE"
  },
  "stale": false,
  "staleAgeMs": 420,
  "serverTimestamp": "2026-11-14T08:00:00.420Z"
}
```

### `GET /api/sensor/history?experimentId=EXP-2026-FLOOD-01&position=ALL&limit=50`
Returns ordered historical telemetry frames for live charting and CSV export.

**Response (`SensorHistoryResponse`):**
```json
{
  "ok": true,
  "experimentId": "EXP-2026-FLOOD-01",
  "positionFilter": "ALL",
  "count": 1,
  "readings": [],
  "serverTimestamp": "2026-11-14T08:00:01.000Z"
}
```

### `GET /api/sensor/status`
Returns ESP32 connectivity state, transport protocol, active experiment/position, and per-sensor diagnostics.

**Response (`SensorStatusResponse`):**
```json
{
  "ok": true,
  "deviceId": "ESP32-WROOM-FLOOD-01",
  "firmwareVersion": "v2.4.1-probe",
  "connectionState": "CONNECTED",
  "activeProtocol": "WEBSOCKET",
  "sourceMode": "LIVE",
  "lastHeartbeatIso": "2026-11-14T08:00:00.000Z",
  "staleThresholdMs": 6000,
  "isStale": false,
  "activePosition": "P2",
  "activeExperimentId": "EXP-2026-FLOOD-01",
  "sensors": [
    {
      "sensorId": "ultrasonic_hcsr04",
      "name": "Ultrasonic Water-Distance Probe",
      "hardwareModel": "JSN-SR04T / HC-SR04 (Trig GPIO5, Echo GPIO18)",
      "status": "ONLINE",
      "optional": false,
      "lastUpdatedIso": "2026-11-14T08:00:00.000Z",
      "faultCode": "NONE",
      "faultMessage": "Acoustic echo locked on water surface; reference depth computation nominal.",
      "signalQualityPct": 98
    }
  ],
  "serverTimestamp": "2026-11-14T08:00:00.420Z"
}
```

---

## 3. WebSocket & MQTT Streaming Envelope

- **WebSocket Endpoint:** `ws://<host>/api/sensor/stream`
- **MQTT Broker Topic:** `crestix/probe/sensors/telemetry` (over WebSocket `ws://<broker>:9001/mqtt`)

**Message Frame (`RealtimeSensorEnvelope`):**
```json
{
  "event": "sensor.reading",
  "topic": "crestix/probe/sensors/telemetry",
  "payload": {
    "readingId": "rd-1794643200000-42",
    "experimentId": "EXP-2026-FLOOD-01",
    "timestamp": "2026-11-14T08:00:00.000Z",
    "deviceMillis": 148500,
    "position": "P2",
    "sourceMode": "LIVE",
    "measuredDistanceCm": 23.4,
    "referenceHeightCm": 32.5,
    "calculatedWaterDepthCm": 9.1,
    "calibrationUnderflowWarning": false,
    "ambientTemperatureC": 24.3,
    "ldrLightLevelLux": 418,
    "rssiDbm": -56,
    "faultCode": "NONE"
  },
  "sentAt": "2026-11-14T08:00:00.005Z"
}
```
