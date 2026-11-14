'use client';

import React from 'react';
import { PredictionHorizonHours } from '../types/forecast';
import { Clock, TrendingUp } from 'lucide-react';

interface HorizonSelectorProps {
  selectedHorizon: PredictionHorizonHours;
  onSelectHorizon: (horizon: PredictionHorizonHours) => void;
  disabled?: boolean;
}

const HORIZONS: Array<{
  hours: PredictionHorizonHours;
  label: string;
  stepMinutes: number;
  frames: number;
  uncertaintyBand: 'Minimal (<1%)' | 'Low (~2%)' | 'Moderate (~4%)' | 'Elevated (~8%)' | 'High (~15%)';
  uncertaintyColor: string;
}> = [
  { hours: 1, label: '+1 Hour', stepMinutes: 15, frames: 4, uncertaintyBand: 'Minimal (<1%)', uncertaintyColor: 'text-emerald-400' },
  { hours: 3, label: '+3 Hours', stepMinutes: 15, frames: 12, uncertaintyBand: 'Minimal (<1%)', uncertaintyColor: 'text-emerald-400' },
  { hours: 6, label: '+6 Hours', stepMinutes: 15, frames: 24, uncertaintyBand: 'Low (~2%)', uncertaintyColor: 'text-cyan-400' },
  { hours: 12, label: '+12 Hours', stepMinutes: 30, frames: 24, uncertaintyBand: 'Moderate (~4%)', uncertaintyColor: 'text-amber-400' },
  { hours: 24, label: '+24 Hours', stepMinutes: 30, frames: 48, uncertaintyBand: 'Elevated (~8%)', uncertaintyColor: 'text-orange-400' },
  { hours: 48, label: '+48 Hours', stepMinutes: 60, frames: 48, uncertaintyBand: 'High (~15%)', uncertaintyColor: 'text-rose-400' }
];

export const HorizonSelector: React.FC<HorizonSelectorProps> = ({
  selectedHorizon,
  onSelectHorizon,
  disabled = false
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          Prediction Horizon
        </label>
        <span className="text-[11px] font-mono text-slate-400">
          Autoregressive Rollout Window
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {HORIZONS.map((h) => {
          const isSelected = h.hours === selectedHorizon;

          return (
            <button
              key={h.hours}
              type="button"
              disabled={disabled}
              onClick={() => onSelectHorizon(h.hours)}
              className={`p-2.5 rounded-lg border text-left transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'border-cyan-500 bg-cyan-950/40 text-slate-100 ring-1 ring-cyan-500/50'
                  : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900/40'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-sm font-bold text-slate-100">{h.label}</span>
                <span className="text-[10px] font-mono text-slate-400">{h.frames} frames</span>
              </div>

              <div className="text-[10px] text-slate-400 font-mono mb-1">
                Δt = {h.stepMinutes} min
              </div>

              <div className="flex items-center gap-1 text-[10px] font-mono">
                <TrendingUp className="w-2.5 h-2.5 text-slate-500" />
                <span className={h.uncertaintyColor}>{h.uncertaintyBand}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

