/**
 * Crestix Probe - Sample ASCII Grid and JSON DEM Data
 */

export const SAMPLE_ASCII_GRID_DATA = `NCOLS 6
NROWS 6
XLLCORNER 77.580000
YLLCORNER 12.970000
CELLSIZE 25.0
NODATA_VALUE -9999
150.0 148.5 145.2 140.0 135.5 130.0
152.1 150.0 146.0 141.2 136.0 131.5
155.0 152.3 147.5 142.0 137.2 132.0
158.2 154.0 149.0 143.5 138.0 133.4
160.0 156.2 150.8 144.1 139.5 134.0
162.5 158.0 152.0 145.0 140.0 135.2
`;

export const SAMPLE_CRESTIX_JSON_DEM = {
  metadata: {
    id: "sample-json-dem",
    name: "Valley Test Basin",
    description: "Sample small raster for automated testing and validation",
    format: "crestix-dem-json",
    width: 4,
    height: 4,
    cellSize: 10,
    nodataValue: -9999,
    bounds: {
      north: 13.0,
      south: 12.9,
      east: 77.6,
      west: 77.5
    },
    crs: "EPSG:4326 (WGS84)",
    createdAt: "2026-11-14T12:00:00Z"
  },
  elevations: [
    100, 95, 90, 85,
    102, 94, 88, 83,
    105, 96, 86, 80,
    110, 98, 84, 78
  ]
};
