import { TerrainPreset } from "../types/contract";

/**
 * Generate 2D elevation grid for an Urban Basin
 * A bowl depression with higher edges, a raised central highway berm, and a retention sump.
 */
function createUrbanBasin(): number[][] {
  const rows = 20;
  const cols = 20;
  const grid: number[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      const dx = (c - cols / 2) / (cols / 2);
      const dy = (r - rows / 2) / (rows / 2);
      const distFromCenter = Math.sqrt(dx * dx + dy * dy);

      // Base bowl depression: lower in middle, higher at perimeter
      let z = 5.0 + 8.0 * Math.pow(distFromCenter, 2);

      // Berm / elevated highway embankment running east-west
      if (r === 9 || r === 10) {
        z += 1.8;
      }
      // Culvert breach through berm
      if ((r === 9 || r === 10) && (c === 9 || c === 10)) {
        z -= 2.2;
      }

      // Retention sump at bottom-left corner
      if (r >= 14 && r <= 17 && c >= 3 && c <= 6) {
        z -= 1.5;
      }

      row.push(parseFloat(Math.max(1.0, z).toFixed(2)));
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Generate 2D elevation grid for a Fluvial River Valley
 * Meandering river channel flanked by gentle terraces and steeper valley walls.
 */
function createFluvialValley(): number[][] {
  const rows = 24;
  const cols = 24;
  const grid: number[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      // Valley runs roughly north-to-south, with a gentle downslope from r=0 to r=rows
      const slope = 15.0 - (r / rows) * 6.0;

      // Channel center meanders
      const riverCenter = cols / 2 + Math.sin((r / rows) * Math.PI * 2) * 4.0;
      const distFromRiver = Math.abs(c - riverCenter);

      let channelProfile = 0;
      if (distFromRiver < 2.5) {
        // In the riverbed
        channelProfile = -3.5 + Math.pow(distFromRiver / 2.5, 2) * 1.5;
      } else {
        // Terraces and valley slopes
        channelProfile = Math.pow((distFromRiver - 2.5) / (cols / 2), 1.8) * 9.0;
      }

      const z = slope + channelProfile;
      row.push(parseFloat(Math.max(0.5, z).toFixed(2)));
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Generate 2D elevation grid for a Coastal Lowland
 * Flat coastal plain sloping down to the coast with protective dune barrier and breach inlet.
 */
function createCoastalLowland(): number[][] {
  const rows = 22;
  const cols = 22;
  const grid: number[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      // Land to sea gradient (inland at top r=0, coastline at r=18, open sea at r>=19)
      let z = 6.0 - (r / rows) * 5.0;

      // Coastal dune ridge at r = 16-17
      if (r === 16 || r === 17) {
        z += 2.0;
        // Tidal inlet breach through dunes
        if (c >= 9 && c <= 12) {
          z -= 2.6;
        }
      }

      // Micro-topography mounds
      const noise = Math.sin(c * 0.7) * Math.cos(r * 0.5) * 0.4;
      z += noise;

      row.push(parseFloat(Math.max(0.2, z).toFixed(2)));
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Generate 2D elevation grid for Steep Mountain Catchment
 */
function createMountainCatchment(): number[][] {
  const rows = 20;
  const cols = 20;
  const grid: number[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      // Steep downward slope from top-left (high) to bottom-right (outlet)
      const grad = 30.0 - ((r + c) / (rows + cols)) * 22.0;
      // Two converging gullies
      const gully1 = Math.abs(c - r * 0.8);
      const gully2 = Math.abs(cols - c - r * 0.7);
      const gullyCarve = Math.min(gully1, gully2) < 2.5 ? -2.8 : 0;

      const z = grad + gullyCarve;
      row.push(parseFloat(Math.max(1.0, z).toFixed(2)));
    }
    grid.push(row);
  }
  return grid;
}

export const TERRAIN_PRESETS: TerrainPreset[] = [
  {
    id: "urban-basin",
    name: "Urban Retention Basin",
    description: "Impervious urban bowl with concrete road berms, culvert breach, and low-lying retention sump. Rapid runoff response.",
    rows: 20,
    cols: 20,
    cellSizeMeters: 10,
    elevationGrid: createUrbanBasin(),
    defaultRoughness: 0.02,
    suggestedRainfallMmPerHour: 65,
    suggestedDurationMinutes: 60,
  },
  {
    id: "valley-fluvial",
    name: "Fluvial River Valley",
    description: "Meandering natural river channel flanked by gentle floodplains and steep valley walls. Inflow channel propagation.",
    rows: 24,
    cols: 24,
    cellSizeMeters: 15,
    elevationGrid: createFluvialValley(),
    defaultRoughness: 0.035,
    suggestedRainfallMmPerHour: 45,
    suggestedDurationMinutes: 90,
  },
  {
    id: "coastal-lowland",
    name: "Coastal Lowland & Estuary",
    description: "Gentle coastal plain protected by dune berms with tidal inlet breaches. Susceptible to backwater ponding.",
    rows: 22,
    cols: 22,
    cellSizeMeters: 12,
    elevationGrid: createCoastalLowland(),
    defaultRoughness: 0.03,
    suggestedRainfallMmPerHour: 55,
    suggestedDurationMinutes: 75,
  },
  {
    id: "mountain-catchment",
    name: "Steep Mountain Catchment",
    description: "High-gradient alpine gully system with rapid convergence into a narrow gorge outlet.",
    rows: 20,
    cols: 20,
    cellSizeMeters: 8,
    elevationGrid: createMountainCatchment(),
    defaultRoughness: 0.045,
    suggestedRainfallMmPerHour: 80,
    suggestedDurationMinutes: 45,
  },
];
