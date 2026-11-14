'use client';

import React from 'react';
import { CrossSectionPoint } from '../types/terrain';
import { X, TrendingUp, Waves, Maximize2 } from 'lucide-react';

interface TerrainCrossSectionModalProps {
  points: CrossSectionPoint[] | null;
  onClose: () => void;
}

export const TerrainCrossSectionModal: React.FC<TerrainCrossSectionModalProps> = ({
  points,
  onClose
}) => {
  if (!points || points.length === 0) return null;

  const totalDistance = points[points.length - 1].distance;
  const elevations = points.map(p => p.elevation);
  const minElev = Math.min(...elevations);
  const maxElev = Math.max(...elevations);
  const waterLevel = points[0].waterLevel;

  const yMin = Math.floor(Math.min(minElev, waterLevel) - 5);
  const yMax = Math.ceil(Math.max(maxElev, waterLevel) + 5);
  const yRange = Math.max(1, yMax - yMin);

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const padding = { top: 20, right: 30, bottom: 35, left: 55 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Convert points to SVG coordinates
  const svgPoints = points.map(p => {
    const x = padding.left + (p.distance / Math.max(1, totalDistance)) * plotWidth;
    const y = padding.top + plotHeight - ((p.elevation - yMin) / yRange) * plotHeight;
    return { x, y, ...p };
  });

  const polylineStr = svgPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Water level Y coordinate
  const waterY = padding.top + plotHeight - ((waterLevel - yMin) / yRange) * plotHeight;

  // Shaded terrain polygon
  const groundPolygon = `${padding.left},${padding.top + plotHeight} ${polylineStr} ${
    padding.left + plotWidth
  },${padding.top + plotHeight}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-slate-100">
              Topographic Cross-Section Elevation Profile
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Chart */}
        <div className="p-6 bg-slate-950/40">
          <div className="relative w-full overflow-hidden bg-slate-950 border border-slate-800 rounded-xl p-3">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto text-slate-400 select-none"
            >
              <defs>
                {/* Terrain gradient fill */}
                <linearGradient id="terrainFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#047857" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
                const y = padding.top + plotHeight * (1 - frac);
                const val = yMin + yRange * frac;
                return (
                  <g key={idx}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={padding.left + plotWidth}
                      y2={y}
                      stroke="#1e293b"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[9px] font-mono fill-slate-500"
                    >
                      {Math.round(val)}m
                    </text>
                  </g>
                );
              })}

              {/* Vertical Distance markers */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
                const x = padding.left + plotWidth * frac;
                const d = totalDistance * frac;
                return (
                  <g key={idx}>
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={padding.top + plotHeight}
                      stroke="#1e293b"
                      strokeDasharray="2 4"
                    />
                    <text
                      x={x}
                      y={padding.top + plotHeight + 15}
                      textAnchor="middle"
                      className="text-[9px] font-mono fill-slate-500"
                    >
                      {Math.round(d)}m
                    </text>
                  </g>
                );
              })}

              {/* Ground polygon */}
              <polygon points={groundPolygon} fill="url(#terrainFill)" />

              {/* Water Level Line */}
              {waterY >= padding.top && waterY <= padding.top + plotHeight && (
                <g>
                  <line
                    x1={padding.left}
                    y1={waterY}
                    x2={padding.left + plotWidth}
                    y2={waterY}
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    strokeDasharray="5 3"
                  />
                  <text
                    x={padding.left + plotWidth - 4}
                    y={waterY - 5}
                    textAnchor="end"
                    className="text-[9px] font-mono fill-blue-400 font-semibold"
                  >
                    Simulated Water Level ({Math.round(waterLevel)}m)
                  </text>
                </g>
              )}

              {/* Terrain elevation stroke */}
              <polyline
                points={polylineStr}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-3 gap-3 mt-4 text-xs font-mono">
            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
              <span className="text-slate-400 text-[10px]">Slice Distance:</span>
              <div className="text-slate-100 font-bold text-sm">
                {Math.round(totalDistance)} meters
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
              <span className="text-slate-400 text-[10px]">Elevation Relief:</span>
              <div className="text-emerald-400 font-bold text-sm">
                {Math.round(maxElev - minElev)} m ({Math.round(minElev)}m → {Math.round(maxElev)}m)
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
              <span className="text-slate-400 text-[10px]">Submergence Risk:</span>
              <div className="text-blue-400 font-bold text-sm">
                {points.filter(p => p.isSubmerged).length > 0 ? 'Flooded Zones Present' : 'Above Water Level'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
