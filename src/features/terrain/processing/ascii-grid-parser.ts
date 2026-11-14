/**
 * Crestix Probe - Esri ASCII Raster Grid Parser
 * Reads standard .asc / .dem / .grd raster elevation data.
 */

import { TerrainMetadata } from '../types/terrain';

export interface ParsedAsciiGrid {
  metadata: TerrainMetadata;
  elevations: Float32Array;
}

export function parseAsciiGrid(content: string, filename: string = 'terrain.asc'): ParsedAsciiGrid {
  // Normalize line breaks
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 6) {
    throw new Error('Invalid ASCII Grid: File has fewer than 6 header lines.');
  }

  let ncols = 0;
  let nrows = 0;
  let xll = 0;
  let yll = 0;
  let cellSize = 10;
  let nodataValue = -9999;
  let isCenter = false;

  let dataStartLine = 0;

  for (let i = 0; i < lines.length && i < 15; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(/\s+/);
    if (parts.length >= 2) {
      const key = parts[0].toUpperCase();
      const val = parseFloat(parts[1]);

      if (key === 'NCOLS') {
        ncols = parseInt(parts[1], 10);
      } else if (key === 'NROWS') {
        nrows = parseInt(parts[1], 10);
      } else if (key === 'XLLCORNER') {
        xll = val;
        isCenter = false;
      } else if (key === 'XLLCENTER') {
        xll = val;
        isCenter = true;
      } else if (key === 'YLLCORNER') {
        yll = val;
        isCenter = false;
      } else if (key === 'YLLCENTER') {
        yll = val;
        isCenter = true;
      } else if (key === 'CELLSIZE') {
        cellSize = val;
      } else if (key === 'NODATA_VALUE') {
        nodataValue = val;
      } else {
        // First non-header line begins data
        dataStartLine = i;
        break;
      }
    }
  }

  if (ncols <= 0 || nrows <= 0) {
    throw new Error(`Invalid ASCII Grid header: NCOLS=${ncols}, NROWS=${nrows}`);
  }

  const totalCells = ncols * nrows;
  const elevations = new Float32Array(totalCells);

  // Parse remaining data tokens
  let cellCount = 0;
  for (let i = dataStartLine; i < lines.length && cellCount < totalCells; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const tokens = line.split(/\s+/);
    for (let t = 0; t < tokens.length && cellCount < totalCells; t++) {
      const num = parseFloat(tokens[t]);
      elevations[cellCount++] = isNaN(num) ? nodataValue : num;
    }
  }

  if (cellCount < totalCells) {
    throw new Error(`Incomplete ASCII Grid: Expected ${totalCells} cells, read ${cellCount}`);
  }

  // Calculate georeferenced bounding box
  const originX = isCenter ? xll - cellSize / 2 : xll;
  const originY = isCenter ? yll - cellSize / 2 : yll;

  const west = originX;
  const east = originX + ncols * cellSize;
  const south = originY;
  const north = originY + nrows * cellSize;

  const metadata: TerrainMetadata = {
    id: `asc-${Date.now()}`,
    name: filename.replace(/\.[^/.]+$/, ''),
    description: `Parsed from ASCII Grid (${ncols}x${nrows}, cell size: ${cellSize}m)`,
    format: 'ascii-grid',
    width: ncols,
    height: nrows,
    cellSize,
    nodataValue,
    bounds: { north, south, east, west },
    crs: (west >= -180 && east <= 180 && south >= -90 && north <= 90) 
      ? 'EPSG:4326 (WGS84 Geographic)' 
      : 'Projected UTM / Local Metric Grid',
    createdAt: new Date().toISOString()
  };

  return { metadata, elevations };
}
