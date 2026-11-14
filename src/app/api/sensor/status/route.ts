import { NextRequest, NextResponse } from "next/server";
import { CORS_HEADERS, handleOptions } from "../cors";
import { getSensorStatus } from "../store";
import type { MeasurementPositionId } from "@/features/sensors/types";

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const experimentId = searchParams.get("experimentId") || undefined;
  const position = (searchParams.get("position") as MeasurementPositionId) || undefined;

  const status = getSensorStatus(experimentId, position);

  return NextResponse.json(status, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
