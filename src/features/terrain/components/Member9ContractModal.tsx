'use client';

import React, { useState } from 'react';
import { ProcessedDEMData } from '../types/terrain';
import { Member9IntegrationService } from '../services/member9-contract';
import {
  Member9DEMPayload,
  Member9SimulationResponse
} from '../types/dem-contract';
import {
  Share2,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Send,
  Loader2,
  Code
} from 'lucide-react';

interface Member9ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  dem: ProcessedDEMData;
}

export const Member9ContractModal: React.FC<Member9ContractModalProps> = ({
  isOpen,
  onClose,
  dem
}) => {
  const [copied, setCopied] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<Member9SimulationResponse | null>(null);

  if (!isOpen) return null;

  const payload: Member9DEMPayload = Member9IntegrationService.createSimulationPayload(dem);
  const validation = Member9IntegrationService.validatePayload(payload);

  // Compact representation for preview so we don't render millions of numbers
  const previewPayload = {
    ...payload,
    layers: {
      elevationMatrix: `[Float32Array(${payload.layers.elevationMatrix.length}) items: ${Array.from(
        (payload.layers.elevationMatrix as number[]).slice(0, 5)
      ).join(', ')} ... ]`,
      slopeMatrix: `[Float32Array(${payload.layers.slopeMatrix.length}) items ...]`,
      aspectMatrix: `[Float32Array(${payload.layers.aspectMatrix.length}) items ...]`,
      flowDirectionMatrix: `[Uint8Array(${payload.layers.flowDirectionMatrix.length}) items ...]`,
      flowAccumulationMatrix: `[Float32Array(${payload.layers.flowAccumulationMatrix.length}) items ...]`
    }
  };

  const jsonString = JSON.stringify(previewPayload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const fullJson = JSON.stringify(payload, null, 2);
    const blob = new Blob([fullJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crestix-dem-m9-${dem.metadata.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDispatch = async () => {
    setDispatching(true);
    setDispatchResult(null);
    try {
      const res = await Member9IntegrationService.dispatchToSimulationEngine(payload);
      setDispatchResult(res);
    } catch {
      // Mock error fallback
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Member 9 Hydro-Simulation Data Contract
              </h3>
              <p className="text-[11px] text-slate-400">
                Interface specification & processed raster payload for flood engine handoff
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Validation Status Bar */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {validation.valid ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Contract Schema Compliant (v{payload.contractVersion})</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                <AlertCircle className="w-4 h-4" />
                <span>Schema Validation Warning: {validation.errors.join(', ')}</span>
              </span>
            )}
          </div>

          <span className="font-mono text-[11px] text-slate-400">
            Grid: {payload.spatialReference.dimensions.cols}×{payload.spatialReference.dimensions.rows} ({payload.spatialReference.dimensions.cellSizeMeters}m res)
          </span>
        </div>

        {/* Body / JSON Preview */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-medium text-slate-300">
              <Code className="w-4 h-4 text-cyan-400" />
              <span>Contract Payload Preview (JSON Schema)</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied Full Payload!' : 'Copy Full JSON'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto max-h-72 leading-relaxed">
            {jsonString}
          </pre>

          {/* Dispatch simulation response */}
          {dispatchResult && (
            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800 text-xs space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Simulation Engine Dispatch Status: {dispatchResult.status.toUpperCase()}</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">{dispatchResult.message}</p>
              <div className="font-mono text-[10px] text-slate-400">
                Job ID: {dispatchResult.simulationId} • Est. Runtime: {dispatchResult.estimatedRuntimeMs}ms
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download Contract JSON</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
            >
              Close
            </button>

            <button
              onClick={handleDispatch}
              disabled={dispatching}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-cyan-950 transition-all"
            >
              {dispatching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transmitting to Member 9...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send DEM to Simulation Engine</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
