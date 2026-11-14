import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { NextRequest } from "next/server";
import {
  recordSensorReading,
  normalizeIncomingPayload,
  getLatestSensorReading,
  getSensorHistory,
  getSensorStatus,
  subscribeToSensorStream,
} from "@/app/api/sensor/store";
import { POST as postReading, GET as getHistory } from "@/app/api/sensor/readings/route";
import { GET as getLatest } from "@/app/api/sensor/latest/route";
import { GET as getStatus } from "@/app/api/sensor/status/route";
import { OPTIONS as optionsReading } from "@/app/api/sensor/readings/route";
import {
  DEFAULT_HARDWARE_BACKEND_URL,
  DEFAULT_HARDWARE_INGEST_URL,
  getSensorApiEndpoint,
} from "@/features/sensors/api";

describe("ESP32 Hardware Telemetry & Cloud Integration", () => {
  it("normalizes snake_case payload from Arduino C++ firmware correctly", () => {
    const rawEsp32Payload = {
      device_id: "ESP32-WROOM-FLOOD-01",
      experiment_id: "EXP-2026-FLOOD-01",
      position: "P2",
      distance_cm: 22.5,
      mount_height_cm: 32.5,
      temperature_c: 24.3,
      rssi_dbm: -58,
    };

    const reading = normalizeIncomingPayload(rawEsp32Payload, 100);

    assert.equal(reading.deviceId, "ESP32-WROOM-FLOOD-01");
    assert.equal(reading.experimentId, "EXP-2026-FLOOD-01");
    assert.equal(reading.position, "P2");
    assert.equal(reading.measuredDistanceCm, 22.5);
    assert.equal(reading.referenceHeightCm, 32.5);
    // Depth = 32.5 - 22.5 = 10.0 cm
    assert.equal(reading.calculatedWaterDepthCm, 10.0);
    assert.equal(reading.ambientTemperatureC, 24.3);
    assert.equal(reading.rssiDbm, -58);
    assert.equal(reading.calibrationUnderflowWarning, false);
    assert.equal(reading.faultCode, "NONE");
  });

  it("normalizes camelCase payload from TypeScript/web client correctly", () => {
    const rawWebPayload = {
      deviceId: "ESP32-WROOM-FLOOD-01",
      experimentId: "EXP-2026-FLOOD-01",
      position: "P1",
      measuredDistanceCm: 18.0,
      referenceHeightCm: 28.0,
      ambientTemperatureC: 25.1,
      sourceMode: "LIVE",
    };

    const reading = normalizeIncomingPayload(rawWebPayload, 101);

    assert.equal(reading.position, "P1");
    assert.equal(reading.measuredDistanceCm, 18.0);
    assert.equal(reading.referenceHeightCm, 28.0);
    // Depth = 28.0 - 18.0 = 10.0 cm
    assert.equal(reading.calculatedWaterDepthCm, 10.0);
    assert.equal(reading.sourceMode, "LIVE");
  });

  it("handles distance exceeding reference height by clamping water depth to 0 and setting underflow warning", () => {
    const overflowDistancePayload = {
      position: "P2",
      distance_cm: 36.5, // Reference is 32.5, so 36.5 > 32.5 + 0.5
      mount_height_cm: 32.5,
    };

    const reading = normalizeIncomingPayload(overflowDistancePayload, 102);

    assert.equal(reading.calculatedWaterDepthCm, 0);
    assert.equal(reading.calibrationUnderflowWarning, true);
    assert.equal(reading.faultCode, "DISTANCE_EXCEEDS_REFERENCE");
  });

  it("handles ultrasonic echo timeout by setting depth to null and faultCode to ULTRASONIC_ECHO_TIMEOUT", () => {
    const echoTimeoutPayload = {
      position: "P2",
      distance_cm: 0, // 0 cm indicates no echo returned within 35ms
      mount_height_cm: 32.5,
    };

    const reading = normalizeIncomingPayload(echoTimeoutPayload, 103);

    assert.equal(reading.measuredDistanceCm, null);
    assert.equal(reading.calculatedWaterDepthCm, null);
    assert.equal(reading.faultCode, "ULTRASONIC_ECHO_TIMEOUT");
  });

  it("dispatches live reading to SSE subscribers when recorded", () => {
    let receivedPayload: unknown = null;
    const unsubscribe = subscribeToSensorStream((envelope) => {
      receivedPayload = envelope.payload;
    });

    const recorded = recordSensorReading({
      device_id: "ESP32-WROOM-FLOOD-01",
      experiment_id: "EXP-2026-FLOOD-01",
      position: "P3",
      distance_cm: 25.0,
      mount_height_cm: 35.0,
      source_mode: "LIVE",
    });

    unsubscribe();

    assert.ok(receivedPayload);
    assert.equal((receivedPayload as typeof recorded).readingId, recorded.readingId);
    assert.equal((receivedPayload as typeof recorded).calculatedWaterDepthCm, 10.0);
  });

  it("POST /api/sensor/readings ingests reading with HTTP 201 and CORS headers", async () => {
    const req = new NextRequest("http://localhost:3000/api/sensor/readings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: "ESP32-WROOM-FLOOD-01",
        experimentId: "EXP-2026-FLOOD-01",
        position: "P2",
        measuredDistanceCm: 21.0,
        referenceHeightCm: 32.5,
        sourceMode: "LIVE",
      }),
    });

    const res = await postReading(req);
    assert.equal(res.status, 201);
    assert.equal(res.headers.get("Access-Control-Allow-Origin"), "*");

    const body = (await res.json()) as { ok: boolean; reading: { calculatedWaterDepthCm: number } };
    assert.equal(body.ok, true);
    assert.equal(body.reading.calculatedWaterDepthCm, 11.5);
  });

  it("OPTIONS /api/sensor/readings returns HTTP 204 with CORS preflight headers", async () => {
    const res = await optionsReading();
    assert.equal(res.status, 204);
    assert.equal(res.headers.get("Access-Control-Allow-Origin"), "*");
    assert.ok(res.headers.get("Access-Control-Allow-Methods")?.includes("POST"));
  });

  it("GET /api/sensor/latest returns latest frame for position", async () => {
    recordSensorReading({
      experimentId: "EXP-2026-FLOOD-01",
      position: "P2",
      measuredDistanceCm: 20.0,
      referenceHeightCm: 32.5,
    });

    const req = new NextRequest("http://localhost:3000/api/sensor/latest?position=P2");
    const res = await getLatest(req);
    assert.equal(res.status, 200);

    const data = (await res.json()) as {
      ok: boolean;
      reading: { position: string; calculatedWaterDepthCm: number };
    };
    assert.equal(data.ok, true);
    assert.equal(data.reading.position, "P2");
    assert.equal(data.reading.calculatedWaterDepthCm, 12.5);
  });

  it("GET /api/sensor/status returns full device status and individual sensor diagnostics", async () => {
    const req = new NextRequest("http://localhost:3000/api/sensor/status?position=P2");
    const res = await getStatus(req);
    assert.equal(res.status, 200);

    const data = (await res.json()) as {
      ok: boolean;
      deviceId: string;
      sensors: Array<{ sensorId: string; status: string }>;
    };
    assert.equal(data.ok, true);
    assert.equal(data.deviceId, "ESP32-WROOM-FLOOD-01");
    assert.ok(data.sensors.some((s) => s.sensorId === "ultrasonic_hcsr04"));
  });

  it("resolves default Render live backend endpoint correctly", () => {
    assert.equal(DEFAULT_HARDWARE_BACKEND_URL, "https://crestix-probe-aqua.onrender.com");
    assert.equal(
      DEFAULT_HARDWARE_INGEST_URL,
      "https://crestix-probe-aqua.onrender.com/api/sensor/readings"
    );

    const resolvedUrl = getSensorApiEndpoint("/api/sensor/readings", DEFAULT_HARDWARE_BACKEND_URL);
    assert.equal(resolvedUrl, "https://crestix-probe-aqua.onrender.com/api/sensor/readings");
  });
});
