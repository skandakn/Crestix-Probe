import {
  ISimulationApiAdapter,
} from "./adapter-interface";
import {
  SimulationRunRequest,
  SimulationRunResponse,
  SimulationStatusResponse,
  SimulationFramesResponse,
  SimulationFrame,
} from "../types/contract";
import { TERRAIN_PRESETS } from "../data/terrain-presets";

/**
 * DETERMINISTIC MOCK ADAPTER (SYNTHETIC PREVIEW)
 * 
 * NOTICE:
 * This is a deterministic mock adapter specifically designed for UI integration,
 * time-step animation, and testing against the Member 9 data contract.
 * Per project specification:
 * - This does NOT run a numerical shallow-water differential equation solver.
 * - This does NOT claim to represent actual physical engineering results.
 * - All frame sequences are synthetic, deterministic geometric approximations
 *   intended solely to verify UI controls, colour maps, scrubber, and responsiveness.
 */
export class MockSimulationApiAdapter implements ISimulationApiAdapter {
  readonly adapterType = "mock" as const;
  readonly displayName = "Deterministic Mock Engine (Synthetic)";
  readonly description =
    "Contract-compliant deterministic mock adapter generating reproducible UI demonstration frames. (Not physical solver)";

  private inMemoryJobs = new Map<
    string,
    {
      request: SimulationRunRequest;
      createdAt: string;
      status: "queued" | "running" | "completed" | "failed";
      frames: SimulationFrame[];
      totalSteps: number;
    }
  >();

  async checkHealth(): Promise<{ ok: boolean; message: string }> {
    return {
      ok: true,
      message: "Deterministic Mock Adapter is active and ready (Client/Local).",
    };
  }

  async runSimulation(request: SimulationRunRequest): Promise<SimulationRunResponse> {
    const simulationId = `sim-mock-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Total steps calculation: duration (converted to seconds) / timeStepSeconds
    const totalDurationSeconds = request.totalDurationMinutes * 60;
    const dt = Math.max(5, request.timeStepSeconds || 30);
    const totalSteps = Math.min(240, Math.max(10, Math.floor(totalDurationSeconds / dt)));

    // Generate deterministic synthetic frames based strictly on request parameters
    const frames = this.generateDeterministicFrames(request, totalSteps, dt);

    this.inMemoryJobs.set(simulationId, {
      request,
      createdAt: new Date().toISOString(),
      status: "completed",
      frames,
      totalSteps,
    });

    return {
      simulationId,
      status: "completed",
      createdAt: new Date().toISOString(),
      totalSteps,
      estimatedDurationSeconds: 1,
      message: "Deterministic synthetic simulation generated successfully for UI demonstration.",
    };
  }

  async getSimulationStatus(simulationId: string): Promise<SimulationStatusResponse> {
    const job = this.inMemoryJobs.get(simulationId);
    if (!job) {
      throw new Error(`Simulation not found: ${simulationId}`);
    }

    return {
      simulationId,
      status: job.status,
      progressPercentage: 100,
      currentStep: job.totalSteps,
      totalSteps: job.totalSteps,
      executionTimeMs: 42,
      createdAt: job.createdAt,
      completedAt: new Date().toISOString(),
      config: job.request,
    };
  }

  async getSimulationFrames(simulationId: string): Promise<SimulationFramesResponse> {
    const job = this.inMemoryJobs.get(simulationId);
    if (!job) {
      throw new Error(`Simulation frames not found for id: ${simulationId}`);
    }

    const { request, frames } = job;
    const elevation = this.resolveElevation(request);

    return {
      simulationId,
      rows: request.gridDimensions.rows,
      cols: request.gridDimensions.cols,
      cellSizeMeters: request.gridDimensions.cellSizeMeters,
      elevationGrid: elevation,
      totalFrames: frames.length,
      timeStepSeconds: request.timeStepSeconds || 30,
      frames,
    };
  }

  private resolveElevation(request: SimulationRunRequest): number[][] {
    if (request.elevationGrid && request.elevationGrid.length > 0) {
      return request.elevationGrid;
    }
    const preset = TERRAIN_PRESETS.find((p) => p.id === request.terrainId);
    if (preset) {
      return preset.elevationGrid;
    }
    // Fallback plane
    const { rows, cols } = request.gridDimensions;
    return Array.from({ length: rows }, () => Array(cols).fill(5.0));
  }

  /**
   * Generates deterministic synthetic frames.
   * Uses elevation slope descent, Manning roughness dampening, and boundary dissipation.
   */
  private generateDeterministicFrames(
    request: SimulationRunRequest,
    totalSteps: number,
    dt: number
  ): SimulationFrame[] {
    const { rows, cols, cellSizeMeters } = request.gridDimensions;
    const cellArea = cellSizeMeters * cellSizeMeters;
    const elevation = this.resolveElevation(request);

    // Initial state
    let currentDepth: number[][] = Array.from({ length: rows }, () =>
      Array(cols).fill(Math.max(0, request.initialWaterDepthMeters))
    );

    const frames: SimulationFrame[] = [];
    const rainfallDurationSec = request.rainfall.durationMinutes * 60;
    // Rainfall intensity mm/hr converted to meters of water depth added per second:
    // (mm / hr) / (1000 mm/m * 3600 s/hr)
    const rainRatePerSec = (request.rainfall.intensityMmPerHour / 3600000);

    // Roughness Manning's n dampening factor (higher n = slower velocity)
    // Manning's n typically 0.015 - 0.08
    const roughnessFactor = Math.max(0.1, 1.0 - (request.surfaceRoughnessManning / 0.1) * 0.45);

    // Compute min and max elevation to find topographic depressions
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        minZ = Math.min(minZ, elevation[r][c]);
        maxZ = Math.max(maxZ, elevation[r][c]);
      }
    }
    const zRange = Math.max(1.0, maxZ - minZ);

    for (let step = 0; step < totalSteps; step++) {
      const timeSec = step * dt;
      const isRaining = timeSec <= rainfallDurationSec;

      const nextDepth: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let d = currentDepth[r][c];

          // 1. Rainfall input
          if (isRaining) {
            d += rainRatePerSec * dt;
          }

          // 2. Downslope gravitational drift heuristic
          // Compare elevation to 4 cardinal neighbors
          const z = elevation[r][c];
          const neighbors: { r: number; c: number; deltaZ: number }[] = [];

          if (r > 0) neighbors.push({ r: r - 1, c, deltaZ: z - elevation[r - 1][c] });
          if (r < rows - 1) neighbors.push({ r: r + 1, c, deltaZ: z - elevation[r + 1][c] });
          if (c > 0) neighbors.push({ r, c: c - 1, deltaZ: z - elevation[r][c - 1] });
          if (c < cols - 1) neighbors.push({ r, c: c + 1, deltaZ: z - elevation[r][c + 1] });

          // Water accumulates preferentially in lower relative elevations
          const relativeDepression = (maxZ - z) / zRange; // 0 (high peak) to 1 (deep valley)
          const accumulationBias = (relativeDepression * 0.02 + 0.99);

          d = d * accumulationBias;

          // Manning's friction smoothing
          d = d * (0.98 + (1 - roughnessFactor) * 0.015);

          // 3. Boundary Condition adjustments
          if (r === 0) {
            d = this.applyBoundaryCondition(d, request.boundaryConditions.north);
          } else if (r === rows - 1) {
            d = this.applyBoundaryCondition(d, request.boundaryConditions.south);
          }
          if (c === 0) {
            d = this.applyBoundaryCondition(d, request.boundaryConditions.west);
          } else if (c === cols - 1) {
            d = this.applyBoundaryCondition(d, request.boundaryConditions.east);
          }

          nextDepth[r][c] = Math.max(0, parseFloat(d.toFixed(4)));
        }
      }

      currentDepth = nextDepth;

      // Calculate frame summary statistics
      let maxDepth = 0;
      let totalDepth = 0;
      let floodedCount = 0;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const depth = currentDepth[r][c];
          if (depth > maxDepth) maxDepth = depth;
          totalDepth += depth;
          if (depth > 0.01) floodedCount++;
        }
      }

      const totalCells = rows * cols;
      const avgDepth = totalDepth / totalCells;
      const totalVolume = totalDepth * cellArea;

      frames.push({
        step,
        timeSeconds: timeSec,
        waterDepthGrid: currentDepth.map((row) => [...row]),
        maxDepthMeters: parseFloat(maxDepth.toFixed(3)),
        avgDepthMeters: parseFloat(avgDepth.toFixed(3)),
        floodedCellCount: floodedCount,
        totalWaterVolumeM3: Math.round(totalVolume),
      });
    }

    return frames;
  }

  private applyBoundaryCondition(depth: number, condition: string): number {
    switch (condition) {
      case "open":
        // Outflow / absorbing boundary drains 40% per step
        return depth * 0.6;
      case "weir":
        // Weir retains up to 0.25m, spills excess
        return depth > 0.25 ? 0.25 + (depth - 0.25) * 0.2 : depth;
      case "inflow":
        // Inflow boundary adds constant head
        return depth + 0.05;
      case "closed":
      default:
        // Closed / wall reflects / retains water
        return depth * 1.02;
    }
  }
}
