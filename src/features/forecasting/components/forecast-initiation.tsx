'use client';

import React, { useState } from 'react';
import { Play, Settings2, Sliders, CheckCircle, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { AIModelId } from '../types/forecast';

interface ForecastInitiationProps {
  onRunForecast: (params?: {
    physicsLossWeight?: number;
    enforceConservation?: boolean;
    spatialSuperResolution?: 1 | 2 | 4;
  }) => void;
  isLoading: boolean;
  loadingStep?: string;
  selectedModelId: AIModelId;
  inferenceDurationMs?: number;
  disabled?: boolean;
}

export const ForecastInitiation: React.FC<ForecastInitiationProps> = ({
  onRunForecast,
  isLoading,
  loadingStep,
  selectedModelId,
  inferenceDurationMs,
  disabled = false
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [physicsLossWeight, setPhysicsLossWeight] = useState(1.0);
  const [enforceConservation, setEnforceConservation] = useState(true);
  const [superResolution, setSuperResolution] = useState<1 | 2 | 4>(1);

  const handleInitiate = () => {
    onRunForecast({
      physicsLossWeight: selectedModelId === 'pino-swe' ? physicsLossWeight : undefined,
      enforceConservation: selectedModelId === 'pino-swe' ? enforceConservation : false,
      spatialSuperResolution: superResolution
    });
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLoading ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isLoading ? 'bg-cyan-500' : 'bg-emerald-500'}`} />
            </span>
            <span className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
              Inference Dispatch Controller
            </span>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {isLoading
              ? loadingStep || 'Computing spatiotemporal tensor rollout...'
              : inferenceDurationMs
              ? `Last forward pass latency: ${inferenceDurationMs}ms (GPU A100)`
              : 'Ready to evaluate neural operator forward pass'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-950/60 text-slate-300 hover:text-slate-100 hover:border-slate-600 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Parameters</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            disabled={disabled || isLoading}
            onClick={handleInitiate}
            className={`px-5 py-2.5 rounded-lg font-mono text-xs font-bold tracking-wide flex items-center gap-2 shadow-lg transition-all duration-200 cursor-pointer ${
              isLoading
                ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 cursor-wait'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-900/30 hover:shadow-cyan-600/30 ring-1 ring-cyan-400/30'
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Running Inference...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Initiate Forecast</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Hyperparameters Panel */}
      {showAdvanced && (
        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-150">
          {/* Physics Loss Weight (PINO) */}
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">Physics Loss Weight (λ_pde)</span>
              <span className="text-emerald-400 font-bold">{physicsLossWeight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={physicsLossWeight}
              disabled={selectedModelId !== 'pino-swe'}
              onChange={(e) => setPhysicsLossWeight(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer disabled:opacity-40"
            />
            <div className="text-[10px] text-slate-500">
              {selectedModelId === 'pino-swe'
                ? 'Weight of Shallow Water Equation residual penalty in loss'
                : 'Only applicable to PINO architecture'}
            </div>
          </div>

          {/* Hard Mass Continuity */}
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">Hard Mass Continuity</span>
              <span className={enforceConservation ? 'text-cyan-400' : 'text-slate-500'}>
                {enforceConservation ? 'Active' : 'Unconstrained'}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="mass-continuity-check"
                checked={enforceConservation}
                disabled={selectedModelId === 'cnn-convlstm'}
                onChange={(e) => setEnforceConservation(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer disabled:opacity-40"
              />
              <label htmlFor="mass-continuity-check" className="text-xs text-slate-400 cursor-pointer">
                Enforce zero artificial volume divergence
              </label>
            </div>
            <div className="text-[10px] text-slate-500">
              Projects flow state onto divergence-free subspace
            </div>
          </div>

          {/* Spatial Super-Resolution */}
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">Zero-Shot Grid Super-Resolution</span>
              <span className="text-purple-400 font-bold">{superResolution}x</span>
            </div>
            <div className="grid grid-cols-3 gap-1 pt-1 font-mono text-xs">
              {([1, 2, 4] as const).map((factor) => (
                <button
                  key={factor}
                  type="button"
                  disabled={selectedModelId === 'cnn-convlstm'}
                  onClick={() => setSuperResolution(factor)}
                  className={`py-1 rounded border text-center transition-colors cursor-pointer ${
                    superResolution === factor
                      ? 'border-purple-500 bg-purple-950/40 text-purple-200'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {factor === 1 ? '64×64' : factor === 2 ? '128×128' : '256×256'}
                </button>
              ))}
            </div>
            <div className="text-[10px] text-slate-500">
              Fourier Operator evaluates continuous spatial frequencies
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

