/**
 * Crestix Probe - Terrain Intelligence Module
 * Core TypeScript definitions for digital elevation models, layers, and inspection.
 */

export interface BoundingBox {
  north: number; // Max Latitude
  south: number; // Min Latitude
  east: number;  // Max Longitude
  west: number;  // Min Longitude
}

export interface TerrainMetadata {
  id: string;
  name: string;
  description: string;
  format: 'geotiff' | 'ascii-grid' | 'crestix-dem-json' | 'synthetic';
  width: number;       // Grid columns (X)
  height: number;      // Grid rows (Y)
  cellSize: number;    // Cell dimension in meters
  nodataValue: number;
  bounds: BoundingBox;
  crs: string;         // e.g. "EPSG:4326 (WGS84)" or "EPSG:32643 (UTM Zone 43N)"
  createdAt: string;
}

export interface ElevationStats {
  min: number;
  max: number;
  mean: number;
  stdDev: number;
  relief: number; // max - min
}

export interface SlopeStats {
  min: number;
  max: number;
  mean: number;
  steepPercentage: number; // % area > 15 degrees
  flatPercentage: number;  // % area < 3 degrees (flood pooling hazard)
}

export interface DrainageStats {
  maxAccumulation: number;
  depressionCount: number;
  streamCellCount: number;
  estimatedStreamLengthKm: number;
}

export interface TerrainStats {
  elevation: ElevationStats;
  slope: SlopeStats;
  drainage: DrainageStats;
}

export interface ProcessedDEMData {
  metadata: TerrainMetadata;
  stats: TerrainStats;
  
  // Flattened 1D arrays of size width * height (row-major order: index = y * width + x)
  elevations: Float32Array;
  slopes: Float32Array;             // Slope in degrees (0 - 90)
  aspects: Float32Array;            // Aspect in degrees (0 - 360, -1 for flat)
  flowDirections: Uint8Array;       // D8 code: 1, 2, 4, 8, 16, 32, 64, 128
  flowAccumulations: Float32Array;  // Contributing upslope cell count
  hillshade: Uint8Array;            // 0 - 255 shaded relief intensity
  floodHazard: Uint8Array;          // 0 - 100 flood susceptibility score
}

export type TerrainViewMode = 
  | 'elevation' 
  | 'slope' 
  | 'drainage' 
  | 'hillshade' 
  | 'hybrid' 
  | 'floodHazard';

export type ColormapPalette = 
  | 'terrain' 
  | 'viridis' 
  | 'hypsometric' 
  | 'magma' 
  | 'plasma' 
  | 'slope' 
  | 'water';

export interface LayerSettings {
  viewMode: TerrainViewMode;
  colormap: ColormapPalette;
  wireframe: boolean;
  showGrid: boolean;
  showContours: boolean;
  contourInterval: number; // in meters (e.g. 20m)
  showStreams: boolean;
  streamThreshold: number; // Flow accumulation threshold to classify as river channel
  verticalExaggeration: number; // 0.5x to 5.0x
  showWaterPlane: boolean;
  waterLevel: number; // Water height in meters
  sunAzimuth: number; // 0 - 360 deg
  sunAltitude: number; // 10 - 90 deg
  opacity: number;
}

export interface TerrainInspectionPoint {
  worldX: number;
  worldY: number;
  worldZ: number;
  gridX: number;
  gridY: number;
  longitude: number;
  latitude: number;
  elevation: number;
  slope: number;
  aspect: number;
  aspectDirection: string;
  flowDirection: number;
  flowAccumulation: number;
  floodHazardScore: number;
  floodRiskCategory: 'Low' | 'Moderate' | 'High' | 'Critical Depression';
  isSubmerged: boolean;
}

export interface CrossSectionPoint {
  distance: number; // distance from start in meters
  elevation: number;
  waterLevel: number;
  slope: number;
  isSubmerged: boolean;
}
