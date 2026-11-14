/**
 * Crestix Probe - DEM Processing Pipeline
 * Coordinates end-to-end topographic, hydrological, and statistical computation
 * on raw raster elevation grids.
 */

import {
  ProcessedDEMData,
  TerrainMetadata,
  TerrainStats,
  ElevationStats,
  SlopeStats,
  DrainageStats
} from '../types/terrain';
import { calculateSlopeAndAspect } from './slope-calculator';
import { analyzeDrainage } from './drainage-analyzer';
import { calculateHillshade } from './hillshade-calculator';

export function processDEM(
  metadata: TerrainMetadata,
  rawElevations: Float32Array
): ProcessedDEMData {
  const { width, height, cellSize, nodataValue } = metadata;
  const totalCells = width * height;

  if (rawElevations.length !== totalCells) {
    throw new Error(
      `DEM dimension mismatch: Metadata specifies ${width}x${height}=${totalCells} cells, but buffer has ${rawElevations.length}`
    );
  }

  // 1. Calculate Elevation Statistics and cleanse nodata
  const cleanElevations = new Float32Array(totalCells);
  let minElev = Infinity;
  let maxElev = -Infinity;
  let sumElev = 0;
  let validCellCount = 0;

  for (let i = 0; i < totalCells; i++) {
    const val = rawElevations[i];
    if (val !== nodataValue && !isNaN(val) && val > -1000 && val < 9000) {
      cleanElevations[i] = val;
      if (val < minElev) minElev = val;
      if (val > maxElev) maxElev = val;
      sumElev += val;
      validCellCount++;
    } else {
      cleanElevations[i] = NaN;
    }
  }

  // Interpolate / fill isolated NaN voids with average or local floor
  const meanElev = validCellCount > 0 ? sumElev / validCellCount : 0;
  minElev = validCellCount > 0 ? minElev : 0;
  maxElev = validCellCount > 0 ? maxElev : 100;

  for (let i = 0; i < totalCells; i++) {
    if (isNaN(cleanElevations[i])) {
      cleanElevations[i] = minElev;
    }
  }

  // Standard deviation of elevation
  let varianceSum = 0;
  for (let i = 0; i < totalCells; i++) {
    const diff = cleanElevations[i] - meanElev;
    varianceSum += diff * diff;
  }
  const stdDevElev = Math.sqrt(varianceSum / totalCells);

  const elevStats: ElevationStats = {
    min: Math.round(minElev * 100) / 100,
    max: Math.round(maxElev * 100) / 100,
    mean: Math.round(meanElev * 100) / 100,
    stdDev: Math.round(stdDevElev * 100) / 100,
    relief: Math.round((maxElev - minElev) * 100) / 100
  };

  // 2. Compute Slope & Aspect using Horn's method
  const { slopes, aspects } = calculateSlopeAndAspect(
    cleanElevations,
    width,
    height,
    cellSize,
    nodataValue
  );

  // Slope statistics
  let minSlope = Infinity;
  let maxSlope = -Infinity;
  let sumSlope = 0;
  let steepCount = 0; // slope > 15 deg
  let flatCount = 0;  // slope < 3 deg (flood accumulation hazard)

  for (let i = 0; i < totalCells; i++) {
    const s = slopes[i];
    if (s < minSlope) minSlope = s;
    if (s > maxSlope) maxSlope = s;
    sumSlope += s;
    if (s > 15) steepCount++;
    if (s < 3) flatCount++;
  }

  const slopeStats: SlopeStats = {
    min: Math.round(minSlope * 10) / 10,
    max: Math.round(maxSlope * 10) / 10,
    mean: Math.round((sumSlope / totalCells) * 10) / 10,
    steepPercentage: Math.round((steepCount / totalCells) * 1000) / 10,
    flatPercentage: Math.round((flatCount / totalCells) * 1000) / 10
  };

  // 3. Compute D8 Drainage, Flow Accumulation, and Flood Hazard Index
  const drainage = analyzeDrainage(
    cleanElevations,
    slopes,
    width,
    height,
    cellSize,
    nodataValue
  );

  let maxAccum = 0;
  for (let i = 0; i < totalCells; i++) {
    if (drainage.flowAccumulations[i] > maxAccum) {
      maxAccum = drainage.flowAccumulations[i];
    }
  }

  const estimatedStreamLengthKm = 
    Math.round(((drainage.streamCellCount * cellSize) / 1000) * 100) / 100;

  const drainageStats: DrainageStats = {
    maxAccumulation: Math.round(maxAccum),
    depressionCount: drainage.depressionCount,
    streamCellCount: drainage.streamCellCount,
    estimatedStreamLengthKm
  };

  // 4. Compute Shaded Relief / Hillshade
  const hillshade = calculateHillshade(slopes, aspects, 315, 45);

  const stats: TerrainStats = {
    elevation: elevStats,
    slope: slopeStats,
    drainage: drainageStats
  };

  return {
    metadata,
    stats,
    elevations: cleanElevations,
    slopes,
    aspects,
    flowDirections: drainage.flowDirections,
    flowAccumulations: drainage.flowAccumulations,
    hillshade,
    floodHazard: drainage.floodHazard
  };
}
