/**
 * Crestix Probe - Member 9 Coordination Service
 * Provides formal serialization, validation, and API exchange utilities
 * for transmitting processed DEM matrices to Member 9's simulation pipeline.
 */

import { ProcessedDEMData } from '../types/terrain';
import {
  Member9DEMPayload,
  Member9SimulationResponse,
  CRESTIX_DEM_CONTRACT_VERSION
} from '../types/dem-contract';

export class Member9IntegrationService {
  /**
   * Transforms internal processed DEM model into Member 9 simulation contract payload
   */
  public static createSimulationPayload(dem: ProcessedDEMData): Member9DEMPayload {
    const { metadata, stats, elevations, slopes, aspects, flowDirections, flowAccumulations } = dem;

    // Convert Float32Array to standard numbers for JSON serialization
    // (Or provide Float32Array buffer in binary mode)
    const elevationArray = Array.from(elevations);
    const slopeArray = Array.from(slopes);
    const aspectArray = Array.from(aspects);
    const flowDirArray = Array.from(flowDirections);
    const flowAccumArray = Array.from(flowAccumulations);

    // Hydraulic roughness estimation based on slope and flood hazard
    const roughnessArray = slopeArray.map(s => {
      if (s < 2) return 0.030; // Smooth floodplain / channel
      if (s < 10) return 0.045; // Cultivated / vegetated pasture
      return 0.065; // Mountainous scrub / forested slope
    });

    return {
      contractVersion: CRESTIX_DEM_CONTRACT_VERSION,
      timestamp: new Date().toISOString(),
      datasetId: metadata.id,
      title: metadata.name,
      spatialReference: {
        crs: metadata.crs,
        bounds: metadata.bounds,
        dimensions: {
          cols: metadata.width,
          rows: metadata.height,
          cellSizeMeters: metadata.cellSize
        },
        origin: {
          xllCorner: metadata.bounds.west,
          yllCorner: metadata.bounds.south
        },
        nodataValue: metadata.nodataValue
      },
      statistics: stats,
      layers: {
        elevationMatrix: elevationArray,
        slopeMatrix: slopeArray,
        aspectMatrix: aspectArray,
        flowDirectionMatrix: flowDirArray,
        flowAccumulationMatrix: flowAccumArray,
        manningRoughnessMatrix: roughnessArray
      },
      simulationConfigDefaults: {
        recommendedTimeStepSeconds: Math.max(1, Math.min(30, Math.floor(metadata.cellSize / 2))),
        boundaryConditions: 'absorptive',
        criticalElevationThreshold: stats.elevation.min + stats.elevation.relief * 0.25,
        defaultRoughnessCoeff: 0.035
      }
    };
  }

  /**
   * Validates an incoming or outgoing Member 9 DEM payload against the schema
   */
  public static validatePayload(payload: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!payload || typeof payload !== 'object') {
      return { valid: false, errors: ['Payload must be a non-null object'] };
    }

    const p = payload as Partial<Member9DEMPayload>;

    if (!p.contractVersion) errors.push('Missing contractVersion');
    if (!p.spatialReference) errors.push('Missing spatialReference section');
    else {
      const sr = p.spatialReference;
      if (!sr.dimensions?.cols || !sr.dimensions?.rows) errors.push('Invalid grid dimensions');
      if (!sr.dimensions?.cellSizeMeters || sr.dimensions.cellSizeMeters <= 0) errors.push('Invalid cellSizeMeters');
      if (!sr.bounds) errors.push('Missing bounds in spatialReference');
    }

    if (!p.layers) errors.push('Missing layers matrix data');
    else {
      if (!p.layers.elevationMatrix) errors.push('Missing elevationMatrix in layers');
      if (!p.layers.slopeMatrix) errors.push('Missing slopeMatrix in layers');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Mock API client simulating dispatch to Member 9's backend hydro-engine
   */
  public static async dispatchToSimulationEngine(
    payload: Member9DEMPayload
  ): Promise<Member9SimulationResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const totalCells = payload.spatialReference.dimensions.cols * payload.spatialReference.dimensions.rows;
    const estRuntime = Math.round(totalCells * 0.45);

    return {
      simulationId: `sim-m9-${Date.now().toString(36)}`,
      status: 'queued',
      message: `DEM successfully validated and ingested by Member 9 simulation backend. Grid ${payload.spatialReference.dimensions.cols}x${payload.spatialReference.dimensions.rows} (${totalCells} cells) loaded into hydrodynamic solver.`,
      estimatedRuntimeMs: estRuntime
    };
  }
}
