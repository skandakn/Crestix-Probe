"use client";

import React, { useMemo } from "react";
import { SelectedCellInfo } from "./FloodGridCanvas";
import { SimulationFrame, DepthThresholdConfig } from "../types/contract";
import { X, MapPin, TrendingUp, Info } from "lucide-react";

interface CellInspectorModalProps {
  selectedCell: SelectedCellInfo | null;
  onClose: () => void;
  frames: SimulationFrame[];
  thresholds: DepthThresholdConfig;
  timeStepSeconds: number;
}

export const CellInspectorModal: React.FC<CellInspectorModalProps> = ({
  selectedCell,
  onClose,
  frames,
  thresholds,
  timeStepSeconds,
}) => {
  // Extract hydrograph for this cell across all frames
  const hydrograph = useMemo(() => {
    if (!selectedCell || !frames || frames.length === 0) return [];
    const { r, c } = selectedCell;
    return frames.map((f, idx) => ({
      step: idx,
      timeSec: f.timeSeconds,
      depth: f.waterDepthGrid[r]?.[c] || 0,
    }));
  }, [selectedCell, frames]);

  // Compute peak depth for this cell
  const maxDepthInCell = useMemo(() => {
    let m = 0;
    hydrograph.forEach((pt) => {
      if (pt.depth > m) m = pt.depth;
    });
    return m;
  }, [hydrograph]);

  if (!selectedCell) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-5 space-y-4 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-yellow-400/20 text-yellow-300">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Cell Hydrograph Inspector: Row {selectedCell.r}, Col {selectedCell.c}
              </h3>
              <p className="text-[11px] text-slate-400">
                Time-series water level and stage tracking for point location
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Cell Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Ground Bed DEM</span>
            <span className="text-amber-300 font-bold text-sm">
              {selectedCell.elevation.toFixed(2)} m
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Current Water Depth</span>
            <span className="text-cyan-300 font-bold text-sm">
              {selectedCell.depth.toFixed(3)} m
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Water Surface Elev (WSE)</span>
            <span className="text-blue-300 font-bold text-sm">
              {selectedCell.waterSurfaceElevation.toFixed(2)} m
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Peak Depth Over Time</span>
            <span className="text-indigo-300 font-bold text-sm">
              {maxDepthInCell.toFixed(3)} m
            </span>
          </div>
        </div>

        {/* Mini SVG Hydrograph Chart */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Stage Hydrograph (Depth vs Time)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {hydrograph.length} time-steps
            </span>
          </div>

          {hydrograph.length > 1 ? (
            <div className="w-full h-32 relative flex items-end pt-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                {/* Horizontal reference threshold lines */}
                {maxDepthInCell > 0 && (
                  <>
                    {/* Shallow line */}
                    {thresholds.shallowThreshold <= maxDepthInCell * 1.2 && (
                      <line
                        x1="0"
                        y1={100 - (thresholds.shallowThreshold / Math.max(0.1, maxDepthInCell * 1.2)) * 100}
                        x2="400"
                        y2={100 - (thresholds.shallowThreshold / Math.max(0.1, maxDepthInCell * 1.2)) * 100}
                        stroke="#38bdf8"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                        opacity="0.4"
                      />
                    )}
                    {/* Moderate line */}
                    {thresholds.moderateThreshold <= maxDepthInCell * 1.2 && (
                      <line
                        x1="0"
                        y1={100 - (thresholds.moderateThreshold / Math.max(0.1, maxDepthInCell * 1.2)) * 100}
                        x2="400"
                        y2={100 - (thresholds.moderateThreshold / Math.max(0.1, maxDepthInCell * 1.2)) * 100}
                        stroke="#2563eb"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                        opacity="0.4"
                      />
                    )}
                  </>
                )}

                {/* Hydrograph polyline */}
                <polyline
                  fill="rgba(56, 189, 248, 0.15)"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  points={`0,100 ${hydrograph
                    .map((pt, i) => {
                      const x = (i / (hydrograph.length - 1)) * 400;
                      const y = 100 - (pt.depth / Math.max(0.01, maxDepthInCell * 1.2)) * 100;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(" ")} 400,100`}
                />
              </svg>
            </div>
          ) : (
            <div className="h-28 flex items-center justify-center text-xs text-slate-500 font-mono">
              Hydrograph points available after simulation run.
            </div>
          )}

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>T = 0s</span>
            <span>T = {((hydrograph.length - 1) * timeStepSeconds) / 60} min</span>
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-slate-800 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
