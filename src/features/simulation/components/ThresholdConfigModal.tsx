"use client";

import React, { useState } from "react";
import { DepthThresholdConfig, DEFAULT_DEPTH_THRESHOLDS } from "../types/contract";
import { X, RotateCcw, Check, ShieldAlert } from "lucide-react";

interface ThresholdConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThresholds: DepthThresholdConfig;
  onSave: (newThresholds: DepthThresholdConfig) => void;
}

export const ThresholdConfigModal: React.FC<ThresholdConfigModalProps> = ({
  isOpen,
  onClose,
  currentThresholds,
  onSave,
}) => {
  const [dryThreshold, setDryThreshold] = useState<number>(currentThresholds.dryThreshold);
  const [shallowThreshold, setShallowThreshold] = useState<number>(currentThresholds.shallowThreshold);
  const [moderateThreshold, setModerateThreshold] = useState<number>(currentThresholds.moderateThreshold);
  const [disclaimer, setDisclaimer] = useState<string>(currentThresholds.disclaimer);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    if (dryThreshold < 0) {
      setError("Dry threshold must be non-negative.");
      return;
    }
    if (shallowThreshold <= dryThreshold) {
      setError("Shallow threshold must be greater than dry threshold.");
      return;
    }
    if (moderateThreshold <= shallowThreshold) {
      setError("Moderate threshold must be greater than shallow threshold.");
      return;
    }

    setError(null);
    onSave({
      dryThreshold: parseFloat(dryThreshold.toFixed(3)),
      shallowThreshold: parseFloat(shallowThreshold.toFixed(3)),
      moderateThreshold: parseFloat(moderateThreshold.toFixed(3)),
      unit: "m",
      disclaimer,
    });
    onClose();
  };

  const handleReset = () => {
    setDryThreshold(DEFAULT_DEPTH_THRESHOLDS.dryThreshold);
    setShallowThreshold(DEFAULT_DEPTH_THRESHOLDS.shallowThreshold);
    setModerateThreshold(DEFAULT_DEPTH_THRESHOLDS.moderateThreshold);
    setDisclaimer(DEFAULT_DEPTH_THRESHOLDS.disclaimer);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-5 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Configure Depth Thresholds</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize visual hydraulic classification intervals for this simulation workspace.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Dry Threshold */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-300">Dry Ground Cutoff (m)</label>
              <span className="font-mono text-cyan-400 font-bold">{dryThreshold.toFixed(3)} m</span>
            </div>
            <input
              type="range"
              min="0.001"
              max="0.05"
              step="0.005"
              value={dryThreshold}
              onChange={(e) => setDryThreshold(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <p className="text-[11px] text-slate-400">
              Depths at or below this value are classified as dry terrain.
            </p>
          </div>

          {/* Shallow Threshold */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-300">Shallow Water Upper Bound (m)</label>
              <span className="font-mono text-sky-400 font-bold">{shallowThreshold.toFixed(2)} m</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.40"
              step="0.01"
              value={shallowThreshold}
              onChange={(e) => setShallowThreshold(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <p className="text-[11px] text-slate-400">
              Water between {dryThreshold.toFixed(2)}m and {shallowThreshold.toFixed(2)}m is classified as shallow water.
            </p>
          </div>

          {/* Moderate Threshold */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-300">Moderate Water Upper Bound (m)</label>
              <span className="font-mono text-blue-400 font-bold">{moderateThreshold.toFixed(2)} m</span>
            </div>
            <input
              type="range"
              min="0.25"
              max="1.50"
              step="0.05"
              value={moderateThreshold}
              onChange={(e) => setModerateThreshold(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-[11px] text-slate-400">
              Depths greater than {moderateThreshold.toFixed(2)}m will be rendered as deep water.
            </p>
          </div>

          {/* Disclaimer / Label Field */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Threshold Label & Scientific Disclaimer
            </label>
            <textarea
              rows={2}
              value={disclaimer}
              onChange={(e) => setDisclaimer(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-3 py-2 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Defaults
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-200 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 px-4 py-2 rounded-lg transition-colors shadow-md"
            >
              <Check className="w-3.5 h-3.5" />
              Apply Thresholds
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
