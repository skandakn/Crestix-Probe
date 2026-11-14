export const GRID_SIZE = 64;
export const VIEWBOX_WIDTH = 800;
export const VIEWBOX_HEIGHT = 480;

export interface BuildingFootprint {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Matches the 8 rectangular building footprints rendered in SimulationPreview.tsx
 */
export const CITY_BUILDINGS: BuildingFootprint[] = [
  { x: 180, y: 70, width: 70, height: 40 },
  { x: 290, y: 65, width: 85, height: 45 },
  { x: 420, y: 80, width: 60, height: 40 },
  { x: 580, y: 75, width: 90, height: 50 },
  { x: 140, y: 210, width: 80, height: 45 },
  { x: 620, y: 200, width: 75, height: 55 },
  { x: 190, y: 380, width: 85, height: 45 },
  { x: 360, y: 390, width: 95, height: 45 },
];

const BUILDING_ELEVATION_M = 6.5;

function distanceToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/**
 * Generates a deterministic 64x64 Digital Elevation Model (DEM) in meters
 * matching the background city map layout:
 * - Building footprints: > 5.0m (6.5m) so floodwater wraps around rooftops
 * - Low-lying road channels & culvert basins: 0.0m - 1.5m
 * - Northern/southern higher terrain ridges: 1.6m - 3.2m
 */
export function createCityDEM(): Float32Array {
  const dem = new Float32Array(GRID_SIZE * GRID_SIZE);

  for (let gy = 0; gy < GRID_SIZE; gy++) {
    const sy = ((gy + 0.5) / GRID_SIZE) * VIEWBOX_HEIGHT;
    const ny = sy / VIEWBOX_HEIGHT;

    for (let gx = 0; gx < GRID_SIZE; gx++) {
      const sx = ((gx + 0.5) / GRID_SIZE) * VIEWBOX_WIDTH;
      const nx = sx / VIEWBOX_WIDTH;

      const isBuilding = CITY_BUILDINGS.some(
        (b) =>
          sx >= b.x &&
          sx <= b.x + b.width &&
          sy >= b.y &&
          sy <= b.y + b.height
      );

      if (isBuilding) {
        dem[gy * GRID_SIZE + gx] = BUILDING_ELEVATION_M;
        continue;
      }

      // Main east-west drainage valley centered around ny = 0.54
      const valley = Math.pow((ny - 0.54) * 2.35, 2) * 2.1;

      // Culvert / stormwater corridor depression: (220,110) -> (220,240) -> (480,260) -> (680,350)
      const dSeg1 = distanceToSegment(sx, sy, 220, 110, 220, 240);
      const dSeg2 = distanceToSegment(sx, sy, 220, 240, 480, 260);
      const dSeg3 = distanceToSegment(sx, sy, 480, 260, 680, 350);
      const minCulvertDist = Math.min(dSeg1, dSeg2, dSeg3);
      const culvertCarve = 0.72 * Math.exp(-(minCulvertDist * minCulvertDist) / (2 * 62 * 62));

      // Natural street-basin depressions around sensor nodes CX-N01..CX-N04
      const basin1 = 0.45 * Math.exp(-((sx - 235) ** 2 + (sy - 245) ** 2) / (2 * 85 * 85));
      const basin2 = 0.52 * Math.exp(-((sx - 390) ** 2 + (sy - 265) ** 2) / (2 * 95 * 95));
      const basin3 = 0.55 * Math.exp(-((sx - 525) ** 2 + (sy - 235) ** 2) / (2 * 90 * 90));
      const basin4 = 0.48 * Math.exp(-((sx - 335) ** 2 + (sy - 335) ** 2) / (2 * 80 * 80));

      // Gentle micro-topography ripple
      const ripple =
        0.12 * Math.sin(nx * Math.PI * 4) * Math.cos(ny * Math.PI * 3) +
        0.08 * Math.cos(nx * Math.PI * 7 + ny * Math.PI * 5);

      // Base elevation normalized so lowest depression is ~0.0m
      const rawElev = 1.08 + valley - culvertCarve - Math.max(basin1, basin2, basin3, basin4) + ripple;
      dem[gy * GRID_SIZE + gx] = Math.max(0.0, Math.min(3.5, rawElev));
    }
  }

  return dem;
}

/**
 * Maps water depth (meters) to RGBA matching the simulator legend:
 * - depth <= 0.005m -> alpha = 0
 * - 0.1m -> #0284c7 (deep transparent cyan/blue)
 * - 0.5m -> #38bdf8 (bright sky blue)
 * - 1.0m -> #facc15 (amber/yellow)
 * - >1.5m -> #ef4444 (critical red)
 */
export function depthToRGBA(depth: number): [number, number, number, number] {
  if (depth <= 0.005) return [0, 0, 0, 0];

  const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);

  if (depth <= 0.1) {
    const t = depth / 0.1;
    return [2, 132, 199, lerp(25, 145, t)];
  }
  if (depth <= 0.5) {
    const t = (depth - 0.1) / 0.4;
    return [lerp(2, 56, t), lerp(132, 189, t), lerp(199, 248, t), lerp(145, 195, t)];
  }
  if (depth <= 1.0) {
    const t = (depth - 0.5) / 0.5;
    return [lerp(56, 250, t), lerp(189, 204, t), lerp(248, 21, t), lerp(195, 222, t)];
  }
  if (depth <= 1.5) {
    const t = (depth - 1.0) / 0.5;
    return [lerp(250, 239, t), lerp(204, 68, t), lerp(21, 68, t), lerp(222, 242, t)];
  }
  return [239, 68, 68, 242];
}

/**
 * Renders the 64x64 terrain-masked water-depth heatmap onto the target canvas
 * using bilinear smoothing and subtle contour blending.
 */
export function renderFloodHeatmapCanvas(
  canvas: HTMLCanvasElement,
  dem: Float32Array,
  waterSurfaceElevationM: number
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const offscreen = document.createElement("canvas");
  offscreen.width = GRID_SIZE;
  offscreen.height = GRID_SIZE;
  const offCtx = offscreen.getContext("2d");
  if (!offCtx) return;

  const imgData = offCtx.createImageData(GRID_SIZE, GRID_SIZE);
  const data = imgData.data;

  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    const depth = Math.max(0, waterSurfaceElevationM - dem[i]);
    const [r, g, b, a] = depthToRGBA(depth);
    const idx = i * 4;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = a;
  }

  offCtx.putImageData(imgData, 0, 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.filter = "blur(2.5px)";
  ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);
  ctx.restore();
}

