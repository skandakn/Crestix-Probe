import { NextRequest, NextResponse } from "next/server";
import { getSimulationJob } from "@/app/api/simulation/store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = getSimulationJob(id);
    if (!job) {
      return NextResponse.json(
        { error: `Simulation not found: ${id}` },
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
