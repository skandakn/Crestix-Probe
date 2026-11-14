'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ForecastFrame } from '../types/forecast';
import { getVelocityColor } from '../utils/physics';
import { MockDataBadge } from './mock-badge';
import { Navigation, Wind, AlertCircle, Compass, Info } from 'lucide-react';

interface VelocityMapProps {
  currentFrame: ForecastFrame | null;
  isMock: boolean;
  supportsVelocity: boolean;
  modelName: string;
}

export const VelocityMap: React.FC<VelocityMapProps> = ({
  currentFrame,
  isMock,
  supportsVelocity,
  modelName
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showVectors, setShowVectors] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{
    x: number;
    y: number;
    speed: number;
    u: number;
    v: number;
  } | null>(null);

  const velocityGrid = currentFrame?.velocityGrid;

  // Render velocity field & vector arrows on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !supportsVelocity || !velocityGrid) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { u: uGrid, v: vGrid, speed: speedGrid } = velocityGrid;
    const rows = speedGrid.length;
    const cols = speedGrid[0].length;
    const width = canvas.width;
    const height = canvas.height;
    const cellW = width / cols;
    const cellH = height / rows;

    // Clear background
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw scalar speed heatmap
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const speed = speedGrid[r][c];

        if (speed > 0.05) {
          const col = getVelocityColor(speed);
          const alpha = Math.min(0.85, 0.2 + (speed / 3.0) * 0.65);
          ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${alpha})`;
          ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
        } else {
          // Dry / quiescent cell
          ctx.fillStyle = '#0a0f1d';
          ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
        }
      }
    }

    // 2. Draw directional velocity vectors (quiver plot)
    if (showVectors) {
      // Sample arrows every 2 or 3 cells so visual is clear and uncluttered
      const stride = cols > 64 ? 4 : 2;

      for (let r = 1; r < rows; r += stride) {
        for (let c = 1; c < cols; c += stride) {
          const speed = speedGrid[r][c];
          if (speed < 0.1) continue;

          const u = uGrid[r][c];
          const v = vGrid[r][c];

          const cx = (c + 0.5) * cellW;
          const cy = (r + 0.5) * cellH;

          // Normalize & scale arrow length
          const arrowLen = Math.min(cellW * stride * 1.2, 3 + (speed / 2.5) * 12);
          const angle = Math.atan2(v, u);

          const targetX = cx + Math.cos(angle) * arrowLen;
          const targetY = cy + Math.sin(angle) * arrowLen;

          // Draw vector line
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(targetX, targetY);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Arrowhead
          const headLen = Math.min(4, arrowLen * 0.4);
          ctx.beginPath();
          ctx.moveTo(targetX, targetY);
          ctx.lineTo(
            targetX - headLen * Math.cos(angle - Math.PI / 6),
            targetY - headLen * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            targetX - headLen * Math.cos(angle + Math.PI / 6),
            targetY - headLen * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      }
    }
  }, [velocityGrid, supportsVelocity, showVectors]);

  // Mouse inspection for velocity
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !velocityGrid) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const pixelX = (e.clientX - rect.left) * scaleX;
    const pixelY = (e.clientY - rect.top) * scaleY;

    const col = Math.floor((pixelX / canvas.width) * velocityGrid.speed[0].length);
    const row = Math.floor((pixelY / canvas.height) * velocityGrid.speed.length);

    if (row >= 0 && row < velocityGrid.speed.length && col >= 0 && col < velocityGrid.speed[0].length) {
      setHoveredCell({
        x: col,
        y: row,
        speed: velocityGrid.speed[row][col],
        u: velocityGrid.u[row][col],
        v: velocityGrid.v[row][col]
      });
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden flex flex-col">
      {/* Header Bar */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
            Predicted Velocity Vector Field
          </h3>
          <span className="text-[10px] font-mono text-slate-400">u(x, y, t) [m/s]</span>
        </div>

        <div className="flex items-center gap-2">
          <MockDataBadge isMock={isMock} size="sm" />

          {supportsVelocity && (
            <button
              type="button"
              onClick={() => setShowVectors(!showVectors)}
              className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                showVectors
                  ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              Vectors: {showVectors ? 'ON' : 'OFF'}
            </button>
          )}
        </div>
      </div>

      {/* Main Visualizer or Unavailable Notice */}
      <div className="relative aspect-square sm:aspect-[4/3] w-full bg-slate-950 flex items-center justify-center p-2">
        {!supportsVelocity ? (
          <div className="flex flex-col items-center justify-center text-center p-6 max-w-md space-y-3">
            <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="font-mono text-sm font-semibold text-slate-200">
              Velocity Vectors Unavailable for {modelName}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standard ConvLSTM baseline models only estimate scalar flood depth <em>h</em> and cannot solve the coupled momentum conservation equations for flow velocity <em>(u, v)</em>.
            </p>
            <div className="text-[11px] font-mono text-cyan-400 border border-cyan-500/30 bg-cyan-950/30 rounded-lg p-2.5">
              Select <strong>FNO-2D</strong> or <strong>PINO-SWE</strong> above to view coupled velocity fields and flow streamline vectors.
            </div>
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              width={512}
              height={512}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredCell(null)}
              className="w-full h-full object-contain rounded-lg border border-slate-800/80 cursor-crosshair shadow-inner"
            />

            {/* Compass */}
            <div className="absolute top-4 right-4 bg-slate-950/80 border border-slate-800/80 rounded-full p-1.5 text-slate-400 shadow-md">
              <Compass className="w-4 h-4 text-emerald-400" />
            </div>

            {/* Hover probe */}
            {hoveredCell && (
              <div className="absolute bottom-4 left-4 bg-slate-900/95 border border-slate-700/80 rounded-lg p-2.5 text-xs font-mono shadow-2xl backdrop-blur-md space-y-1 pointer-events-none min-w-[190px]">
                <div className="text-slate-400 text-[10px] flex items-center justify-between border-b border-slate-800 pb-1">
                  <span>VELOCITY PROBE</span>
                  <span className="text-emerald-400">X:{hoveredCell.x} Y:{hoveredCell.y}</span>
                </div>
                <div className="flex items-center justify-between text-slate-200 pt-0.5">
                  <span>Flow Speed:</span>
                  <span className="font-bold text-sm text-emerald-300">{hoveredCell.speed.toFixed(2)} m/s</span>
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between font-mono">
                  <span>Vector:</span>
                  <span>u:{hoveredCell.u.toFixed(2)} m/s | v:{hoveredCell.v.toFixed(2)} m/s</span>
                </div>
              </div>
            )}

            {/* Velocity Legend */}
            <div className="absolute bottom-4 right-4 bg-slate-950/90 border border-slate-800/80 rounded-lg p-2 text-[10px] font-mono shadow-xl backdrop-blur-md">
              <div className="text-slate-400 mb-1 font-semibold">FLOW SPEED SCALE (m/s)</div>
              <div className="flex items-center gap-1">
                <span className="text-slate-500">0.0</span>
                <div className="h-2.5 w-24 rounded bg-gradient-to-r from-sky-400 via-emerald-400 via-amber-400 to-rose-500 shadow-sm" />
                <span className="text-rose-400 font-bold">&gt;2.5</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Ribbon */}
      <div className="px-4 py-2 bg-slate-900/40 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
        <div className="flex items-center gap-3">
          <span>Coupled Operator: <strong className={supportsVelocity ? 'text-emerald-400' : 'text-slate-500'}>{supportsVelocity ? '2D SWE (u, v)' : 'None'}</strong></span>
          {supportsVelocity && (
            <span>Quiver Flow: <strong className="text-slate-200">Streamwise Arrows</strong></span>
          )}
        </div>
        <div>
          <span>Model: <span className="text-slate-200">{modelName}</span></span>
        </div>
      </div>
    </div>
  );
};
