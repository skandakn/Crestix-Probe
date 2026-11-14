import { NextRequest, NextResponse } from "next/server";
import { CORS_HEADERS, handleOptions } from "../cors";
import { getSensorHistory, recordSensorReading } from "../store";

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
  const position = (searchParams.get("position") as "P1" | "P2" | "P3" | "ALL") || undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  const readings = getSensorHistory(experimentId, position, Number.isFinite(limit) ? limit : 50);

  return NextResponse.json(
    {
      ok: true,
      count: readings.length,
      readings,
      serverTimestamp: new Date().toISOString(),
    },
    { status: 200, headers: CORS_HEADERS }
  );
}
