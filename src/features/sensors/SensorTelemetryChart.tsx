"use client";

import React from "react";
import type { SensorReading } from "./types";

interface SensorTelemetryChartProps {
  readings: SensorReading[];
  referenceHeightCm: number;
  warningDepthCm: number;
  criticalDepthCm: number;
  activePosition: string;
}

/**
 * Dual-trace real-time SVG telemetry chart plotting BOTH:
 * 1. Calculated Water Depth (cm) — Cyan/Emerald primary trace
 * 2. Measured Ultrasonic Distance to Water Surface (cm) — Amber dashed trace
 * Plus Reference Height, Warning Depth, and Critical Flood Threshold lines.
 */
export function SensorTelemetryChart({
  readings,
  referenceHeightCm,
  warningDepthCm,
  criticalDepthCm,
  activePosition,
}: SensorTelemetryChartProps) {
  const validReadings = readings.slice(-30);
  const width = 820;
  const height = 280;
  const padLeft = 48;
  const padRight = 24;
  const padTop = 22;
  const padBottom = 38;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxScaleCm = Math.max(
    referenceHeightCm + 5,
    criticalDepthCm + 5,
    ...validReadings.map((r) => r.measuredDistanceCm ?? 0),
    ...validReadings.map((r) => r.calculatedWaterDepthCm ?? 0),
    36
  );

  const toX = (index: number) => {
    if (validReadings.length <= 1) return padLeft + plotW / 2;
    return padLeft + (index / (validReadings.length - 1)) * plotW;
  };

  const toY = (valueCm: number) => {
    const clamped = Math.max(0, Math.min(maxScaleCm, valueCm));
    return padTop + plotH - (clamped / maxScaleCm) * plotH;
  };

  const depthPoints: string[] = [];
  const distancePoints: string[] = [];

  validReadings.forEach((r, idx) => {
    const x = toX(idx);
    if (r.calculatedWaterDepthCm !== null) {
      depthPoints.push(`${x.toFixed(1)},${toY(r.calculatedWaterDepthCm).toFixed(1)}`);
    }
    if (r.measuredDistanceCm !== null) {
      distancePoints.push(`${x.toFixed(1)},${toY(r.measuredDistanceCm).toFixed(1)}`);
    }
  });

  const yTicks = [
    0,
    Math.round(maxScaleCm * 0.25),
    Math.round(maxScaleCm * 0.5),
    Math.round(maxScaleCm * 0.75),
    Math.round(maxScaleCm),
  ];

  const refY = toY(referenceHeightCm);
  const warnY = toY(warningDepthCm);
  const critY = toY(criticalDepthCm);

  return (
    <figure className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            Live Telemetry Hydrograph — Station {activePosition} (Point Sensor Only)
          </h3>
          <p className="text-xs text-slate-400">
            Simultaneous plot of Ultrasonic Sensor-to-Water Air Gap Distance (cm) vs. Derived Water Depth (cm)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5 text-cyan-300">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-cyan-400" />
            Calculated Water Depth (cm)
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-300">
            <span className="inline-block h-0.5 w-4 border-b-2 border-dashed border-amber-400" />
            Measured Distance to Surface (cm)
          </span>
          <span className="inline-flex items-center gap-1.5 text-rose-300">
            <span className="inline-block h-0.5 w-3 bg-rose-500" />
            Critical Depth ({criticalDepthCm.toFixed(1)} cm)
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          role="img"
          aria-labelledby="hydrograph-chart-title"
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full min-w-[600px] select-none"
        >
          <title id="hydrograph-chart-title">
            Live sensor readings chart showing measured ultrasonic distance and calculated water depth in centimeters at station {activePosition}
          </title>

          {/* Horizontal Grid Lines & Y-Axis Labels */}
          {yTicks.map((tick) => {
            const y = toY(tick);
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 font-mono text-[10px]"
                >
                  {tick} cm
                </text>
              </g>
            );
          })}

          {/* Reference Height Line */}
          <line
            x1={padLeft}
            y1={refY}
            x2={width - padRight}
            y2={refY}
            stroke="#64748b"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <text
            x={width - padRight - 4}
            y={refY - 5}
            textAnchor="end"
            className="fill-slate-400 font-mono text-[10px]"
          >
            Ref Height ({referenceHeightCm.toFixed(1)} cm)
          </text>

          {/* Warning Depth Threshold */}
          <line
            x1={padLeft}
            y1={warnY}
            x2={width - padRight}
            y2={warnY}
            stroke="#f59e0b"
            strokeDasharray="2 4"
            strokeWidth="1"
            opacity="0.6"
          />

          {/* Critical Depth Threshold */}
          <line
            x1={padLeft}
            y1={critY}
            x2={width - padRight}
            y2={critY}
            stroke="#f43f5e"
            strokeDasharray="3 3"
            strokeWidth="1.2"
            opacity="0.75"
          />
          <text
            x={padLeft + 6}
            y={critY - 5}
            className="fill-rose-400 font-mono text-[10px]"
          >
            Critical Flood Depth ({criticalDepthCm.toFixed(1)} cm)
          </text>

          {/* Measured Ultrasonic Distance Trace (Amber Dashed) */}
          {distancePoints.length > 1 && (
            <polyline
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeDasharray="5 3"
              points={distancePoints.join(" ")}
            />
          )}

          {/* Calculated Water Depth Trace (Cyan Solid) */}
          {depthPoints.length > 1 && (
            <polyline
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2.75"
              points={depthPoints.join(" ")}
            />
          )}

          {/* Data Point Nodes */}
          {validReadings.map((r, idx) => {
            const x = toX(idx);
            return (
              <g key={r.readingId}>
                {r.measuredDistanceCm !== null && (
                  <circle
                    cx={x}
                    cy={toY(r.measuredDistanceCm)}
                    r={3}
                    fill={r.sourceMode === "LIVE" ? "#f59e0b" : "#fcd34d"}
                  />
                )}
                {r.calculatedWaterDepthCm !== null && (
                  <circle
                    cx={x}
                    cy={toY(r.calculatedWaterDepthCm)}
                    r={3.5}
                    fill={
                      r.calibrationUnderflowWarning
                        ? "#f43f5e"
                        : r.sourceMode === "LIVE"
                          ? "#06b6d4"
                          : "#38bdf8"
                    }
                  />
                )}
                {/* X-axis timestamps every 6 points */}
                {(idx % 6 === 0 || idx === validReadings.length - 1) && (
                  <text
                    x={x}
                    y={height - 10}
                    textAnchor="middle"
                    className="fill-slate-400 font-mono text-[10px]"
                  >
                    {new Date(r.timestamp).toLocaleTimeString([], {
                      hour12: false,
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-2 text-xs text-slate-400">
        <span>
          Formula: <code className="text-cyan-300">Water Depth = max(0, Reference Height − Measured Distance)</code>
        </span>
        <span>
          Showing latest {validReadings.length} frames • Simulated points and live ESP32 points are tagged per row in the table below
        </span>
      </figcaption>
    </figure>
  );
}
