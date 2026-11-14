'use client';

import React from 'react';
import { ForecastScenario } from '../types/forecast';
import { FORECAST_SCENARIOS } from '../utils/physics';
import { MapPin, Droplets, Mountain, Wind, ShieldAlert, Layers } from 'lucide-react';

interface ScenarioSummaryProps {
  selectedScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  disabled?: boolean;
}

export const ScenarioSummary: React.FC<ScenarioSummaryProps> = ({
  selectedScenarioId,
  onSelectScenario,
  disabled = false
}) => {
  const currentScenario =
    FORECAST_SCENARIOS.find((s) => s.id === selectedScenarioId) || FORECAST_SCENARIOS[0];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
            Input Hydrologic Scenario
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="scenario-select" className="text-xs text-slate-400 font-mono">
            Catchment:
          </label>
          <select
            id="scenario-select"
            disabled={disabled}
            value={selectedScenarioId}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-none cursor-pointer"
          >
            {FORECAST_SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Basin & Location */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <MapPin className="w-3 h-3 text-cyan-400" />
            <span>Catchment Area</span>
          </div>
          <div className="font-mono text-sm font-semibold text-slate-100">
            {currentScenario.catchmentAreaKm2.toLocaleString()} <span className="text-[10px] text-slate-400">km²</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate" title={currentScenario.basin}>
            {currentScenario.basin.split(',')[0]}
          </div>
        </div>

        {/* Peak Inflow Discharge */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Droplets className="w-3 h-3 text-blue-400" />
            <span>Peak Inflow (Q)</span>
          </div>
          <div className="font-mono text-sm font-semibold text-cyan-300">
            {currentScenario.peakDischargeM3s.toLocaleString()} <span className="text-[10px] text-slate-400">m³/s</span>
          </div>
          <div className="text-[10px] text-slate-400">Hydrograph Inflow</div>
        </div>

        {/* Soil Saturation */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Droplets className="w-3 h-3 text-emerald-400" />
            <span>Soil Saturation (S₀)</span>
          </div>
          <div className="font-mono text-sm font-semibold text-emerald-400">
            {currentScenario.soilSaturationPct}%
          </div>
          <div className="text-[10px] text-slate-400">Initial Antecedent</div>
        </div>

        {/* Manning's Roughness n */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Wind className="w-3 h-3 text-amber-400" />
            <span>Manning Roughness</span>
          </div>
          <div className="font-mono text-sm font-semibold text-amber-300">
            {currentScenario.manningRoughness} <span className="text-[10px] text-slate-400">s/m⅓</span>
          </div>
          <div className="text-[10px] text-slate-400">Bed Friction (n)</div>
        </div>

        {/* Elevation DEM Range */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Mountain className="w-3 h-3 text-purple-400" />
            <span>DEM Elevation</span>
          </div>
          <div className="font-mono text-sm font-semibold text-purple-300">
            {currentScenario.elevationRange.min} – {currentScenario.elevationRange.max} <span className="text-[10px] text-slate-400">m</span>
          </div>
          <div className="text-[10px] text-slate-400">Terrain Bathymetry</div>
        </div>

        {/* Inundation Risk Level */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>Hazard Tier</span>
          </div>
          <div className="font-mono text-sm font-semibold text-rose-400">
            {currentScenario.inundationRiskLevel}
          </div>
          <div className="text-[10px] text-slate-400">Vulnerability Index</div>
        </div>
      </div>

      <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg px-3 py-2 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono">
        <div>
          <span className="text-slate-500">Boundary Conditions: </span>
          <span className="text-slate-300">{currentScenario.boundaryConditions}</span>
        </div>
        <div>
          <span className="text-slate-500">Precipitation: </span>
          <span className="text-cyan-400">{currentScenario.rainfallIntensityMmH} mm/hr cloudburst</span>
        </div>
      </div>
    </div>
  );
};
