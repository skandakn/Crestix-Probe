"use client";

import React, { useState } from "react";
import {
  SimulationRunRequest,
  BoundaryConditionType,
  BoundaryConditionsConfig,
} from "../types/contract";
import {
  CloudRain,
  Clock,
  Droplets,
  Waves,
  Shield,
  Play,
  RotateCcw,
  Server,
  Cpu,
  HelpCircle,
  Activity,
  Zap,
} from "lucide-react";

interface ParameterControlsProps {
  config: SimulationRunRequest;
  onChangeConfig: (newConfig: SimulationRunRequest) => void;
  onStartSimulation: () => void;
  onResetSimulation: () => void;
  isLoading: boolean;
  activeAdapterType: "mock" | "http";
  onToggleAdapter: (type: "mock" | "http") => void;
  adapterHealthMessage?: string;
  hasFrames: boolean;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  config,
  onChangeConfig,
  onStartSimulation,
  onResetSimulation,
  isLoading,
  activeAdapterType,
  onToggleAdapter,
  adapterHealthMessage,
  hasFrames,
}) => {
  const [showRoughnessGuide, setShowRoughnessGuide] = useState(false);

  const updateRainfall = (key: keyof SimulationRunRequest["rainfall"], value: number) => {
    onChangeConfig({
      ...config,
      rainfall: {
        ...config.rainfall,
        [key]: value,
      },
    });
  };

  const updateBoundary = (side: keyof BoundaryConditionsConfig, value: BoundaryConditionType) => {
    onChangeConfig({
      ...config,
      boundaryConditions: {
        ...config.boundaryConditions,
        [side]: value,
      },
    });
  };

  const applyUniformBoundary = (val: BoundaryConditionType) => {
    onChangeConfig({
      ...config,
      boundaryConditions: {
        north: val,
        south: val,
        east: val,
        west: val,
      },
    });
  };

  // Roughness presets
  const roughnessPresets = [
    { label: "Smooth Concrete", n: 0.013, desc: "Paved drainage canal" },
    { label: "Urban Impervious", n: 0.02, desc: "Asphalt roads & streets" },
    { label: "Natural Grass", n: 0.035, desc: "Pasture & light turf" },
    { label: "Dense Forest", n: 0.06, desc: "Heavy underbrush & trees" },
  ];

  // Rainfall presets
  const rainfallPresets = [
    { label: "Light", mm: 15, duration: 45 },
    { label: "Moderate", mm: 35, duration: 60 },
    { label: "Heavy Storm", mm: 65, duration: 60 },
    { label: "Extreme Torrential", mm: 110, duration: 30 },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 space-y-6 shadow-xl backdrop-blur-md">
      {/* Header with Adapter Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Simulation Parameters & Boundary Conditions
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure hydraulic forcing, friction coefficients and edge conditions.
          </p>
        </div>

        {/* Adapter Mode Toggle Switch */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onToggleAdapter("mock")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeAdapterType === "mock"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Local Deterministic Mock Adapter (Contract test)"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Deterministic Mock</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleAdapter("http")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeAdapterType === "http"
                ? "bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Live Backend Microservice Adapter (/api/simulation)"
          >
            <Server className="w-3.5 h-3.5" />
            <span>Live HTTP API</span>
          </button>
        </div>
      </div>

      {adapterHealthMessage && (
        <div
          className={`px-3 py-2 rounded-lg text-xs flex items-center justify-between border ${
            activeAdapterType === "mock"
              ? "bg-cyan-950/30 border-cyan-800/40 text-cyan-300"
              : "bg-blue-950/30 border-blue-800/40 text-blue-300"
          }`}
        >
          <span className="truncate pr-2 font-mono text-[11px]">{adapterHealthMessage}</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700">
            {activeAdapterType}
          </span>
        </div>
      )}

      {/* Grid of Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Rainfall Intensity */}
        <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 space-y-2.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-cyan-400" />
              Rainfall Intensity
            </label>
            <div className="flex items-center gap-1 font-mono text-cyan-300 font-bold text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              <input
                type="number"
                min="0"
                max="200"
                value={config.rainfall.intensityMmPerHour}
                onChange={(e) =>
                  updateRainfall("intensityMmPerHour", Math.max(0, parseFloat(e.target.value) || 0))
                }
                className="w-12 bg-transparent text-right focus:outline-none"
              />
              <span className="text-slate-400 font-normal">mm/h</span>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="150"
            step="5"
            value={config.rainfall.intensityMmPerHour}
            onChange={(e) => updateRainfall("intensityMmPerHour", parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          <div className="flex flex-wrap gap-1 pt-1">
            {rainfallPresets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  onChangeConfig({
                    ...config,
                    rainfall: {
                      intensityMmPerHour: p.mm,
                      durationMinutes: p.duration,
                    },
                  });
                }}
                className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                  config.rainfall.intensityMmPerHour === p.mm
                    ? "bg-cyan-950/80 text-cyan-300 border-cyan-700"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                }`}
              >
                {p.label} ({p.mm}mm)
              </button>
            ))}
          </div>
        </div>

        {/* Rainfall Duration */}
        <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 space-y-2.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              Rainfall Duration
            </label>
            <div className="flex items-center gap-1 font-mono text-cyan-300 font-bold text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              <input
                type="number"
                min="5"
                max="360"
                value={config.rainfall.durationMinutes}
                onChange={(e) =>
                  updateRainfall("durationMinutes", Math.max(5, parseInt(e.target.value) || 5))
                }
                className="w-12 bg-transparent text-right focus:outline-none"
              />
              <span className="text-slate-400 font-normal">min</span>
            </div>
          </div>

          <input
            type="range"
            min="10"
            max="180"
            step="5"
            value={config.rainfall.durationMinutes}
            onChange={(e) => updateRainfall("durationMinutes", parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>10 min</span>
            <span>60 min</span>
            <span>120 min</span>
            <span>180 min</span>
          </div>
        </div>

        {/* Initial Water Depth */}
        <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 space-y-2.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-cyan-400" />
              Initial Water Depth
            </label>
            <div className="flex items-center gap-1 font-mono text-cyan-300 font-bold text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              <input
                type="number"
                min="0"
                max="2.0"
                step="0.01"
                value={config.initialWaterDepthMeters}
                onChange={(e) =>
                  onChangeConfig({
                    ...config,
                    initialWaterDepthMeters: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                className="w-12 bg-transparent text-right focus:outline-none"
              />
              <span className="text-slate-400 font-normal">m</span>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="1.0"
            step="0.02"
            value={config.initialWaterDepthMeters}
            onChange={(e) =>
              onChangeConfig({
                ...config,
                initialWaterDepthMeters: parseFloat(e.target.value),
              })
            }
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          <div className="flex justify-between text-[10px] text-slate-400">
            <span>0.00m (Dry ground)</span>
            <span>0.20m (Baseflow)</span>
            <span>1.00m (Pre-inundated)</span>
          </div>
        </div>

        {/* Surface Roughness (Manning's n) */}
        <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 space-y-2.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-cyan-400" />
                Surface Roughness (Manning&apos;s n)
              </label>
              <button
                type="button"
                onClick={() => setShowRoughnessGuide(!showRoughnessGuide)}
                className="text-slate-500 hover:text-slate-300"
                title="View Manning's n guidance"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1 font-mono text-cyan-300 font-bold text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              <span>{config.surfaceRoughnessManning.toFixed(3)}</span>
              <span className="text-slate-400 font-normal text-[10px]">s·m⁻⅓</span>
            </div>
          </div>

          <input
            type="range"
            min="0.010"
            max="0.080"
            step="0.005"
            value={config.surfaceRoughnessManning}
            onChange={(e) =>
              onChangeConfig({
                ...config,
                surfaceRoughnessManning: parseFloat(e.target.value),
              })
            }
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          <div className="flex flex-wrap gap-1 pt-1">
            {roughnessPresets.map((rp) => (
              <button
                key={rp.label}
                type="button"
                onClick={() =>
                  onChangeConfig({
                    ...config,
                    surfaceRoughnessManning: rp.n,
                  })
                }
                className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                  Math.abs(config.surfaceRoughnessManning - rp.n) < 0.001
                    ? "bg-cyan-950/80 text-cyan-300 border-cyan-700"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                }`}
                title={rp.desc}
              >
                {rp.label} ({rp.n})
              </button>
            ))}
          </div>
        </div>
      </div>

      {showRoughnessGuide && (
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-slate-300 space-y-1.5 animate-fadeIn">
          <div className="font-semibold text-cyan-400 text-xs">Manning&apos;s Roughness Coefficient Reference:</div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div>• <strong className="text-slate-200">0.013</strong>: Smooth finished concrete / culvert flumes</div>
            <div>• <strong className="text-slate-200">0.020</strong>: Smooth asphalt streets / urban paved corridors</div>
            <div>• <strong className="text-slate-200">0.035</strong>: Natural short grass pasture / gravel beds</div>
            <div>• <strong className="text-slate-200">0.060</strong>: Dense willow brush / thick forested floodplain</div>
          </div>
        </div>
      )}

      {/* Boundary Conditions */}
      <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-cyan-400" />
            Grid Boundary Conditions (Per Edge)
          </label>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>Set All:</span>
            {(["closed", "open", "weir", "inflow"] as BoundaryConditionType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => applyUniformBoundary(type)}
                className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 capitalize text-[10px]"
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {(["north", "south", "east", "west"] as const).map((side) => (
            <div key={side} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {side} Edge
              </span>
              <select
                value={config.boundaryConditions[side]}
                onChange={(e) => updateBoundary(side, e.target.value as BoundaryConditionType)}
                className="w-full bg-slate-950 text-slate-200 border border-slate-700/80 rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-500 capitalize"
              >
                <option value="closed">Closed (Solid Wall)</option>
                <option value="open">Open (Free Outflow)</option>
                <option value="weir">Weir Spillway (0.25m)</option>
                <option value="inflow">Inflow Boundary</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Simulation Duration & Time-Step Configuration */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span>Time-Step (dt):</span>
            <select
              value={config.timeStepSeconds}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  timeStepSeconds: parseInt(e.target.value),
                })
              }
              className="bg-slate-950 text-cyan-300 border border-slate-800 rounded px-2 py-0.5 text-xs font-mono"
            >
              <option value="15">15 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">60 seconds</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span>Total Duration:</span>
            <select
              value={config.totalDurationMinutes}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  totalDurationMinutes: parseInt(e.target.value),
                })
              }
              className="bg-slate-950 text-cyan-300 border border-slate-800 rounded px-2 py-0.5 text-xs font-mono"
            >
              <option value="60">60 minutes (1 hr)</option>
              <option value="90">90 minutes (1.5 hrs)</option>
              <option value="120">120 minutes (2 hrs)</option>
              <option value="180">180 minutes (3 hrs)</option>
            </select>
          </div>
        </div>

        <div className="text-slate-500 text-[11px]">
          Total Steps: {Math.floor((config.totalDurationMinutes * 60) / (config.timeStepSeconds || 30))} frames
        </div>
      </div>

      {/* Action Buttons: Run, Pause/Resume, Reset */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onResetSimulation}
          disabled={isLoading || !hasFrames}
          className={`flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-3 py-2 rounded-xl transition-colors border border-slate-800 hover:bg-slate-800 ${
            !hasFrames ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Simulation</span>
        </button>

        <button
          type="button"
          onClick={onStartSimulation}
          disabled={isLoading}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-cyan-950/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Launch Simulation</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
