import { NextRequest, NextResponse } from "next/server";
import { CORS_HEADERS, handleOptions } from "./cors";
import { getLatestSensorReading, getSensorStatus, recordSensorReading } from "./store";
import type { MeasurementPositionId } from "@/features/sensors/types";

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid sensor payload: expected a JSON object" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const reading = recordSensorReading(body);

    return NextResponse.json(
      {
        ok: true,
        reading,
        message: "Sensor telemetry frame ingested successfully into Crestix Probe pipeline.",
      },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const experimentId = searchParams.get("experimentId") || undefined;
  const position = (searchParams.get("position") as MeasurementPositionId) || undefined;

  const reading = getLatestSensorReading(experimentId, position);
  const status = getSensorStatus(experimentId, position);

  return NextResponse.json(
    {
      ok: true,
      service: "Crestix Probe Hardware Ingestion Gateway",
      targetUrl: "https://crestix-probe-aqua.onrender.com/api/sensor/readings",
      status: status.connectionState,
      latestReading: reading,
      serverTimestamp: new Date().toISOString(),
    },
    { status: 200, headers: CORS_HEADERS }
  );
}
