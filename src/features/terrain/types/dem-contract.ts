/**
 * Crestix Probe - Member 4 <-> Member 9 Data Interface Contract
 * 
 * Formal contract specification between:
 * - Member 4: Terrain Intelligence Module (DEM ingestion, spatial analysis, 3D visualization)
 * - Member 9: Backend Hydrodynamic / Flood Simulation Engine
 * 
 * This contract establishes the exact schema, serialization, coordinate conventions,
 * and data exchange formats used to feed processed terrain matrices into the simulation pipeline.
 */

import { BoundingBox, ElevationStats, SlopeStats, DrainageStats } from './terrain';

export const CRESTIX_DEM_CONTRACT_VERSION = '1.0.0';

export interface Member9DEMPayload {
  contractVersion: string;
  timestamp: string;
  datasetId: string;
  title: string;
  
  spatialReference: {
    crs: string;              // e.g. "EPSG:4326" or "EPSG:32643"
    bounds: BoundingBox;
    dimensions: {
      cols: number;           // Grid columns (width)
      rows: number;           // Grid rows (height)
      cellSizeMeters: number; // Spatial resolution (dx, dy)
    };
    origin: {
      xllCorner: number;
      yllCorner: number;
    };
    nodataValue: number;
  };
  
  statistics: {
    elevation: ElevationStats;
    slope: SlopeStats;
    drainage: DrainageStats;
  };

  /**
   * Primary hydro-topographic rasters (row-major ordered, length = cols * rows)
   * Values can be encoded as raw number arrays in JSON or base64 Float32Array buffers.
   */
  layers: {
    elevationMatrix: number[] | string;         // Meters above sea level
    slopeMatrix: number[] | string;             // Degrees (0-90)
    aspectMatrix: number[] | string;            // Compass azimuth (0-360 deg)
    flowDirectionMatrix: number[] | string;     // D8 encoding (1, 2, 4, 8, 16, 32, 64, 128)
    flowAccumulationMatrix: number[] | string;  // Contributing upslope cells
    manningRoughnessMatrix?: number[] | string; // Hydraulic friction coefficient (e.g. 0.035)
    soilInfiltrationMatrix?: number[] | string; // Hydrologic soil group capacity (mm/hr)
  };

  simulationConfigDefaults: {
    recommendedTimeStepSeconds: number;
    boundaryConditions: 'open' | 'closed' | 'absorptive';
    criticalElevationThreshold: number;
    defaultRoughnessCoeff: number;
  };
}

export interface Member9SimulationResponse {
  simulationId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  message: string;
  estimatedRuntimeMs?: number;
}
