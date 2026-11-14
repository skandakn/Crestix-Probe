import assert from "node:assert/strict";
import { test } from "vitest";
import {
  POSITION_CALIBRATIONS,
  calculateWaterDepth,
  evaluateStaleStatus,
  normalizeIngestedReading,
} from "./calibration.ts";
import { buildSensorReadingsCsv, CSV_HEADERS } from "./csvExport.ts";
import {
  buildSensorStatusSnapshot,
  createSimulatedReading,
  deriveIndividualSensorHealth,
} from "./api.ts";

test("calculateWaterDepth computes depth strictly as referenceHeightCm - measuredDistanceCm", () => {
  // P2 reference height is 32.5 cm. If ultrasonic sensor measures 22.5 cm to water surface,
  // water depth must be 10.0 cm (never 22.5 cm).
  const res = calculateWaterDepth(22.5, POSITION_CALIBRATIONS.P2.referenceHeightCm);
  assert.equal(res.calculatedWaterDepthCm, 10.0);
  assert.equal(res.calibrationUnderflowWarning, false);
  assert.equal(res.derivedFaultCode, "NONE");
});

test("calculateWaterDepth handles ultrasonic echo timeout (null or <= 0 distance) without faking depth", () => {
  const nullRes = calculateWaterDepth(null, 28.0);
  assert.equal(nullRes.calculatedWaterDepthCm, null);
  assert.equal(nullRes.derivedFaultCode, "ULTRASONIC_ECHO_TIMEOUT");

  const zeroRes = calculateWaterDepth(0, 28.0);
  assert.equal(zeroRes.calculatedWaterDepthCm, null);
  assert.equal(zeroRes.derivedFaultCode, "ULTRASONIC_ECHO_TIMEOUT");
});

test("calculateWaterDepth flags calibrationUnderflowWarning when distance exceeds reference height", () => {
  // Reference height is 28.0 cm, measured distance is 31.2 cm (> 28.0 + 0.5 tolerance)
  const underflow = calculateWaterDepth(31.2, 28.0);
  assert.equal(underflow.calculatedWaterDepthCm, 0);
  assert.equal(underflow.calibrationUnderflowWarning, true);
  assert.equal(underflow.derivedFaultCode, "DISTANCE_EXCEEDS_REFERENCE");
});

test("evaluateStaleStatus detects stale readings accurately", () => {
  const now = Date.parse("2026-11-14T08:10:00.000Z");
  const freshIso = "2026-11-14T08:09:57.000Z"; // 3s old
  const staleIso = "2026-11-14T08:09:50.000Z"; // 10s old

  const freshEval = evaluateStaleStatus(freshIso, now, 6000);
  assert.equal(freshEval.isStale, false);
  assert.equal(freshEval.ageMs, 3000);

  const staleEval = evaluateStaleStatus(staleIso, now, 6000);
  assert.equal(staleEval.isStale, true);
  assert.equal(staleEval.ageMs, 10000);
});

test("never shows a disconnected sensor as connected or online", () => {
  const sampleReading = createSimulatedReading(
    1,
    {
      experimentId: "EXP-TEST-01",
      position: "P1",
      ldrEnabled: true,
      injectedFault: "NONE",
      esp32ConnectionSimulated: "DISCONNECTED",
    },
    "2026-11-14T08:00:00.000Z"
  );

  const healthList = deriveIndividualSensorHealth(
    sampleReading,
    "DISCONNECTED",
    true,
    true
  );

  for (const sensor of healthList) {
    assert.notEqual(
      sensor.status,
      "ONLINE",
      `Sensor ${sensor.sensorId} must not be ONLINE when ESP32 is DISCONNECTED`
    );
    assert.equal(sensor.status, "OFFLINE");
  }

  const snapshot = buildSensorStatusSnapshot({
    latest: sampleReading,
    connectionState: "DISCONNECTED",
    activeProtocol: "WEBSOCKET",
    sourceMode: "LIVE",
    activePosition: "P1",
    activeExperimentId: "EXP-TEST-01",
    ldrEnabled: true,
    nowMs: Date.parse("2026-11-14T08:00:02.000Z"),
  });

  assert.equal(snapshot.connectionState, "DISCONNECTED");
  assert.equal(snapshot.isStale, true);
});

test("buildSensorReadingsCsv exports all required columns with distinct distance and depth", () => {
  const reading = normalizeIngestedReading(
    {
      experimentId: "EXP-CSV-99",
      deviceId: "ESP32-WROOM-FLOOD-01",
      firmwareVersion: "v2.4.1-probe",
      timestamp: "2026-11-14T08:30:00.000Z",
      deviceMillis: 15000,
      position: "P3",
      sourceMode: "SIMULATED",
      measuredDistanceCm: 25.0,
      referenceHeightCm: 35.0,
      ambientTemperatureC: 24.5,
      ldrLightLevelLux: 412,
      rssiDbm: -55,
      faultCode: "NONE",
    },
    7
  );

  const csv = buildSensorReadingsCsv([reading]);
  const lines = csv.split("\n");
  assert.equal(lines.length, 2);
  assert.equal(lines[0], CSV_HEADERS.join(","));
  assert.match(lines[1], /EXP-CSV-99/);
  assert.match(lines[1], /SIMULATED/);
  assert.match(lines[1], /25\.00,35\.00,10\.00/);
});
