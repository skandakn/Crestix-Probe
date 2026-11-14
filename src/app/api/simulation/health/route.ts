import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "crestix-flood-simulation-service",
    version: "1.0.0",
    message: "CRESTIX Probe Simulation API is operational and ready.",
    timestamp: new Date().toISOString(),
  });
}
