/**
 * Crestix Probe - Drainage & Flow Network Analyzer
 * Implements the deterministic 8-neighbor (D8) routing model (O'Callaghan & Mark, 1984)
 * and upslope contributing area accumulation for flood pathway discovery.
 */

export interface DrainageResult {
  flowDirections: Uint8Array;      // D8 codes: 1=E, 2=SE, 4=S, 8=SW, 16=W, 32=NW, 64=N, 128=NE, 0=Sink
  flowAccumulations: Float32Array; // Upslope cell count draining into this cell
  depressionCount: number;         // Count of local pit/sink depressions
  streamCellCount: number;         // Cells identified as primary stream channels
  floodHazard: Uint8Array;         // 0 - 100 flood susceptibility index based on TWI
}

// 8 neighbor offsets [dx, dy] and their standard D8 codes:
// 32  64  128 (NW, N, NE)
// 16   0    1 (W,  C,  E)
//  8   4    2 (SW, S, SE)
const NEIGHBORS = [
  { dx: 1,  dy: 0,  code: 1,   dist: 1.0 },         // East
  { dx: 1,  dy: 1,  code: 2,   dist: Math.SQRT2 },  // South-East
  { dx: 0,  dy: 1,  code: 4,   dist: 1.0 },         // South
  { dx: -1, dy: 1,  code: 8,   dist: Math.SQRT2 },  // South-West
  { dx: -1, dy: 0,  code: 16,  dist: 1.0 },         // West
  { dx: -1, dy: -1, code: 32,  dist: Math.SQRT2 },  // North-West
  { dx: 0,  dy: -1, code: 64,  dist: 1.0 },         // North
  { dx: 1,  dy: -1, code: 128, dist: Math.SQRT2 }   // North-East
];

export function analyzeDrainage(
  elevations: Float32Array,
  slopes: Float32Array,
  width: number,
  height: number,
  cellSize: number,
  nodata: number = -9999
): DrainageResult {
  const totalCells = width * height;
  const flowDirections = new Uint8Array(totalCells);
  const flowAccumulations = new Float32Array(totalCells);
  const inDegree = new Uint16Array(totalCells);

  // 1. Calculate D8 steepest descent direction
  let depressionCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const elev = elevations[idx];

      if (elev === nodata || isNaN(elev)) {
        flowDirections[idx] = 0;
        continue;
      }

      let maxDropSlope = 0;
      let steepestCode = 0;
      let targetIdx = -1;

      for (let n = 0; n < NEIGHBORS.length; n++) {
        const nx = x + NEIGHBORS[n].dx;
        const ny = y + NEIGHBORS[n].dy;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIdx = ny * width + nx;
          const nElev = elevations[nIdx];

          if (nElev !== nodata && !isNaN(nElev)) {
            const drop = elev - nElev;
            if (drop > 0) {
              const dropSlope = drop / (NEIGHBORS[n].dist * cellSize);
              if (dropSlope > maxDropSlope) {
                maxDropSlope = dropSlope;
                steepestCode = NEIGHBORS[n].code;
                targetIdx = nIdx;
              }
            }
          }
        }
      }

      if (steepestCode > 0 && targetIdx >= 0) {
        flowDirections[idx] = steepestCode;
        inDegree[targetIdx]++;
      } else {
        flowDirections[idx] = 0; // Local sink or flat depression
        depressionCount++;
      }
    }
  }

  // 2. Accumulate flow using topological sorting (Kahn's algorithm)
  // Initialize queue with all headwater cells (in-degree = 0)
  const queue: number[] = [];
  for (let i = 0; i < totalCells; i++) {
    flowAccumulations[i] = 1.0; // Base contribution: cell itself (1 unit)
    if (inDegree[i] === 0) {
      queue.push(i);
    }
  }

  let head = 0;
  while (head < queue.length) {
    const currentIdx = queue[head++];
    const dir = flowDirections[currentIdx];
    if (dir === 0) continue; // Terminal sink

    // Find recipient cell index
    const cx = currentIdx % width;
    const cy = Math.floor(currentIdx / width);
    const neighbor = NEIGHBORS.find(n => n.code === dir);

    if (neighbor) {
      const nx = cx + neighbor.dx;
      const ny = cy + neighbor.dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nextIdx = ny * width + nx;
        flowAccumulations[nextIdx] += flowAccumulations[currentIdx];

        inDegree[nextIdx]--;
        if (inDegree[nextIdx] === 0) {
          queue.push(nextIdx);
        }
      }
    }
  }

  // 3. Classify streams and compute flood hazard score (Topographic Wetness Index proxy)
  // Stream threshold: cells where accumulated upslope area exceeds 1.5% of total cells or 50 cells
  const streamThreshold = Math.max(20, Math.floor(totalCells * 0.015));
  let streamCellCount = 0;
  const floodHazard = new Uint8Array(totalCells);

  let maxLogTwi = 0.001;
  const rawTwi = new Float32Array(totalCells);

  for (let i = 0; i < totalCells; i++) {
    const accum = flowAccumulations[i];
    if (accum >= streamThreshold) {
      streamCellCount++;
    }

    const slopeDeg = slopes[i];
    const slopeRad = Math.max(0.0175, (slopeDeg * Math.PI) / 180); // clamp min slope to 1 deg
    const tanSlope = Math.tan(slopeRad);

    // TWI = ln(a / tan(beta)), where a is upslope area per unit contour width
    const twi = Math.log(Math.max(1, accum * cellSize) / tanSlope);
    rawTwi[i] = twi;
    if (twi > maxLogTwi) maxLogTwi = twi;
  }

  // Normalize flood hazard score to 0 - 100
  for (let i = 0; i < totalCells; i++) {
    const normalized = Math.min(100, Math.max(0, Math.round((rawTwi[i] / maxLogTwi) * 100)));
    floodHazard[i] = normalized;
  }

  return {
    flowDirections,
    flowAccumulations,
    depressionCount,
    streamCellCount,
    floodHazard
  };
}
