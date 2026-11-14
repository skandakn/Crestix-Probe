import { describe, it, expect } from "vitest";
import { MockSimulationApiAdapter } from "../api/mock-adapter";
import { SimulationRunRequest } from "../types/contract";
import { TERRAIN_PRESETS } from "../data/terrain-presets";

describe("MockSimulationApiAdapter (Deterministic Synthetic Engine)", () => {
  const adapter = new MockSimulationApiAdapter();

  const baseRequest: SimulationRunRequest = {
    terrainId: TERRAIN_PRESETS[0].id,
    gridDimensions: {
      rows: TERRAIN_PRESETS[0].rows,
      cols: TERRAIN_PRESETS[0].cols,
      cellSizeMeters: TERRAIN_PRESETS[0].cellSizeMeters,
    },
    elevationGrid: TERRAIN_PRESETS[0].elevationGrid,
    rainfall: {
      intensityMmPerHour: 50,
      durationMinutes: 60,
    },
    initialWaterDepthMeters: 0.0,
    surfaceRoughnessManning: 0.035,
    boundaryConditions: {
      north: "closed",
      south: "open",
      east: "closed",
      west: "closed",
    },
    timeStepSeconds: 30,
    totalDurationMinutes: 60,
  };

  it("should declare adapterType as 'mock' and include synthetic disclaimer", () => {
    expect(adapter.adapterType).toBe("mock");
    expect(adapter.displayName).toContain("Deterministic Mock");
    expect(adapter.description).toContain("Not physical solver");
  });

  it("should successfully run a simulation and return a valid run response", async () => {
    const res = await adapter.runSimulation(baseRequest);

    expect(res.simulationId).toBeDefined();
    expect(res.status).toBe("completed");
    expect(res.totalSteps).toBeGreaterThan(0);
    expect(res.message).toBeDefined();
  });

  it("should fetch generated frames matching the grid dimensions", async () => {
    const runRes = await adapter.runSimulation(baseRequest);
    const framesRes = await adapter.getSimulationFrames(runRes.simulationId);

    expect(framesRes.simulationId).toBe(runRes.simulationId);
    expect(framesRes.rows).toBe(baseRequest.gridDimensions.rows);
    expect(framesRes.cols).toBe(baseRequest.gridDimensions.cols);
    expect(framesRes.frames.length).toBe(runRes.totalSteps);

    // Validate individual frame structure
    const firstFrame = framesRes.frames[0];
    expect(firstFrame.step).toBe(0);
    expect(firstFrame.waterDepthGrid.length).toBe(baseRequest.gridDimensions.rows);
    expect(firstFrame.waterDepthGrid[0].length).toBe(baseRequest.gridDimensions.cols);
    expect(firstFrame.maxDepthMeters).toBeGreaterThanOrEqual(0);
  });

  it("should be deterministic: same parameters yield identical frames", async () => {
    const run1 = await adapter.runSimulation(baseRequest);
    const run2 = await adapter.runSimulation(baseRequest);

    const frames1 = await adapter.getSimulationFrames(run1.simulationId);
    const frames2 = await adapter.getSimulationFrames(run2.simulationId);

    expect(frames1.frames.length).toBe(frames2.frames.length);
    expect(frames1.frames[10].maxDepthMeters).toBe(frames2.frames[10].maxDepthMeters);
    expect(frames1.frames[10].totalWaterVolumeM3).toBe(frames2.frames[10].totalWaterVolumeM3);
  });

  it("higher rainfall intensity should result in higher flood water volume", async () => {
    const lowRainRequest = {
      ...baseRequest,
      rainfall: { intensityMmPerHour: 10, durationMinutes: 60 },
    };
    const highRainRequest = {
      ...baseRequest,
      rainfall: { intensityMmPerHour: 100, durationMinutes: 60 },
    };

    const lowRun = await adapter.runSimulation(lowRainRequest);
    const highRun = await adapter.runSimulation(highRainRequest);

    const lowFrames = await adapter.getSimulationFrames(lowRun.simulationId);
    const highFrames = await adapter.getSimulationFrames(highRun.simulationId);

    const lastStep = lowFrames.frames.length - 1;
    expect(highFrames.frames[lastStep].totalWaterVolumeM3).toBeGreaterThan(
      lowFrames.frames[lastStep].totalWaterVolumeM3
    );
  });
});
