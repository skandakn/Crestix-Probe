"use client";

import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { DepthThresholdConfig, SimulationFrame } from "../types/contract";
import { Eye, Layers, Compass, Hash, Sparkles } from "lucide-react";

interface FloodGridCanvasProps {
  elevationGrid: number[][];
  currentFrame: SimulationFrame | null;
  thresholds: DepthThresholdConfig;
  cellSizeMeters: number;
  onSelectCell?: (cellInfo: SelectedCellInfo) => void;
  selectedCell?: { r: number; c: number } | null;
}

export interface SelectedCellInfo {
  r: number;
  c: number;
  elevation: number;
  depth: number;
  waterSurfaceElevation: number;
  category: "dry" | "shallow" | "moderate" | "deep";
}

export const FloodGridCanvas: React.FC<FloodGridCanvasProps> = ({
  elevationGrid,
  currentFrame,
  thresholds,
  cellSizeMeters,
  onSelectCell,
  selectedCell,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);
  const [showCellValues, setShowCellValues] = useState<boolean>(false);
  const [showContours, setShowContours] = useState<boolean>(true);
  const [showFlowVectors, setShowFlowVectors] = useState<boolean>(false);

  const rows = elevationGrid.length;
  const cols = rows > 0 ? elevationGrid[0].length : 0;

  // Elevation min/max for topographic color ramp
  const { minElev, maxElev } = useMemo(() => {
    let minE = Infinity;
    let maxE = -Infinity;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = elevationGrid[r][c];
        if (val < minE) minE = val;
        if (val > maxE) maxE = val;
      }
    }
    return {
      minElev: minE === Infinity ? 0 : minE,
      maxElev: maxE === -Infinity ? 10 : maxE,
    };
  }, [elevationGrid, rows, cols]);

  // Color mapper based on depth and thresholds
  const getCellFillColor = useCallback(
    (depth: number, elevation: number) => {
      // 1. Dry area: Show topography elevation color
      if (depth <= thresholds.dryThreshold) {
        const elevNorm = (elevation - minElev) / Math.max(1, maxElev - minElev);
        // Earthy topographic tones: from lowland valley slate-emerald to highland brown-amber
        const red = Math.round(30 + elevNorm * 70);
        const green = Math.round(45 + elevNorm * 65);
        const blue = Math.round(35 + elevNorm * 50);
        return `rgb(${red}, ${green}, ${blue})`;
      }

      // 2. Shallow water (dryThreshold to shallowThreshold)
      if (depth <= thresholds.shallowThreshold) {
        const ratio =
          (depth - thresholds.dryThreshold) /
          Math.max(0.001, thresholds.shallowThreshold - thresholds.dryThreshold);
        // Soft cyan / sky blue
        const r = Math.round(56 - ratio * 20);
        const g = Math.round(189 - ratio * 30);
        const b = Math.round(248);
        return `rgba(${r}, ${g}, ${b}, 0.85)`;
      }

      // 3. Moderate water (shallowThreshold to moderateThreshold)
      if (depth <= thresholds.moderateThreshold) {
        const ratio =
          (depth - thresholds.shallowThreshold) /
          Math.max(0.001, thresholds.moderateThreshold - thresholds.shallowThreshold);
        // Vibrant royal blue
        const r = Math.round(37 - ratio * 15);
        const g = Math.round(99 - ratio * 40);
        const b = Math.round(235 - ratio * 20);
        return `rgba(${r}, ${g}, ${b}, 0.92)`;
      }

      // 4. Deep water (> moderateThreshold)
      // Deep ocean navy / cobalt
      const excess = Math.min(1, (depth - thresholds.moderateThreshold) / 1.5);
      const r = Math.round(20 - excess * 10);
      const g = Math.round(40 - excess * 25);
      const b = Math.round(180 - excess * 60);
      return `rgba(${r}, ${g}, ${b}, 0.98)`;
    },
    [thresholds, minElev, maxElev]
  );

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || rows === 0 || cols === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cellWidth = width / cols;
    const cellHeight = height / rows;

    ctx.clearRect(0, 0, width, height);

    const waterDepths = currentFrame?.waterDepthGrid;

    // Draw cells
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const elev = elevationGrid[r][c];
        const depth = waterDepths ? waterDepths[r][c] || 0 : 0;
        const x = c * cellWidth;
        const y = r * cellHeight;

        // Fill cell
        ctx.fillStyle = getCellFillColor(depth, elev);
        ctx.fillRect(x, y, cellWidth, cellHeight);

        // Optional contour / hillshade relief effect
        if (showContours) {
          const elevNorm = (elev - minElev) / Math.max(1, maxElev - minElev);
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.04 + elevNorm * 0.08})`;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, cellWidth, cellHeight);
        }

        // Draw depth numbers if toggled
        if (showCellValues && cellWidth > 20) {
          ctx.fillStyle = depth > thresholds.dryThreshold ? "#ffffff" : "#94a3b8";
          ctx.font = `${Math.max(8, Math.min(11, Math.floor(cellWidth * 0.28)))}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const label = depth > thresholds.dryThreshold ? `${depth.toFixed(2)}m` : `${elev.toFixed(1)}z`;
          ctx.fillText(label, x + cellWidth / 2, y + cellHeight / 2);
        }

        // Flow vector arrows (gradient downhill flow)
        if (showFlowVectors && depth > thresholds.dryThreshold && cellWidth > 15) {
          // Approximate downhill direction
          let dzdx = 0;
          let dzdy = 0;
          if (c > 0 && c < cols - 1) {
            dzdx = (elevationGrid[r][c - 1] - elevationGrid[r][c + 1]) / 2;
          }
          if (r > 0 && r < rows - 1) {
            dzdy = (elevationGrid[r - 1][c] - elevationGrid[r + 1][c]) / 2;
          }
          const mag = Math.sqrt(dzdx * dzdx + dzdy * dzdy);
          if (mag > 0.05) {
            const dirX = dzdx / mag;
            const dirY = dzdy / mag;
            const arrowLen = Math.min(cellWidth * 0.35, 12);
            const cx = x + cellWidth / 2;
            const cy = y + cellHeight / 2;

            ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(cx - dirX * (arrowLen * 0.5), cy - dirY * (arrowLen * 0.5));
            ctx.lineTo(cx + dirX * (arrowLen * 0.5), cy + dirY * (arrowLen * 0.5));
            ctx.stroke();
          }
        }
      }
    }

    // Highlight hovered cell
    if (hoveredCell && hoveredCell.r < rows && hoveredCell.c < cols) {
      const hx = hoveredCell.c * cellWidth;
      const hy = hoveredCell.r * cellHeight;
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.5;
      ctx.strokeRect(hx + 1, hy + 1, cellWidth - 2, cellHeight - 2);
    }

    // Highlight selected cell
    if (selectedCell && selectedCell.r < rows && selectedCell.c < cols) {
      const sx = selectedCell.c * cellWidth;
      const sy = selectedCell.r * cellHeight;
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 3;
      ctx.strokeRect(sx + 1, sy + 1, cellWidth - 2, cellHeight - 2);
    }
  }, [
    elevationGrid,
    currentFrame,
    rows,
    cols,
    getCellFillColor,
    hoveredCell,
    selectedCell,
    showCellValues,
    showContours,
    showFlowVectors,
    thresholds,
    minElev,
    maxElev,
  ]);

  // Handle canvas mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || rows === 0 || cols === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellWidth = rect.width / cols;
    const cellHeight = rect.height / rows;

    const c = Math.floor(x / cellWidth);
    const r = Math.floor(y / cellHeight);

    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      setHoveredCell({ r, c });
    } else {
      setHoveredCell(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  // Mobile Touch Support
  const handleTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || rows === 0 || cols === 0) return;
    const touch = e.touches[0];
    if (!touch) return;
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const cellWidth = rect.width / cols;
    const cellHeight = rect.height / rows;

    const c = Math.floor(x / cellWidth);
    const r = Math.floor(y / cellHeight);

    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      setHoveredCell({ r, c });
      if (onSelectCell) {
        const elevation = elevationGrid[r]?.[c] || 0;
        const depth = currentFrame?.waterDepthGrid?.[r]?.[c] || 0;
        const waterSurfaceElevation = parseFloat((elevation + depth).toFixed(3));

        let category: "dry" | "shallow" | "moderate" | "deep" = "dry";
        if (depth > thresholds.moderateThreshold) category = "deep";
        else if (depth > thresholds.shallowThreshold) category = "moderate";
        else if (depth > thresholds.dryThreshold) category = "shallow";

        onSelectCell({
          r,
          c,
          elevation,
          depth,
          waterSurfaceElevation,
          category,
        });
      }
    }
  };

  const handleClick = () => {
    if (!hoveredCell || !onSelectCell) return;
    const { r, c } = hoveredCell;
    const elevation = elevationGrid[r]?.[c] || 0;
    const depth = currentFrame?.waterDepthGrid?.[r]?.[c] || 0;
    const waterSurfaceElevation = parseFloat((elevation + depth).toFixed(3));

    let category: "dry" | "shallow" | "moderate" | "deep" = "dry";
    if (depth > thresholds.moderateThreshold) category = "deep";
    else if (depth > thresholds.shallowThreshold) category = "moderate";
    else if (depth > thresholds.dryThreshold) category = "shallow";

    onSelectCell({
      r,
      c,
      elevation,
      depth,
      waterSurfaceElevation,
      category,
    });
  };

  // Inspect currently hovered cell data
  const hoveredInfo = useMemo(() => {
    if (!hoveredCell || !elevationGrid[hoveredCell.r]) return null;
    const { r, c } = hoveredCell;
    const elevation = elevationGrid[r][c];
    const depth = currentFrame?.waterDepthGrid?.[r]?.[c] || 0;
    const wse = parseFloat((elevation + depth).toFixed(2));

    let cat = "Dry Terrain";
    let catClass = "text-slate-400";
    if (depth > thresholds.moderateThreshold) {
      cat = "Deep Inundation";
      catClass = "text-indigo-400 font-bold";
    } else if (depth > thresholds.shallowThreshold) {
      cat = "Moderate Water";
      catClass = "text-blue-400 font-bold";
    } else if (depth > thresholds.dryThreshold) {
      cat = "Shallow Ponding";
      catClass = "text-sky-300 font-bold";
    }

    return {
      r,
      c,
      elevation,
      depth,
      wse,
      cat,
      catClass,
    };
  }, [hoveredCell, elevationGrid, currentFrame, thresholds]);

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Visual Canvas Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-cyan-400" />
            2D Hydraulic Stage ({rows}×{cols} Grid • {cellSizeMeters}m resolution)
          </span>
        </div>

        {/* Display Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowContours(!showContours)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border transition-colors ${
              showContours
                ? "bg-cyan-950 text-cyan-300 border-cyan-800"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
            title="Toggle elevation relief contours"
          >
            <Layers className="w-3 h-3" />
            <span>Relief</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCellValues(!showCellValues)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border transition-colors ${
              showCellValues
                ? "bg-cyan-950 text-cyan-300 border-cyan-800"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
            title="Toggle cell values"
          >
            <Hash className="w-3 h-3" />
            <span>Values</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFlowVectors(!showFlowVectors)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border transition-colors ${
              showFlowVectors
                ? "bg-cyan-950 text-cyan-300 border-cyan-800"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
            title="Toggle flow vectors"
          >
            <Eye className="w-3 h-3" />
            <span>Vectors</span>
          </button>
        </div>
      </div>

      {/* Grid Canvas Stage */}
      <div className="relative bg-slate-950 rounded-2xl border border-slate-800 p-2 sm:p-4 flex items-center justify-center shadow-2xl overflow-hidden aspect-square max-h-[580px] mx-auto w-full">
        <canvas
          ref={canvasRef}
          width={640}
          height={640}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          onTouchStart={handleTouch}
          onTouchMove={handleTouch}
          className="w-full h-full max-w-[550px] max-h-[550px] object-contain rounded-xl border border-slate-800/80 cursor-crosshair shadow-inner touch-none"
        />

        {/* Hover inspection pill badge */}
        {hoveredInfo && (
          <div className="absolute top-4 left-4 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-lg shadow-xl backdrop-blur-md text-[11px] font-mono pointer-events-none flex items-center gap-3 animate-fadeIn">
            <div>
              <span className="text-slate-400">Cell: </span>
              <span className="text-slate-200 font-bold">
                [{hoveredInfo.r}, {hoveredInfo.c}]
              </span>
            </div>
            <div>
              <span className="text-slate-400">DEM: </span>
              <span className="text-amber-300 font-bold">{hoveredInfo.elevation.toFixed(2)}m</span>
            </div>
            <div>
              <span className="text-slate-400">Depth: </span>
              <span className="text-cyan-300 font-bold">{hoveredInfo.depth.toFixed(3)}m</span>
            </div>
            <div>
              <span className="text-slate-400">WSE: </span>
              <span className="text-blue-300 font-bold">{hoveredInfo.wse.toFixed(2)}m</span>
            </div>
            <div className={`px-1.5 py-0.2 rounded text-[10px] bg-slate-950 ${hoveredInfo.catClass}`}>
              {hoveredInfo.cat}
            </div>
          </div>
        )}
      </div>

      {/* Helper text */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
        <span>Click any cell to lock inspection hydrograph • Hover to inspect real-time values</span>
        <span className="font-mono">
          Elevation range: {minElev.toFixed(1)}m – {maxElev.toFixed(1)}m
        </span>
      </div>
    </div>
  );
};
