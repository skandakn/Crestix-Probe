'use client';

import React from 'react';
import { TerrainInspectionPoint } from '../types/terrain';
import {
  Compass,
  Mountain,
  TrendingUp,
  Waves,
  MapPin,
  AlertTriangle,
  Activity
} from 'lucide-react';

interface TerrainInspectorHUDProps {
  point: TerrainInspectionPoint | null;
}

export const TerrainInspectorHUD: React.FC<TerrainInspectorHUDProps> = ({ point }) => {
  if (!point) {
    return (
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 backdrop-blur-md text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400/80 animate-pulse" />
          <span>Hover cursor over 3D terrain surface to inspect coordinates and topography</span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">Live Raycaster Active</span>
      </div>
    );
  }

  const hazardColors = {
    Low: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
    Moderate: 'text-amber-400 bg-amber-950/60 border-amber-800/60',
    High: 'text-orange-400 bg-orange-950/60 border-orange-800/60',
    'Critical Depression': 'text-rose-400 bg-rose-950/60 border-rose-800/60 animate-pulse'
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 backdrop-blur-md shadow-xl transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">
            Coordinates: {point.latitude.toFixed(5)}°N, {point.longitude.toFixed(5)}°E
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            [Grid: {point.gridX}, {point.gridY}]
          </span>
        </div>

        <div className="flex items-center gap-2">
          {point.isSubmerged ? (
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-900/80 text-blue-200 border border-blue-500/60 flex items-center gap-1">
              <Waves className="w-3 h-3 text-blue-300 animate-pulse" />
              Inundated ({point.elevation}m ≤ Water Level)
            </span>
          ) : (
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-medium border flex items-center gap-1 ${
                hazardColors[point.floodRiskCategory]
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Flood Hazard: {point.floodRiskCategory} ({point.floodHazardScore}/100)
            </span>
          )}
        </div>
      </div>

      {/* Grid of metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* Elevation */}
        <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
            <Mountain className="w-3.5 h-3.5 text-cyan-400" />
            <span>Elevation</span>
          </div>
          <div className="text-base font-mono font-bold text-slate-100">
            {point.elevation.toFixed(1)} <span className="text-xs font-normal text-slate-400">m</span>
          </div>
        </div>

        {/* Slope */}
        <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Terrain Slope</span>
          </div>
          <div className="text-base font-mono font-bold text-slate-100">
            {point.slope.toFixed(1)}° <span className="text-xs font-normal text-slate-400">({(Math.tan((point.slope * Math.PI) / 180) * 100).toFixed(0)}%)</span>
          </div>
        </div>

        {/* Aspect */}
        <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
            <Compass className="w-3.5 h-3.5 text-purple-400" />
            <span>Aspect Facing</span>
          </div>
          <div className="text-base font-mono font-bold text-slate-100">
            {point.aspectDirection}{' '}
            <span className="text-xs font-normal text-slate-400">({point.aspect >= 0 ? `${point.aspect.toFixed(0)}°` : 'Flat'})</span>
          </div>
        </div>

        {/* Drainage Flow */}
        <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
            <Waves className="w-3.5 h-3.5 text-blue-400" />
            <span>Flow Accumulation</span>
          </div>
          <div className="text-base font-mono font-bold text-slate-100">
            {point.flowAccumulation.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">cells</span>
          </div>
        </div>
      </div>
    </div>
  );
};
