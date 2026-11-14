'use client';

import React from 'react';
import { RefreshCw, Play, Waves, Cpu, ShieldCheck } from 'lucide-react';

interface LoadingStateProps {
  currentStep?: string;
  modelName?: string;
}

export const ForecastingLoadingState: React.FC<LoadingStateProps> = ({
  currentStep = 'Evaluating Neural Operator Tensor Rollout...',
  modelName = 'PINO-SWE'
}) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-8 flex flex-col items-center justify-center text-center space-y-4">
      {/* Animated Radar Radar Scanner Ring */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping" />
        <div className="absolute inset-2 rounded-full border border-cyan-500/40 animate-pulse" />
        <div className="w-12 h-12 rounded-full bg-cyan-950/80 border border-cyan-500/80 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-mono font-bold text-slate-100">
          Inference in Progress: {modelName}
        </h4>
        <p className="text-xs font-mono text-cyan-400 animate-pulse">
          {currentStep}
        </p>
      </div>

      {/* Progress Checklist */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-slate-400 w-full max-w-sm text-left space-y-1.5">
        <div className="flex items-center gap-2 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>1. Inflow Hydrograph Validated</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>2. Terrain Bathymetry Tensor Loaded</span>
        </div>
        <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>3. Autoregressive Rollout & Conservation Evaluation...</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <span className="w-3.5 h-3.5 rounded-full border border-slate-700 inline-block" />
          <span>4. Rendering Spatial Flood Depths & Velocity Fields</span>
        </div>
      </div>
    </div>
  );
};

export const ForecastingEmptyState: React.FC<{ onInitiateClick: () => void }> = ({ onInitiateClick }) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg">
        <Waves className="w-8 h-8" />
      </div>

      <div className="space-y-1 max-w-md">
        <h3 className="text-base font-mono font-bold text-slate-100">
          No Forecast Simulation Loaded
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Select an AI model architecture, catchment scenario, and prediction horizon above, then initiate the inference pipeline.
        </p>
      </div>

      <button
        type="button"
        onClick={onInitiateClick}
        className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-950/40 cursor-pointer"
      >
        <Play className="w-4 h-4 fill-white" />
        <span>Initiate Sample Forecast</span>
      </button>
    </div>
  );
};
