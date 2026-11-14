'use client';

import React from 'react';
import { ForecastMetadata, ForecastMetrics, ForecastSummary } from '../types/forecast';
import { MockDataBadge } from './mock-badge';
import { MetricTooltip } from './metrics-tooltip';
import { HardDrive, Server, Zap, ShieldAlert, Cpu, Hash, Clock, CheckCircle2 } from 'lucide-react';

interface ForecastMetadataCardProps {
  metadata: ForecastMetadata | null;
  metrics: ForecastMetrics | null;
  summary: ForecastSummary | null;
}

export const ForecastMetadataCard: React.FC<ForecastMetadataCardProps> = ({
  metadata,
  metrics,
  summary
}) => {
  if (!metadata || !metrics) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
            Inference Metadata & Execution Telemetry
          </h4>
        </div>
        <MockDataBadge isMock={metadata.isMock} dataSource={metadata.dataSource} size="sm" />
      </div>

      {/* Primary Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
          <div className="text-slate-400 text-[11px]">
            <MetricTooltip metric="mae" inline>
              <span>MAE (m)</span>
            </MetricTooltip>
          </div>
          <div className="text-base font-bold text-cyan-300">
            {metrics.mae.toFixed(4)} <span className="text-[10px] text-slate-400">m</span>
          </div>
          <div className="text-[10px] text-slate-500">Mean depth error</div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
          <div className="text-slate-400 text-[11px]">
            <MetricTooltip metric="rmse" inline>
              <span>RMSE (m)</span>
            </MetricTooltip>
          </div>
          <div className="text-base font-bold text-blue-300">
            {metrics.rmse.toFixed(4)} <span className="text-[10px] text-slate-400">m</span>
          </div>
          <div className="text-[10px] text-slate-500">Peak error penalty</div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
          <div className="text-slate-400 text-[11px]">
            <MetricTooltip metric="massConservation" inline>
              <span>Mass Error (ΔM/M₀)</span>
            </MetricTooltip>
          </div>
          <div className="text-base font-bold text-emerald-400">
            {metrics.massConservationErrorPct.toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-500">Continuity residual</div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
          <div className="text-slate-400 text-[11px]">
            <MetricTooltip metric="inferenceDuration" inline>
              <span>GPU Latency</span>
            </MetricTooltip>
          </div>
          <div className="text-base font-bold text-amber-300">
            {metrics.inferenceDurationMs} <span className="text-[10px] text-slate-400">ms</span>
          </div>
          <div className="text-[10px] text-slate-500">{metrics.speedupFactor}x vs 2D PDE</div>
        </div>
      </div>

      {/* Accuracy & Threat Scores */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
        <div className="bg-slate-950/50 border border-slate-800/60 rounded-lg p-2 flex items-center justify-between">
          <MetricTooltip metric="csi" inline>
            <span className="text-slate-400">CSI Threat Score:</span>
          </MetricTooltip>
          <span className="font-bold text-slate-200">{(metrics.csi * 100).toFixed(1)}%</span>
        </div>

        <div className="bg-slate-950/50 border border-slate-800/60 rounded-lg p-2 flex items-center justify-between">
          <MetricTooltip metric="iou" inline>
            <span className="text-slate-400">Flooded IoU:</span>
          </MetricTooltip>
          <span className="font-bold text-slate-200">{(metrics.iou * 100).toFixed(1)}%</span>
        </div>

        <div className="bg-slate-950/50 border border-slate-800/60 rounded-lg p-2 flex items-center justify-between col-span-2 sm:col-span-1">
          <MetricTooltip metric="rolloutDrift" inline>
            <span className="text-slate-400">Rollout Drift:</span>
          </MetricTooltip>
          <span className="font-bold text-cyan-400">{metrics.rolloutDriftSlope.toFixed(3)}/h</span>
        </div>
      </div>

      {/* Hardware & Checkpoint Specs */}
      <div className="bg-slate-950/80 rounded-lg border border-slate-800/80 p-3 text-xs font-mono space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400 pb-2 border-b border-slate-800/60">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hardware:</span>
            <span className="text-slate-200">{metadata.hardwareBackend}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Precision:</span>
            <span className="text-slate-200">{metadata.precision}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <Hash className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="text-slate-500">Inference ID:</span>
            <span className="text-slate-300 font-mono truncate">{metadata.id}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <HardDrive className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="text-slate-500">Checkpoint:</span>
            <span className="text-slate-300 font-mono truncate">{metadata.checkpointHash}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="text-slate-500">Resolution:</span>
            <span className="text-slate-300">
              {metadata.gridResolution.width}×{metadata.gridResolution.height} (Δx={metadata.gridResolution.dxMeters}m)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="text-slate-500">Conservation:</span>
            <span className={metadata.massConservationEnforced ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
              {metadata.massConservationEnforced ? 'Enforced (PINO)' : 'Unconstrained'}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Highlight */}
      {summary && (
        <div className="flex flex-wrap items-center justify-between text-xs font-mono bg-cyan-950/20 border border-cyan-800/40 rounded-lg px-3 py-2 text-cyan-200 gap-2">
          <span>Peak Surge Depth: <strong>{summary.peakDepthM.toFixed(2)} m</strong></span>
          <span>Max Inundated Basin: <strong>{summary.peakInundationKm2.toFixed(1)} km²</strong></span>
          <span>Assets at Risk: <strong>{summary.criticalInfraAtRiskCount} monitored sites</strong></span>
        </div>
      )}
    </div>
  );
};
