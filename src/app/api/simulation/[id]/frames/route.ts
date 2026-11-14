import { NextRequest, NextResponse } from "next/server";
import { getSimulationJob } from "@/app/api/simulation/store";
import { TERRAIN_PRESETS } from "@/features/simulation/data/terrain-presets";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = getSimulationJob(params.id);
    if (!job) {
      return NextResponse.json(
        { error: `Simulation frames not found for id: ${params.id}` },
        { status: 404 }
      );
    }

    const { config } = job;
    let elevation = config.elevationGrid;
    if (!elevation || elevation.length === 0) {
      const preset = TERRAIN_PRESETS.find((p) => p.id === config.terrainId);
      elevation = preset ? preset.elevationGrid : [];
    }

    return NextResponse.json({
      simulationId: job.id,
      rows: config.gridDimensions.rows,
      cols: config.gridDimensions.cols,
      cellSizeMeters: config.gridDimensions.cellSizeMeters,
      elevationGrid: elevation,
      totalFrames: job.frames.length,
      timeStepSeconds: config.timeStepSeconds || 30,
      frames: job.frames,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
