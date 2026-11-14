'use client';

import React, { useState } from 'react';
import { ModelComparisonRecord, AIModelId } from '../types/forecast';
import { MetricTooltip } from './metrics-tooltip';
import { MockDataBadge, MockDataBanner } from './mock-badge';
import { BarChart3, TrendingUp, Check, ShieldAlert, Cpu, Activity, Clock, Zap } from 'lucide-react';

interface ModelComparisonViewProps {
  comparisons: ModelComparisonRecord[];
  isMock: boolean;
  selectedModelId: AIModelId;
  onSelectModel: (modelId: AIModelId) => void;
}

export const ModelComparisonView: React.FC<ModelComparisonViewProps> = ({
  comparisons,
  isMock,
  selectedModelId,
  onSelectModel
}) => {
  const [activeMetricTab, setActiveMetricTab] = useState<'mae' | 'rmse' | 'massError' | 'accuracy'>('mae');

  if (!comparisons || comparisons.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Transparency Banner */}
      <MockDataBanner isMock={isMock} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-base font-mono font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            AI Model Benchmark & Physical Conservation Evaluation
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Comparative assessment of empirical deep learning baseline vs spectral operator and physics-informed neural operators.
          </p>
        </div>
        <MockDataBadge isMock={isMock} size="md" />
      </div>

      {/* Comparison Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                <th className="p-3.5 font-semibold">Model Architecture</th>
                <th className="p-3.5 font-semibold">
                  <MetricTooltip metric="mae" inline>
                    <span>MAE (m)</span>
                  </MetricTooltip>
                </th>
                <th className="p-3.5 font-semibold">
                  <MetricTooltip metric="rmse" inline>
                    <span>RMSE (m)</span>
                  </MetricTooltip>
                </th>
                <th className="p-3.5 font-semibold">
                  <MetricTooltip metric="csi" inline>
                    <span>CSI Threat</span>
                  </MetricTooltip>
                </th>
                <th className="p-3.5 font-semibold">
                  <MetricTooltip metric="massConservation" inline>
                    <span>Mass Error</span>
                  </MetricTooltip>
                </th>
                <th className="p-3.5 font-semibold">
                  <MetricTooltip metric="inferenceDuration" inline>
                    <span>Latency</span>
                  </MetricTooltip>
                </th>
                <th className="p-3.5 font-semibold">Speedup</th>
                <th className="p-3.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {comparisons.map((c) => {
                const isSelected = c.modelId === selectedModelId;
                const m = c.metrics;

                return (
                  <tr
                    key={c.modelId}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-cyan-950/20 border-l-2 border-l-cyan-400'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="p-3.5">
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        {c.shortName}
                        {isSelected && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-normal">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 capitalize">{c.category}</div>
                    </td>

                    {/* MAE */}
                    <td className="p-3.5">
                      <span className={`font-bold ${c.modelId === 'pino-swe' ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {m.mae.toFixed(4)} m
                      </span>
                    </td>

                    {/* RMSE */}
                    <td className="p-3.5">
                      <span className={`font-bold ${c.modelId === 'pino-swe' ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {m.rmse.toFixed(4)} m
                      </span>
                    </td>

                    {/* CSI */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{(m.csi * 100).toFixed(1)}%</span>
                        <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className={`h-full ${c.modelId === 'pino-swe' ? 'bg-emerald-400' : c.modelId === 'fno-2d' ? 'bg-cyan-400' : 'bg-amber-400'}`}
                            style={{ width: `${m.csi * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Mass Conservation */}
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          m.massConservationErrorPct < 1.0
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : m.massConservationErrorPct < 3.0
                            ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {m.massConservationErrorPct.toFixed(2)}%
                      </span>
                    </td>

                    {/* Inference Duration */}
                    <td className="p-3.5 text-slate-200 font-semibold">
                      {m.inferenceDurationMs} ms
                    </td>

                    {/* Speedup */}
                    <td className="p-3.5 text-cyan-300">
                      {m.speedupFactor}×
                    </td>

                    {/* Action */}
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectModel(c.modelId)}
                        className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'border border-slate-700 bg-slate-950/60 text-slate-400 hover:text-slate-100 hover:border-slate-600'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Use Model'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Step Rollout Error Accumulation Chart */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
                Multi-Step Autoregressive Rollout Error Accumulation Curve
              </h4>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualizes how forecast error propagates over a 24-hour horizon as autoregressive predictions compound.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setActiveMetricTab('mae')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                activeMetricTab === 'mae' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
              }`}
            >
              MAE (m)
            </button>
            <button
              type="button"
              onClick={() => setActiveMetricTab('rmse')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                activeMetricTab === 'rmse' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
              }`}
            >
              RMSE (m)
            </button>
            <button
              type="button"
              onClick={() => setActiveMetricTab('massError')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                activeMetricTab === 'massError' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
              }`}
            >
              Mass Drift %
            </button>
          </div>
        </div>

        {/* SVG Multi-Line Chart */}
        <div className="h-64 w-full bg-slate-950/80 rounded-lg border border-slate-800/80 p-4 relative flex flex-col justify-between">
          {/* Legend */}
          <div className="flex items-center justify-end gap-4 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-3 h-0.5 bg-amber-400 inline-block" />
              <span>ConvLSTM Baseline</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
              <span>FNO-2D (Spectral)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
              <span>PINO-SWE (Physics-Informed)</span>
            </div>
          </div>

          {/* SVG Canvas */}
          <div className="relative flex-1 w-full my-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
              {/* Horizontal Grid lines */}
              {[0, 45, 90, 135, 180].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="500"
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Render lines for each model */}
              {comparisons.map((c) => {
                const errors = c.rolloutErrors;
                if (!errors || errors.length === 0) return null;

                // Max values for normalization
                const maxY =
                  activeMetricTab === 'mae' ? 0.35 : activeMetricTab === 'rmse' ? 0.45 : 15.0;

                const points = errors.map((pt, i) => {
                  const x = (i / (errors.length - 1)) * 500;
                  const val =
                    activeMetricTab === 'mae'
                      ? pt.mae
                      : activeMetricTab === 'rmse'
                      ? pt.rmse
                      : pt.massErrorPct;
                  const y = 180 - Math.min(180, (val / maxY) * 180);
                  return `${x},${y}`;
                });

                const color =
                  c.modelId === 'cnn-convlstm'
                    ? '#fbbf24'
                    : c.modelId === 'fno-2d'
                    ? '#38bdf8'
                    : '#34d399';

                return (
                  <g key={c.modelId}>
                    <polyline
                      fill="none"
                      stroke={color}
                      strokeWidth={c.modelId === selectedModelId ? '3' : '2'}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={points.join(' ')}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* X Axis Time Labels */}
          <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800">
            <span>T+0h</span>
            <span>T+6h</span>
            <span>T+12h</span>
            <span>T+18h</span>
            <span>T+24h (Rollout Horizon)</span>
          </div>
        </div>

        {/* Scientific Interpretation Callout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-1">
            <div className="text-amber-400 font-bold">ConvLSTM (Baseline)</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Exhibits steep exponential divergence beyond 6 hours due to autoregressive error feedback loop and zero physical conservation constraints.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-1">
            <div className="text-cyan-400 font-bold">FNO-2D (Spectral Operator)</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Global spectral convolution prevents catastrophic explosion, maintaining stable bounded errors across continuous spatial domains.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-1">
            <div className="text-emerald-400 font-bold">PINO-SWE (Physics-Informed)</div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Shallow Water continuity and momentum residual losses penalize unphysical water creation, keeping error accumulation under 0.05m across 24h.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
