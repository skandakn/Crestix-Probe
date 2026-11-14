import { NextRequest, NextResponse } from "next/server";
import { CORS_HEADERS, handleOptions } from "../sensor/cors";
import { recordSensorReading } from "../sensor/store";

export async function OPTIONS() {
  return handleOptions();
}

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
      endpoint: "/api/update",
      supported_methods: ["POST", "OPTIONS"],
    },
    { status: 200, headers: CORS_HEADERS }
  );
}
