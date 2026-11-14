/**
 * Crestix Probe - Terrain Colormap & Texture Generator
 * Produces cartographic colormaps for elevation, slope gradient, drainage channels,
 * and high-resolution texture data for Three.js terrain meshes.
 */

import { ColormapPalette, TerrainViewMode, LayerSettings } from '../types/terrain';

export interface ColorStop {
  stop: number; // 0.0 to 1.0
  r: number;
  g: number;
  b: number;
}

// Colormap stop definitions:
export const COLORMAPS: Record<ColormapPalette, ColorStop[]> = {
  hypsometric: [
    { stop: 0.0,  r: 24,  g: 78,  b: 119 }, // Deep valley water blue #184e77
    { stop: 0.15, r: 52,  g: 160, b: 164 }, // Low basin teal #34a0a4
    { stop: 0.35, r: 82,  g: 182, b: 154 }, // Alluvial plain emerald #52b69a
    { stop: 0.55, r: 181, g: 228, b: 140 }, // Foothills light green #b5e48c
    { stop: 0.70, r: 217, g: 187, b: 106 }, // Highland golden sandstone
    { stop: 0.85, r: 168, g: 116, b: 83 },  // Rocky mountain brown
    { stop: 1.0,  r: 245, g: 245, b: 250 }  // Peak snow white
  ],
  terrain: [
    { stop: 0.0,  r: 46,  g: 117, b: 89 },  // Lush valley green #2e7559
    { stop: 0.25, r: 92,  g: 157, b: 90 },  // Lower slopes
    { stop: 0.50, r: 194, g: 178, b: 128 }, // Mid-range dry loam / plateau
    { stop: 0.75, r: 143, g: 112, b: 87 },  // Upper rock / scree
    { stop: 0.90, r: 170, g: 170, b: 170 }, // Granite crag
    { stop: 1.0,  r: 255, g: 255, b: 255 }  // Glacial summit
  ],
  viridis: [
    { stop: 0.0,  r: 68,  g: 1,   b: 84 },  // #440154
    { stop: 0.25, r: 59,  g: 82,  b: 139 }, // #3b528b
    { stop: 0.50, r: 33,  g: 145, b: 140 }, // #21918c
    { stop: 0.75, r: 94,  g: 201, b: 98 },  // #5ec962
    { stop: 1.0,  r: 253, g: 231, b: 37 }   // #fde725
  ],
  magma: [
    { stop: 0.0,  r: 0,   g: 0,   b: 4 },   // #000004
    { stop: 0.25, r: 81,  g: 18,  b: 124 }, // #51127c
    { stop: 0.50, r: 182, g: 54,  b: 121 }, // #b63679
    { stop: 0.75, r: 251, g: 136, b: 97 },  // #fb8861
    { stop: 1.0,  r: 252, g: 253, b: 191 }  // #fcfdbf
  ],
  plasma: [
    { stop: 0.0,  r: 13,  g: 8,   b: 135 },
    { stop: 0.25, r: 126, g: 3,   b: 168 },
    { stop: 0.50, r: 204, g: 71,  b: 120 },
    { stop: 0.75, r: 248, g: 149, b: 64 },
    { stop: 1.0,  r: 240, g: 249, b: 33 }
  ],
  slope: [
    { stop: 0.0,  r: 46,  g: 204, b: 113 }, // 0° Gentle - Emerald green
    { stop: 0.15, r: 154, g: 205, b: 50 },  // 5° - 10° Lime green
    { stop: 0.35, r: 241, g: 196, b: 15 },  // 15° Moderate - Amber yellow
    { stop: 0.60, r: 230, g: 126, b: 34 },  // 25° Steep - Orange
    { stop: 1.0,  r: 231, g: 76,  b: 60 }   // 45°+ Extreme - Vivid crimson
  ],
  water: [
    { stop: 0.0,  r: 10,  g: 40,  b: 80 },  // Deep channel
    { stop: 0.4,  r: 14,  g: 116, b: 144 }, // River stream
    { stop: 0.8,  r: 56,  g: 189, b: 248 }, // Shallow flood
    { stop: 1.0,  r: 186, g: 230, b: 253 }  // Wet fringe
  ]
};

/**
 * Interpolates color at normalized parameter t in [0.0, 1.0]
 */
export function interpolateColor(
  t: number,
  palette: ColormapPalette = 'hypsometric'
): { r: number; g: number; b: number } {
  const clampedT = Math.max(0, Math.min(1, t));
  const stops = COLORMAPS[palette] || COLORMAPS.hypsometric;

  if (clampedT <= stops[0].stop) {
    return { r: stops[0].r, g: stops[0].g, b: stops[0].b };
  }
  if (clampedT >= stops[stops.length - 1].stop) {
    const last = stops[stops.length - 1];
    return { r: last.r, g: last.g, b: last.b };
  }

  for (let i = 0; i < stops.length - 1; i++) {
    const s0 = stops[i];
    const s1 = stops[i + 1];
    if (clampedT >= s0.stop && clampedT <= s1.stop) {
      const localT = (clampedT - s0.stop) / (s1.stop - s0.stop);
      return {
        r: Math.round(s0.r + (s1.r - s0.r) * localT),
        g: Math.round(s0.g + (s1.g - s0.g) * localT),
        b: Math.round(s0.b + (s1.b - s0.b) * localT)
      };
    }
  }

  return { r: stops[0].r, g: stops[0].g, b: stops[0].b };
}

/**
 * Generates an RGBA Uint8ClampedArray texture buffer representing the active layer view
 */
export function generateTerrainTextureBuffer(
  elevations: Float32Array,
  slopes: Float32Array,
  flowAccumulations: Float32Array,
  hillshade: Uint8Array,
  floodHazard: Uint8Array,
  minElev: number,
  maxElev: number,
  width: number,
  height: number,
  settings: LayerSettings
): Uint8ClampedArray {
  const total = width * height;
  const buffer = new Uint8ClampedArray(total * 4);
  const elevRange = Math.max(1, maxElev - minElev);

  const maxLogAccum = Math.log(Math.max(...flowAccumulations) + 1);

  for (let i = 0; i < total; i++) {
    const bIdx = i * 4;
    const elev = elevations[i];
    const slope = slopes[i];
    const shade = hillshade[i] / 255;
    const accum = flowAccumulations[i];
    const hazard = floodHazard[i];

    let r = 200, g = 200, b = 200;

    switch (settings.viewMode) {
      case 'elevation': {
        const t = (elev - minElev) / elevRange;
        const c = interpolateColor(t, settings.colormap);
        r = c.r;
        g = c.g;
        b = c.b;
        break;
      }

      case 'slope': {
        // Slope normalized across 0° to 45°
        const t = Math.min(1, slope / 45);
        const c = interpolateColor(t, 'slope');
        r = c.r;
        g = c.g;
        b = c.b;
        break;
      }

      case 'drainage': {
        // Log-scaled flow accumulation
        const logVal = Math.log(accum + 1);
        const t = Math.min(1, logVal / Math.max(1, maxLogAccum));
        
        if (accum > settings.streamThreshold) {
          // Highlight primary river corridors in neon cyan
          r = 0;
          g = 220;
          b = 255;
        } else {
          // Dark topographic base with subtle drainage veins
          const c = interpolateColor(t, 'viridis');
          r = Math.round(c.r * 0.7);
          g = Math.round(c.g * 0.85);
          b = Math.round(c.b * 1.0);
        }
        break;
      }

      case 'hillshade': {
        const val = hillshade[i];
        r = val;
        g = val;
        b = val;
        break;
      }

      case 'floodHazard': {
        const t = hazard / 100;
        const c = interpolateColor(t, 'magma');
        r = c.r;
        g = c.g;
        b = c.b;
        break;
      }

      case 'hybrid':
      default: {
        const t = (elev - minElev) / elevRange;
        const c = interpolateColor(t, settings.colormap);
        // Multiply by hillshade illumination
        const mult = 0.35 + 0.65 * shade;
        r = Math.round(c.r * mult);
        g = Math.round(c.g * mult);
        b = Math.round(c.b * mult);
        break;
      }
    }

    // Overlay stream channels if enabled
    if (settings.showStreams && accum > settings.streamThreshold) {
      r = Math.min(255, Math.round(r * 0.2 + 0 * 0.8));
      g = Math.min(255, Math.round(g * 0.2 + 200 * 0.8));
      b = Math.min(255, Math.round(b * 0.2 + 255 * 0.8));
    }

    // Overlay contour lines if enabled
    if (settings.showContours && settings.contourInterval > 0) {
      const interval = settings.contourInterval;
      const mod = Math.abs(elev % interval);
      if (mod < 1.2 || (interval - mod) < 1.2) {
        // Draw crisp dark contour stroke
        r = Math.round(r * 0.25);
        g = Math.round(g * 0.25);
        b = Math.round(b * 0.25);
      }
    }

    // Water level submergence visual preview
    if (settings.showWaterPlane && elev <= settings.waterLevel) {
      const depth = settings.waterLevel - elev;
      const waterTint = Math.min(1.0, depth / 20); // deeper is darker blue
      r = Math.round(r * (1 - waterTint) + 20 * waterTint);
      g = Math.round(g * (1 - waterTint) + 90 * waterTint);
      b = Math.round(b * (1 - waterTint) + 210 * waterTint);
    }

    buffer[bIdx] = r;
    buffer[bIdx + 1] = g;
    buffer[bIdx + 2] = b;
    buffer[bIdx + 3] = Math.round(settings.opacity * 255);
  }

  return buffer;
}
