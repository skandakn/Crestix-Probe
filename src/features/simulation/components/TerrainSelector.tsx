"use client";

import React from "react";
import { TerrainPreset } from "../types/contract";
import { TERRAIN_PRESETS } from "../data/terrain-presets";
import { Mountain, Layers, Grid, Compass } from "lucide-react";

interface TerrainSelectorProps {
  selectedTerrainId: string;
  onSelectTerrain: (preset: TerrainPreset) => void;
  disabled?: boolean;
}

export const TerrainSelector: React.FC<TerrainSelectorProps> = ({
  selectedTerrainId,
  onSelectTerrain,
  disabled = false,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Mountain className="w-4 h-4 text-cyan-400" />
          Terrain Digital Elevation Model (DEM)
        </label>
        <span className="text-[11px] text-slate-400 font-mono">
          {TERRAIN_PRESETS.length} presets
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {TERRAIN_PRESETS.map((preset) => {
          const isSelected = preset.id === selectedTerrainId;

          // Compute elevation range for display
          let minZ = Infinity;
          let maxZ = -Infinity;
          preset.elevationGrid.forEach((row) =>
            row.forEach((z) => {
              if (z < minZ) minZ = z;
              if (z > maxZ) maxZ = z;
            })
          );

          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectTerrain(preset)}
              className={`p-3 rounded-xl text-left transition-all border relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? "bg-slate-800/90 border-cyan-400/80 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-500/50"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-400"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden pointer-events-none">
                  <div className="bg-cyan-500 text-slate-950 text-[9px] font-bold py-0.5 text-center transform rotate-45 translate-x-3 -translate-y-1 shadow">
                    ACTIVE
                  </div>
                </div>
              )}

              <div className="space-y-1 pr-6">
                <div className="font-semibold text-xs text-slate-100 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  {preset.name}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                  {preset.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <div className="flex items-center gap-1">
                  <Grid className="w-3 h-3 text-slate-500" />
                  <span>
                    {preset.rows}×{preset.cols} ({preset.cellSizeMeters}m dx)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Compass className="w-3 h-3 text-slate-500" />
                  <span>
                    Δz: {minZ.toFixed(1)}m – {maxZ.toFixed(1)}m
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
