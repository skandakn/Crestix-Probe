"use client";

import React from "react";
import { SimulationRunRequest } from "../types/contract";
import { TERRAIN_PRESETS } from "../data/terrain-presets";
import { FileText, MapPin, CloudRain, Clock, Waves, Shield, Cpu, Server } from "lucide-react";

interface ConfigurationSummaryProps {
  config: SimulationRunRequest;
  adapterType: "mock" | "http";
  simulationId: string | null;
  status: string;
}

export const ConfigurationSummary: React.FC<ConfigurationSummaryProps> = ({
  config,
  adapterType,
  simulationId,
  status,
}) => {
  const currentPreset = TERRAIN_PRESETS.find((p) => p.id === config.terrainId);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3.5 backdrop-blur-md shadow-lg text-xs">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <h4 className="font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          Simulation Configuration Summary
        </h4>
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span className="text-slate-500">ID:</span>
          <span className="text-slate-300 font-semibold truncate max-w-[120px]" title={simulationId || "None"}>
            {simulationId ? simulationId.substring(0, 14) + "..." : "Not Launched"}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded uppercase font-bold text-[9px] ${
              status === "completed"
                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                : status === "running"
                ? "bg-cyan-950 text-cyan-300 border border-cyan-800 animate-pulse"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Terrain */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-slate-400 text-[10px] flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3 text-cyan-400" />
            Terrain & Grid
          </div>
          <div className="font-semibold text-slate-200 truncate">{currentPreset?.name || config.terrainId}</div>
          <div className="text-[10px] text-slate-500 font-mono">
            {config.gridDimensions.rows}×{config.gridDimensions.cols} ({config.gridDimensions.cellSizeMeters}m cell)
          </div>
        </div>

        {/* Rainfall Intensity */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-slate-400 text-[10px] flex items-center gap-1 mb-1">
            <CloudRain className="w-3 h-3 text-cyan-400" />
            Rainfall Rate
          </div>
          <div className="font-semibold text-cyan-300 font-mono">
            {config.rainfall.intensityMmPerHour} mm/h
          </div>
          <div className="text-[10px] text-slate-500">
            Intensity forcing
          </div>
        </div>

        {/* Rainfall Duration */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-slate-400 text-[10px] flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            Rainfall Duration
          </div>
          <div className="font-semibold text-slate-200 font-mono">
            {config.rainfall.durationMinutes} min
          </div>
          <div className="text-[10px] text-slate-500">
            Window limit
          </div>
        </div>

        {/* Roughness */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-slate-400 text-[10px] flex items-center gap-1 mb-1">
            <Waves className="w-3 h-3 text-cyan-400" />
            Manning&apos;s n
          </div>
          <div className="font-semibold text-slate-200 font-mono">
            {config.surfaceRoughnessManning.toFixed(3)}
          </div>
          <div className="text-[10px] text-slate-500">
            Friction factor
          </div>
        </div>

        {/* Boundary */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-slate-400 text-[10px] flex items-center gap-1 mb-1">
            <Shield className="w-3 h-3 text-cyan-400" />
            Boundaries
          </div>
          <div className="font-mono text-[10px] text-slate-300 space-x-1">
            <span>N:{config.boundaryConditions.north[0].toUpperCase()}</span>
            <span>S:{config.boundaryConditions.south[0].toUpperCase()}</span>
            <span>E:{config.boundaryConditions.east[0].toUpperCase()}</span>
            <span>W:{config.boundaryConditions.west[0].toUpperCase()}</span>
          </div>
          <div className="text-[10px] text-slate-500">
            Edges (C/O/W/I)
          </div>
        </div>

        {/* Engine Adapter */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-slate-400 text-[10px] flex items-center gap-1 mb-1">
            {adapterType === "mock" ? (
              <Cpu className="w-3 h-3 text-cyan-400" />
            ) : (
              <Server className="w-3 h-3 text-blue-400" />
            )}
            Engine Adapter
          </div>
          <div className="font-semibold text-slate-200 capitalize">
            {adapterType === "mock" ? "Mock Engine" : "Live HTTP API"}
          </div>
          <div className="text-[10px] text-slate-500">
            {adapterType === "mock" ? "Deterministic" : "REST Backend"}
          </div>
        </div>
      </div>
    </div>
  );
};
