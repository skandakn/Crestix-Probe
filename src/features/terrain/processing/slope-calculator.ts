/**
 * Crestix Probe - Terrain Slope & Aspect Calculator
 * Implements Horn's 1981 algorithm for calculating topographic slope and aspect
 * using a 3x3 moving window finite-difference gradient.
 */

export interface SlopeAspectResult {
  slopes: Float32Array;   // Slope in degrees [0, 90]
  aspects: Float32Array;  // Aspect in degrees [0, 360], -1 for flat cells
}

/**
 * Computes slope and aspect for every cell in a 2D DEM elevation grid.
 * 
 * @param elevations 1D Float32Array of elevation values (row-major order)
 * @param width Grid column count
 * @param height Grid row count
 * @param cellSize Resolution in meters per cell (dx, dy)
 * @param nodata Value indicating invalid or missing elevation
 */
export function calculateSlopeAndAspect(
  elevations: Float32Array,
  width: number,
  height: number,
  cellSize: number,
  nodata: number = -9999
): SlopeAspectResult {
  const totalCells = width * height;
  const slopes = new Float32Array(totalCells);
  const aspects = new Float32Array(totalCells);

  const radToDeg = 180 / Math.PI;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const centerElev = elevations[idx];

      if (centerElev === nodata || isNaN(centerElev)) {
        slopes[idx] = 0;
        aspects[idx] = -1;
        continue;
      }

      // 3x3 neighborhood coordinates with edge clamping
      const yPrev = Math.max(0, y - 1);
      const yNext = Math.min(height - 1, y + 1);
      const xPrev = Math.max(0, x - 1);
      const xNext = Math.min(width - 1, x + 1);

      // 3x3 kernel elevation values:
      // [a, b, c]
      // [d, e, f]
      // [g, h, i]
      const a = getValidElevation(elevations, yPrev * width + xPrev, centerElev, nodata);
      const b = getValidElevation(elevations, yPrev * width + x, centerElev, nodata);
      const c = getValidElevation(elevations, yPrev * width + xNext, centerElev, nodata);

      const d = getValidElevation(elevations, y * width + xPrev, centerElev, nodata);
      const f = getValidElevation(elevations, y * width + xNext, centerElev, nodata);

      const g = getValidElevation(elevations, yNext * width + xPrev, centerElev, nodata);
      const h = getValidElevation(elevations, yNext * width + x, centerElev, nodata);
      const i = getValidElevation(elevations, yNext * width + xNext, centerElev, nodata);

      // Horn's formulation for orthogonal gradients:
      // dz/dx = ((c + 2f + i) - (a + 2d + g)) / (8 * cellSize)
      // dz/dy = ((g + 2h + i) - (a + 2b + c)) / (8 * cellSize)
      const dz_dx = ((c + 2 * f + i) - (a + 2 * d + g)) / (8 * cellSize);
      const dz_dy = ((g + 2 * h + i) - (a + 2 * b + c)) / (8 * cellSize);

      // Slope magnitude in radians, converted to degrees
      const gradient = Math.sqrt(dz_dx * dz_dx + dz_dy * dz_dy);
      const slopeRad = Math.atan(gradient);
      const slopeDeg = slopeRad * radToDeg;
      slopes[idx] = Math.min(90, Math.max(0, slopeDeg));

      // Aspect angle (compass direction of steepest descent)
      if (gradient < 1e-6) {
        aspects[idx] = -1; // Perfectly flat
      } else {
        // Aspect in cartographic degrees (0° = North, 90° = East, 180° = South, 270° = West)
        let aspectDeg = 57.29578 * Math.atan2(dz_dy, -dz_dx);
        if (aspectDeg < 0) {
          aspectDeg = 90.0 - aspectDeg;
        } else if (aspectDeg > 90.0) {
          aspectDeg = 360.0 - aspectDeg + 90.0;
        } else {
          aspectDeg = 90.0 - aspectDeg;
        }
        aspects[idx] = aspectDeg % 360;
      }
    }
  }

  return { slopes, aspects };
}

function getValidElevation(
  elevations: Float32Array,
  index: number,
  fallback: number,
  nodata: number
): number {
  const val = elevations[index];
  if (val === nodata || isNaN(val)) {
    return fallback;
  }
  return val;
}

/**
 * Returns compass direction string from aspect angle in degrees
 */
export function getAspectDirectionName(aspectDeg: number): string {
  if (aspectDeg < 0) return 'Flat';
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(aspectDeg / 45) % 8;
  return directions[index];
}
