'use client';

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export type MetricKey = 'mae' | 'rmse' | 'csi' | 'iou' | 'massConservation' | 'inferenceDuration' | 'rolloutDrift';

export interface MetricDefinition {
  title: string;
  unit: string;
  formula: string;
  explanation: string;
  scientificContext: string;
}

export const METRIC_DEFINITIONS: Record<MetricKey, MetricDefinition> = {
  mae: {
    title: 'Mean Absolute Error (MAE)',
    unit: 'meters (m)',
    formula: 'MAE = (1/N) Σ |h_pred - h_true|',
    explanation: 'Average linear difference between predicted water depth and high-fidelity hydrodynamic simulation.',
    scientificContext: 'Measures spatial flood depth bias. In operational flooding, MAE < 0.05m indicates high fidelity for structural damage modeling.'
  },
  rmse: {
    title: 'Root Mean Squared Error (RMSE)',
    unit: 'meters (m)',
    formula: 'RMSE = √[ (1/N) Σ (h_pred - h_true)² ]',
    explanation: 'Square root of mean squared depth errors, penalizing large peak flood discrepancies heavily.',
    scientificContext: 'Crucial for assessing extreme flood peaks where large outliers cause catastrophic levee overtopping.'
  },
  csi: {
    title: 'Critical Success Index (CSI / Threat Score)',
    unit: '0.00 – 1.00',
    formula: 'CSI = Hits / (Hits + Misses + False Alarms)',
    explanation: 'Ratio of correctly predicted inundated grid cells over all forecasted or observed inundations (threshold h ≥ 0.15m).',
    scientificContext: 'Gold standard in hydrologic flood forecasting because it penalizes both false flood alarms and unpredicted inundations.'
  },
  iou: {
    title: 'Intersection over Union (IoU)',
    unit: '0.00 – 1.00',
    formula: 'IoU = Area(Pred ∩ True) / Area(Pred ∪ True)',
    explanation: 'Geometric overlap of the predicted flood extent polygon against the ground-truth flood inundation mask.',
    scientificContext: 'Evaluates spatial boundary alignment of the flood wave front across regional topographic terrain.'
  },
  massConservation: {
    title: 'Mass Conservation Error (ΔM / M₀)',
    unit: 'percentage (%)',
    formula: 'ΔM/M₀ = | ∫ h_pred dA - (M_inflow - M_outflow) | / M_initial × 100%',
    explanation: 'Percentage deviation in total conserved water mass across the basin throughout the rollout.',
    scientificContext: 'Fundamental continuity law (∂h/∂t + ∇·(hu) = 0). Pure ML models often create or destroy artificial water; PINO enforces soft/hard conservation.'
  },
  inferenceDuration: {
    title: 'Inference Duration (Latency)',
    unit: 'milliseconds (ms)',
    formula: 't_end - t_start (GPU Kernel Time)',
    explanation: 'Execution time for forward neural operator pass on NVIDIA A100 GPU tensor cores.',
    scientificContext: 'Compared against 2D Saint-Venant numerical PDE solvers which often take 30–60 minutes per catchment simulation.'
  },
  rolloutDrift: {
    title: 'Multi-Step Rollout Error Drift',
    unit: '% error increase / hour',
    formula: 'd(MAE)/dt over autoregressive horizon',
    explanation: 'Rate at which forecast error compounds as predictions are fed autoregressively back into the model for subsequent timesteps.',
    scientificContext: 'Without physics constraints, ConvLSTM models exhibit exponential drift. PINO constrains drift by penalizing SWE residuals at each step.'
  }
};

interface MetricTooltipProps {
  metric: MetricKey;
  children?: React.ReactNode;
  inline?: boolean;
}

export const MetricTooltip: React.FC<MetricTooltipProps> = ({ metric, children, inline = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const def = METRIC_DEFINITIONS[metric];

  if (!def) return <>{children}</>;

  return (
    <div className={`relative ${inline ? 'inline-flex items-center gap-1' : 'flex items-center gap-1'}`}>
      {children}
      <button
        type="button"
        className="text-slate-500 hover:text-cyan-400 focus:outline-none transition-colors p-0.5 rounded cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        aria-label={`Explain ${def.title}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 bottom-full mb-2 w-72 rounded-lg border border-slate-700 bg-slate-900/95 p-3 text-xs shadow-2xl backdrop-blur-md pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="font-semibold text-cyan-300 mb-1">{def.title}</div>
          <div className="font-mono text-[10px] text-slate-400 mb-2">Unit: {def.unit}</div>
          <div className="bg-slate-950/80 border border-slate-800 rounded p-1.5 font-mono text-[11px] text-emerald-400 mb-2">
            {def.formula}
          </div>
          <p className="text-slate-300 mb-1.5 leading-snug">{def.explanation}</p>
          <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5 italic">
            {def.scientificContext}
          </div>
        </div>
      )}
    </div>
  );
};

