/**
 * Crestix Probe - Demonstration Sample Terrains
 * Geomorphologically authentic terrain datasets for immediate exploration and flood study.
 */

import { TerrainMetadata, ProcessedDEMData } from '../types/terrain';
import { processDEM } from '../processing/dem-processor';

export interface SampleTerrainDefinition {
  id: string;
  name: string;
  tagline: string;
  description: string;
  type: 'fluvial' | 'alpine' | 'coastal' | 'urban';
  width: number;
  height: number;
  cellSize: number;
  generator: (width: number, height: number, cellSize: number) => Float32Array;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  crs: string;
}

// 2D Simplex/Perlin-style multi-octave harmonic noise generator
function coherentNoise(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  // Hermite smoothstep
  const sx = xf * xf * (3 - 2 * xf);
  const sy = yf * yf * (3 - 2 * yf);

  const n00 = coherentNoise(xi, yi);
  const n10 = coherentNoise(xi + 1, yi);
  const n01 = coherentNoise(xi, yi + 1);
  const n11 = coherentNoise(xi + 1, yi + 1);

  const nx0 = n00 * (1 - sx) + n10 * sx;
  const nx1 = n01 * (1 - sx) + n11 * sx;

  return nx0 * (1 - sy) + nx1 * sy;
}

function octaveNoise(x: number, y: number, octaves: number = 4, persistence: number = 0.5): number {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    total += smoothNoise(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }

  return total / maxValue;
}

export const SAMPLE_TERRAIN_DEFINITIONS: SampleTerrainDefinition[] = [
  {
    id: 'crestix-river-valley',
    name: 'Crestix River Valley & Floodplain',
    tagline: 'Alluvial Meander Basin • Low-lying Fluvial Flood Risk',
    description: 
      'A broad river valley bounded by eastern and western terraced ridges. Natural oxbow curves and low elevation floodplains demonstrate dynamic backwater flooding and bank breach scenarios.',
    type: 'fluvial',
    width: 64,
    height: 64,
    cellSize: 20, // 20m resolution -> 1.28km x 1.28km
    bounds: { north: 12.985, south: 12.973, east: 77.615, west: 77.602 },
    crs: 'EPSG:4326 (WGS84)',
    generator: (w, h) => {
      const elev = new Float32Array(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const u = x / (w - 1); // 0 to 1
          const v = y / (h - 1); // 0 to 1

          // Fluvial valley cross profile: high on edges, trough in middle
          const valleyCenterU = 0.5 + 0.18 * Math.sin(v * Math.PI * 2.5);
          const distToRiver = Math.abs(u - valleyCenterU);

          // Valley slopes
          const valleyRelief = Math.pow(distToRiver * 2.2, 1.8) * 120;

          // Rolling hills noise
          const terrainNoise = octaveNoise(u * 5, v * 5, 4, 0.5) * 45;

          // River incised channel
          const riverIncise = Math.exp(-Math.pow(distToRiver / 0.05, 2)) * 14;

          const baseElevation = 450 + valleyRelief + terrainNoise - riverIncise;
          elev[idx] = Math.max(435, baseElevation);
        }
      }
      return elev;
    }
  },
  {
    id: 'mountain-ravine-watershed',
    name: 'Alpine Watershed & Flash Flood Ravine',
    tagline: 'Steep Slopes • Rapid Hydrologic Concentration',
    description: 
      'High-relief mountainous terrain featuring steep slopes exceeding 35°, knife-edge ridge divides, and narrow tributary ravines prone to rapid debris flow and flash flooding during cloudbursts.',
    type: 'alpine',
    width: 64,
    height: 64,
    cellSize: 25, // 25m resolution -> 1.6km x 1.6km
    bounds: { north: 31.145, south: 31.130, east: 77.195, west: 77.180 },
    crs: 'EPSG:32643 (UTM Zone 43N)',
    generator: (w, h) => {
      const elev = new Float32Array(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const u = x / (w - 1);
          const v = y / (h - 1);

          // Ridge spines and steep ravine
          const primarySlope = (1.0 - v) * 320;
          const ridge = Math.abs(Math.sin((u * 3 + v * 2) * Math.PI)) * 180;
          const jaggedNoise = octaveNoise(u * 7, v * 7, 5, 0.55) * 110;

          // Central drainage gorge carving down
          const gorgeDist = Math.abs(u - 0.45 - 0.1 * Math.sin(v * 4));
          const gorgeCarve = Math.exp(-Math.pow(gorgeDist / 0.08, 2)) * 85;

          elev[idx] = 1200 + primarySlope + ridge + jaggedNoise - gorgeCarve;
        }
      }
      return elev;
    }
  },
  {
    id: 'coastal-estuary-delta',
    name: 'Coastal Delta & Tidal Estuary',
    tagline: 'Near-Sea Level • Storm Surge & Backwater Inundation',
    description: 
      'Low gradient delta plain with braided estuary arms, tidal flats, and low coastal ridges. Displays vulnerability to compounding river discharge and storm surge water levels.',
    type: 'coastal',
    width: 64,
    height: 64,
    cellSize: 15, // 15m resolution -> 960m x 960m
    bounds: { north: 21.650, south: 21.640, east: 88.220, west: 88.210 },
    crs: 'EPSG:4326 (WGS84)',
    generator: (w, h) => {
      const elev = new Float32Array(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const u = x / (w - 1);
          const v = y / (h - 1);

          // Subtle gradient sloping towards the coast (south)
          const coastalSlope = v * 8.5; // elevations under 12 meters
          const sandDunes = Math.sin(u * 8) * 2.5 * (1 - v);
          const marshNoise = octaveNoise(u * 6, v * 6, 3, 0.4) * 3.2;

          // Braided channels
          const ch1 = Math.exp(-Math.pow((u - 0.3 - 0.1 * Math.sin(v * 5)) / 0.04, 2)) * 3.0;
          const ch2 = Math.exp(-Math.pow((u - 0.7 + 0.12 * Math.cos(v * 4)) / 0.05, 2)) * 2.8;

          elev[idx] = Math.max(0.5, 2.0 + coastalSlope + sandDunes + marshNoise - ch1 - ch2);
        }
      }
      return elev;
    }
  },
  {
    id: 'urban-depression-basin',
    name: 'Urban Plain & Depression Sinks',
    tagline: 'Impervious Lowlands • Pluvial Drainage Sinks',
    description: 
      'Gently undulating metropolitan plain featuring structural depressions and enclosed sinks that lack natural surface outlets, representing severe urban pluvial inundation zones.',
    type: 'urban',
    width: 64,
    height: 64,
    cellSize: 10, // 10m resolution -> 640m x 640m
    bounds: { north: 13.020, south: 13.014, east: 77.585, west: 77.579 },
    crs: 'EPSG:4326 (WGS84)',
    generator: (w, h) => {
      const elev = new Float32Array(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const u = x / (w - 1);
          const v = y / (h - 1);

          // Gentle regional slope
          const base = 890 + u * 12 + v * 8;
          const microTopography = octaveNoise(u * 4, v * 4, 3, 0.5) * 8.5;

          // Two distinct depression bowls (urban sinks)
          const distSink1 = Math.hypot(u - 0.35, v - 0.45);
          const sink1 = Math.exp(-Math.pow(distSink1 / 0.12, 2)) * 9.5;

          const distSink2 = Math.hypot(u - 0.72, v - 0.68);
          const sink2 = Math.exp(-Math.pow(distSink2 / 0.15, 2)) * 8.0;

          elev[idx] = base + microTopography - sink1 - sink2;
        }
      }
      return elev;
    }
  }
];

export function getSampleTerrain(id: string): ProcessedDEMData {
  const def = SAMPLE_TERRAIN_DEFINITIONS.find(s => s.id === id) || SAMPLE_TERRAIN_DEFINITIONS[0];
  const rawElevations = def.generator(def.width, def.height, def.cellSize);

  const metadata: TerrainMetadata = {
    id: def.id,
    name: def.name,
    description: def.description,
    format: 'synthetic',
    width: def.width,
    height: def.height,
    cellSize: def.cellSize,
    nodataValue: -9999,
    bounds: def.bounds,
    crs: def.crs,
    createdAt: new Date().toISOString()
  };

  return processDEM(metadata, rawElevations);
}
