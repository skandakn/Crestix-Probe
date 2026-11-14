import { NextRequest, NextResponse } from "next/server";
import { CORS_HEADERS, handleOptions } from "../cors";
import { getLatestSensorReading } from "../store";
import { DEFAULT_STALE_THRESHOLD_MS, evaluateStaleStatus } from "@/features/sensors/calibration";
import type { MeasurementPositionId, SensorLatestResponse } from "@/features/sensors/types";

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const experimentId = searchParams.get("experimentId") || undefined;
  const position = (searchParams.get("position") as MeasurementPositionId) || undefined;

  const reading = getLatestSensorReading(experimentId, position);
  const nowMs = Date.now();
  const staleEval = evaluateStaleStatus(
    reading?.timestamp,
    nowMs,
    DEFAULT_STALE_THRESHOLD_MS
  );

  const response: SensorLatestResponse = {
    ok: true,
    reading,
    stale: reading ? staleEval.isStale : true,
    staleAgeMs: staleEval.ageMs,
    serverTimestamp: new Date(nowMs).toISOString(),
  };

  return NextResponse.json(response, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
