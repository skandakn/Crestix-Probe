import { NextRequest, NextResponse } from "next/server";
import { getSimulationJob } from "@/app/api/simulation/store";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = getSimulationJob(params.id);
    if (!job) {
      return NextResponse.json(
        { error: `Simulation not found: ${params.id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      simulationId: job.id,
      status: job.status,
      progressPercentage: job.progressPercentage,
      currentStep: job.currentStep,
      totalSteps: job.totalSteps,
      executionTimeMs: 38,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      config: job.config,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
