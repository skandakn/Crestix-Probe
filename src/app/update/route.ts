import { NextRequest, NextResponse } from "next/server";
import { CORS_HEADERS, handleOptions } from "../api/sensor/cors";
import { recordSensorReading } from "../api/sensor/store";

export async function OPTIONS() {
  return handleOptions();
}

/**
 * Direct ingestion route matching ESP32 firmware POST target:
 * Target: POST /update or POST /api/update
 * Payload:
 * {
 *   "node_id": "river_sensor_alpha",
 *   "lat": 12.9716,
 *   "lng": 77.5946,
 *   "depth_probes": [1, 1, 0, 0, 0, 0],
 *   "depth_sonic": 14.2,
 *   "temp_c": 24.5
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { status: "error", message: "Invalid payload: expected JSON object" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const reading = recordSensorReading(body);

    return NextResponse.json(
      {
        status: "success",
        ok: true,
        node_id: body.node_id || body.nodeId || "river_sensor_alpha",
        assimilated: true,
        water_depth_cm: reading.calculatedWaterDepthCm,
        air_gap_cm: reading.measuredDistanceCm,
        timestamp: reading.timestamp,
        message: "Telemetry packet assimilated successfully into Crestix Probe pipeline",
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { status: "error", message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      status: "online",
      endpoint: "/update",
      supported_methods: ["POST", "OPTIONS"],
      description: "Direct ESP32 firmware HTTP telemetry ingestion bridge",
    },
    { status: 200, headers: CORS_HEADERS }
  );
}
