import { NextRequest, NextResponse } from "next/server";
import { SimulationRunRequest } from "@/features/simulation/types/contract";
import { createSimulationJob } from "@/app/api/simulation/store";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SimulationRunRequest;

    if (!body || !body.gridDimensions || !body.rainfall) {
      return NextResponse.json(
        { error: "Invalid simulation request payload. gridDimensions and rainfall are required." },
        { status: 400 }
      );
    }

    const job = createSimulationJob(body);

    return NextResponse.json(
      {
        simulationId: job.id,
        status: job.status,
        createdAt: job.createdAt,
        totalSteps: job.totalSteps,
        estimatedDurationSeconds: 1,
        message: "Simulation job created successfully via backend API.",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
