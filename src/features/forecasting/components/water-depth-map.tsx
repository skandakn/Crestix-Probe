'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ForecastFrame } from '../types/forecast';
import { CRITICAL_INFRASTRUCTURE, getWaterDepthColor, getHazardLevel } from '../utils/physics';
import { MockDataBadge } from './mock-badge';
import { Eye, Layers, ShieldAlert, Maximize2, Compass, MapPin } from 'lucide-react';

interface WaterDepthMapProps {
  currentFrame: ForecastFrame | null;
  isMock: boolean;
  modelName: string;
}

export const WaterDepthMap: React.FC<WaterDepthMapProps> = ({
  currentFrame,
  isMock,
  modelName
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showContours, setShowContours] = useState(true);
  const [showInfra, setShowInfra] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{
    x: number;
    y: number;
    depth: number;
    hazard: { label: string; color: string; bg: string };
    nearestInfra?: string;
  } | null>(null);

  const depthGrid = currentFrame?.depthGrid;
  const gridSize = depthGrid?.length || 64;

  // Render water depth field to HTML5 canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !depthGrid || depthGrid.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rows = depthGrid.length;
    const cols = depthGrid[0].length;
    const width = canvas.width;
    const height = canvas.height;
    const cellW = width / cols;
    const cellH = height / rows;

    // Clear background: dark topographic terrain base
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, width, height);

    // Draw subtle topographic terrain elevation texture
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const depth = depthGrid[r][c];

        if (depth > 0.02) {
          const color = getWaterDepthColor(depth);
          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
          ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
        } else {
          // Dry terrain cell with gentle gradient
          const elevationBase = Math.floor(18 + Math.sin(r * 0.1) * Math.cos(c * 0.1) * 6);
          ctx.fillStyle = `rgb(${elevationBase}, ${elevationBase + 4}, ${elevationBase + 8})`;
          ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
        }
      }
    }

    // Draw contour isolines if toggled
    if (showContours) {
      ctx.lineWidth = 1;
      const contourThresholds = [0.5, 1.0, 2.0, 3.5];

      for (const thresh of contourThresholds) {
        ctx.strokeStyle = thresh === 0.5 ? 'rgba(56, 189, 248, 0.4)' : thresh === 1.0 ? 'rgba(96, 165, 250, 0.6)' : 'rgba(192, 132, 252, 0.8)';
        ctx.beginPath();

        for (let r = 0; r < rows - 1; r++) {
          for (let c = 0; c < cols - 1; c++) {
            const d00 = depthGrid[r][c];
            const d10 = depthGrid[r + 1][c];
            const d01 = depthGrid[r][c + 1];

            if ((d00 < thresh && d10 >= thresh) || (d00 >= thresh && d10 < thresh)) {
              ctx.moveTo(c * cellW, (r + 0.5) * cellH);
              ctx.lineTo((c + 0.5) * cellW, (r + 1) * cellH);
            }
            if ((d00 < thresh && d01 >= thresh) || (d00 >= thresh && d01 < thresh)) {
              ctx.moveTo((c + 0.5) * cellW, r * cellH);
              ctx.lineTo((c + 1) * cellW, (r + 0.5) * cellH);
            }
          }
        }
        ctx.stroke();
      }
    }

    // Draw critical infrastructure markers
    if (showInfra) {
      const scale = cols / 64;
      for (const infra of CRITICAL_INFRASTRUCTURE) {
        const cx = infra.gridX * scale * cellW;
        const cy = infra.gridY * scale * cellH;
        const currentDepth = currentFrame?.criticalPointDepths?.[infra.id] ?? 0;
        const isBreached = currentDepth >= infra.criticalThresholdM;

        // Draw pin outer ring
        ctx.beginPath();
        ctx.arc(cx, cy, 7, 0, Math.PI * 2);
        ctx.fillStyle = isBreached ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Inner dot
        ctx.beginPath();
        ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Label
        ctx.font = '10px monospace';
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(infra.name.split(' ')[0], cx + 9, cy + 3);
      }
    }
  }, [depthGrid, showContours, showInfra, currentFrame]);

  // Handle canvas mouse move for interactive cell inspection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !depthGrid) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const pixelX = (e.clientX - rect.left) * scaleX;
    const pixelY = (e.clientY - rect.top) * scaleY;

    const col = Math.floor((pixelX / canvas.width) * depthGrid[0].length);
    const row = Math.floor((pixelY / canvas.height) * depthGrid.length);

    if (row >= 0 && row < depthGrid.length && col >= 0 && col < depthGrid[0].length) {
      const depth = depthGrid[row][col];
      const hazard = getHazardLevel(depth);

      // Check nearest infrastructure
      const scale = depthGrid[0].length / 64;
      const nearest = CRITICAL_INFRASTRUCTURE.find(
        (inf) => Math.hypot(inf.gridX * scale - col, inf.gridY * scale - row) < 4
      );

      setHoveredCell({
        x: col,
        y: row,
        depth,
        hazard,
        nearestInfra: nearest ? nearest.name : undefined
      });
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden flex flex-col">
      {/* Header Bar */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
            Predicted Water-Depth Inundation Map
          </h3>
          <span className="text-[10px] font-mono text-slate-400">h(x, y, t) [meters]</span>
        </div>

        <div className="flex items-center gap-2">
          <MockDataBadge isMock={isMock} size="sm" />

          {/* Controls */}
          <button
            type="button"
            onClick={() => setShowContours(!showContours)}
            className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
              showContours
                ? 'border-cyan-500/60 bg-cyan-950/40 text-cyan-300'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            Contours: {showContours ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={() => setShowInfra(!showInfra)}
            className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
              showInfra
                ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            Assets: {showInfra ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="relative aspect-square sm:aspect-[4/3] w-full bg-slate-950 flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={512}
          height={512}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredCell(null)}
          className="w-full h-full object-contain rounded-lg border border-slate-800/80 cursor-crosshair shadow-inner"
        />

        {/* Compass & Orientation Overlay */}
        <div className="absolute top-4 right-4 bg-slate-950/80 border border-slate-800/80 rounded-full p-1.5 text-slate-400 shadow-md">
          <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
        </div>

        {/* Live Hover Cell Probe HUD */}
        {hoveredCell && (
          <div className="absolute bottom-4 left-4 bg-slate-900/95 border border-slate-700/80 rounded-lg p-2.5 text-xs font-mono shadow-2xl backdrop-blur-md space-y-1 pointer-events-none min-w-[200px]">
            <div className="text-slate-400 text-[10px] flex items-center justify-between border-b border-slate-800 pb-1">
              <span>PROBE COORDINATES</span>
              <span className="text-cyan-400">X:{hoveredCell.x} Y:{hoveredCell.y}</span>
            </div>
            <div className="flex items-center justify-between text-slate-200 pt-0.5">
              <span>Water Depth (h):</span>
              <span className="font-bold text-sm text-cyan-300">{hoveredCell.depth.toFixed(2)} m</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Hazard Classification:</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${hoveredCell.hazard.bg} ${hoveredCell.hazard.color}`}>
                {hoveredCell.hazard.label}
              </span>
            </div>
            {hoveredCell.nearestInfra && (
              <div className="text-[10px] text-amber-300 flex items-center gap-1 pt-1 border-t border-slate-800">
                <ShieldAlert className="w-3 h-3 text-amber-400" />
                <span>Near: {hoveredCell.nearestInfra}</span>
              </div>
            )}
          </div>
        )}

        {/* Depth Color Scale Bar */}
        <div className="absolute bottom-4 right-4 bg-slate-950/90 border border-slate-800/80 rounded-lg p-2 text-[10px] font-mono shadow-xl backdrop-blur-md">
          <div className="text-slate-400 mb-1 font-semibold">WATER DEPTH SCALE (m)</div>
          <div className="flex items-center gap-1">
            <span className="text-slate-500">0.0m</span>
            <div className="h-2.5 w-28 rounded bg-gradient-to-r from-cyan-400 via-blue-600 via-indigo-600 to-rose-600 shadow-sm" />
            <span className="text-rose-400 font-bold">&gt;4.0m</span>
          </div>
        </div>
      </div>

      {/* Frame Summary Ribbon */}
      <div className="px-4 py-2 bg-slate-900/40 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
        <div className="flex items-center gap-3">
          <span>Max Depth: <strong className="text-slate-100">{currentFrame?.maxDepthMeters.toFixed(2) ?? '0.00'} m</strong></span>
          <span>Flooded Extent: <strong className="text-cyan-300">{currentFrame?.floodedAreaKm2.toFixed(1) ?? '0.0'} km²</strong></span>
        </div>
        <div>
          <span>Model: <span className="text-slate-200">{modelName}</span></span>
        </div>
      </div>
    </div>
  );
};

