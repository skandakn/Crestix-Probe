'use client';

import React from 'react';
import {
  ColormapPalette,
  TerrainViewMode,
  ElevationStats,
  SlopeStats,
  TerrainInspectionPoint
} from '../types/terrain';
import { COLORMAPS } from '../processing/colormap-generator';

interface ElevationLegendProps {
  viewMode: TerrainViewMode;
  colormap: ColormapPalette;
  elevStats: ElevationStats;
  slopeStats: SlopeStats;
  inspectedPoint: TerrainInspectionPoint | null;
}

export const ElevationLegend: React.FC<ElevationLegendProps> = ({
  viewMode,
  colormap,
  elevStats,
  slopeStats,
  inspectedPoint
}) => {
  // Construct CSS linear-gradient string from colormap stops
  const stops = (viewMode === 'slope' ? COLORMAPS.slope : COLORMAPS[colormap]) || COLORMAPS.hypsometric;
  const gradientStops = stops
    .map(s => `rgb(${s.r}, ${s.g}, ${s.b}) ${Math.round(s.stop * 100)}%`)
    .join(', ');
  const cssGradient = `linear-gradient(to top, ${gradientStops})`;

  // Calculate pointer position on the legend if point is hovered
  let pointerNormalized: number | null = null;
  let pointerLabel: string = '';

  if (inspectedPoint) {
    if (viewMode === 'slope') {
      pointerNormalized = Math.min(1, Math.max(0, inspectedPoint.slope / 45));
      pointerLabel = `${inspectedPoint.slope.toFixed(1)}°`;
    } else if (viewMode === 'elevation' || viewMode === 'hybrid') {
      const relief = Math.max(1, elevStats.max - elevStats.min);
      pointerNormalized = Math.min(1, Math.max(0, (inspectedPoint.elevation - elevStats.min) / relief));
      pointerLabel = `${Math.round(inspectedPoint.elevation)}m`;
    }
  }

  // Generate tick labels according to view mode
  let minLabel = `${Math.round(elevStats.min)}m`;
  let maxLabel = `${Math.round(elevStats.max)}m`;
  let midLabel = `${Math.round((elevStats.min + elevStats.max) / 2)}m`;
  let unit = 'Elevation (m)';

  if (viewMode === 'slope') {
    minLabel = '0° (Flat)';
    maxLabel = '≥45° (Cliff)';
    midLabel = '20° (Moderate)';
    unit = 'Slope (Degrees)';
  } else if (viewMode === 'drainage') {
    minLabel = '1 (Ridge)';
    maxLabel = 'High (River)';
    midLabel = 'Tributary';
    unit = 'Accumulation';
  } else if (viewMode === 'floodHazard') {
    minLabel = '0 (Low Risk)';
    maxLabel = '100 (Critical Sink)';
    midLabel = '50 (Moderate)';
    unit = 'Flood Susceptibility';
  }

  return (
    <div className="absolute right-4 bottom-4 z-20 bg-slate-950/85 border border-slate-800 backdrop-blur-md rounded-xl p-3 shadow-xl w-44 select-none">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-300">
          {unit}
        </span>
        <span className="text-[10px] font-mono text-cyan-400">
          {viewMode === 'elevation' || viewMode === 'hybrid' ? `Δ ${Math.round(elevStats.relief)}m` : ''}
        </span>
      </div>

      <div className="relative flex items-center gap-3">
        {/* Color Gradient Bar */}
        <div
          className="relative w-4 h-36 rounded-md shadow-inner border border-slate-700/60 overflow-visible"
          style={{ background: cssGradient }}
        >
          {/* Active Hover Marker on Scale */}
          {pointerNormalized !== null && (
            <div
              className="absolute left-0 -right-2 -translate-y-1/2 flex items-center transition-all duration-75 pointer-events-none"
              style={{ bottom: `${pointerNormalized * 100}%` }}
            >
              <div className="w-full h-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[6px] border-r-white -ml-0.5" />
            </div>
          )}
        </div>

        {/* Ticks and values */}
        <div className="relative flex flex-col justify-between h-36 text-[10px] font-mono text-slate-300 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-px bg-slate-600" />
            <span className="font-semibold text-slate-200">{maxLabel}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-1.5 h-px bg-slate-700" />
            <span>{midLabel}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-px bg-slate-600" />
            <span className="font-semibold text-slate-200">{minLabel}</span>
          </div>

          {/* Hover indicator tooltip badge */}
          {pointerNormalized !== null && (
            <div
              className="absolute -left-12 -translate-y-1/2 bg-cyan-500 text-slate-950 font-bold px-1.5 py-0.5 rounded text-[10px] shadow transition-all duration-75 pointer-events-none"
              style={{ bottom: `${pointerNormalized * 100}%` }}
            >
              {pointerLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
