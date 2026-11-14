import { NextRequest, NextResponse } from "next/server";
import { CORS_HEADERS, handleOptions } from "../cors";
import { getSensorHistory } from "../store";
import type { MeasurementPositionId, SensorHistoryResponse } from "@/features/sensors/types";

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const experimentId = searchParams.get("experimentId") || "EXP-2026-FLOOD-01";
  const rawPos = searchParams.get("position");
  const positionFilter: MeasurementPositionId | "ALL" =
    rawPos === "P1" || rawPos === "P2" || rawPos === "P3" ? rawPos : "ALL";

  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(200, Math.max(1, parseInt(limitParam, 10))) : 50;

  const readings = getSensorHistory(
    searchParams.get("experimentId") ? experimentId : undefined,
    positionFilter,
    limit
  );

  const response: SensorHistoryResponse = {
    ok: true,
    experimentId,
    positionFilter,
    count: readings.length,
    readings,
    serverTimestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
