/**
 * Crestix Probe - GeoTIFF DEM Parser
 * Reads and parses standard single-band GeoTIFF elevation raster files using geotiff.js.
 */

import { TerrainMetadata } from '../types/terrain';

export interface ParsedGeoTIFF {
  metadata: TerrainMetadata;
  elevations: Float32Array;
}

export async function parseGeoTIFF(
  arrayBuffer: ArrayBuffer,
  filename: string = 'terrain.tif'
): Promise<ParsedGeoTIFF> {
  const GeoTIFF = await import('geotiff');
  
  const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
  const image = await tiff.getImage();

  const width = image.getWidth();
  const height = image.getHeight();

  if (width <= 0 || height <= 0) {
    throw new Error(`Invalid GeoTIFF dimensions: ${width}x${height}`);
  }

  // Read raster elevation data (band 0)
  const rasters = await image.readRasters();
  const rawData = rasters[0];

  const totalCells = width * height;
  const elevations = new Float32Array(totalCells);

  // Extract nodata value if declared in metadata
  let nodataValue = -9999;
  const fileDir = image.getFileDirectory() as unknown as Record<string, unknown> | undefined;
  const gdalNoData = fileDir?.GDAL_NODATA;
  if (typeof gdalNoData === 'string' || typeof gdalNoData === 'number') {
    const parsed = parseFloat(String(gdalNoData));
    if (!isNaN(parsed)) nodataValue = parsed;
  }

  if (rawData instanceof Float32Array) {
    elevations.set(rawData);
  } else {
    for (let i = 0; i < totalCells; i++) {
      elevations[i] = Number(rawData[i]);
    }
  }

  // Extract spatial bounding box
  let bounds = {
    west: 77.0,
    east: 77.1,
    south: 12.8,
    north: 12.9
  };
  let cellSize = 10;

  try {
    const bbox = image.getBoundingBox();
    if (bbox && bbox.length >= 4) {
      bounds = {
        west: bbox[0],
        south: bbox[1],
        east: bbox[2],
        north: bbox[3]
      };
      const xRange = Math.abs(bounds.east - bounds.west);
      cellSize = xRange > 1 ? xRange / width : Math.max(5, (xRange * 111000) / width);
    }
  } catch {
    // Default fallback bounds
  }

  const metadata: TerrainMetadata = {
    id: `geotiff-${Date.now()}`,
    name: filename.replace(/\.[^/.]+$/, ''),
    description: `GeoTIFF DEM (${width}x${height}, ${image.getBitsPerSample()}-bit)`,
    format: 'geotiff',
    width,
    height,
    cellSize: Math.round(cellSize * 10) / 10,
    nodataValue,
    bounds,
    crs: 'GeoTIFF Projected / Geographic CRS',
    createdAt: new Date().toISOString()
  };

  return { metadata, elevations };
}
