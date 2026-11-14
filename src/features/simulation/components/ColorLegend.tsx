"use client";

import React from "react";
import { DepthThresholdConfig } from "../types/contract";
import { Sliders, AlertTriangle, Info } from "lucide-react";

interface ColorLegendProps {
  thresholds: DepthThresholdConfig;
  onOpenSettings: () => void;
  maxDepthInFrame?: number;
}

export const ColorLegend: React.FC<ColorLegendProps> = ({
  thresholds,
  onOpenSettings,
  maxDepthInFrame = 0,
}) => {
  const items = [
    {
      label: "Dry Area",
      range: `0.00 – ${thresholds.dryThreshold.toFixed(2)} ${thresholds.unit}`,
      colorBg: "bg-amber-950/40 border border-amber-800/40",
      indicatorColor: "#334155",
      description: "Sub-threshold / unsubmerged ground",
    },
    {
      label: "Shallow Water",
      range: `${thresholds.dryThreshold.toFixed(2)} – ${thresholds.shallowThreshold.toFixed(2)} ${thresholds.unit}`,
      colorBg: "bg-sky-950/40 border border-sky-700/50",
      indicatorColor: "#38bdf8",
      description: "Sheetflow / localized ponding",
    },
    {
      label: "Moderate Depth",
      range: `${thresholds.shallowThreshold.toFixed(2)} – ${thresholds.moderateThreshold.toFixed(2)} ${thresholds.unit}`,
      colorBg: "bg-blue-950/40 border border-blue-600/50",
      indicatorColor: "#2563eb",
      description: "Channelized flow / moderate inundation",
    },
    {
      label: "Deep Water",
      range: `> ${thresholds.moderateThreshold.toFixed(2)} ${thresholds.unit}`,
      colorBg: "bg-indigo-950/50 border border-indigo-500/50",
      indicatorColor: "#1e1b4b",
      description: "Severe retention / submergence",
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 backdrop-blur-md shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Hydraulic Depth Legend
          </h4>
        </div>
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/40 px-2.5 py-1 rounded-md transition-colors"
          title="Configure visualization intervals"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Tune Thresholds</span>
        </button>
      </div>

      {/* Visual continuous gradient bar */}
      <div className="space-y-1">
        <div
          className="h-3 w-full rounded-md shadow-inner"
          style={{
            background:
              "linear-gradient(to right, #242f3d 0%, #38bdf8 25%, #2563eb 60%, #1e1b4b 100%)",
          }}
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>0.00 {thresholds.unit}</span>
          <span>{thresholds.dryThreshold.toFixed(2)}</span>
          <span>{thresholds.shallowThreshold.toFixed(2)}</span>
          <span>{thresholds.moderateThreshold.toFixed(2)}</span>
          <span>Peak: {maxDepthInFrame.toFixed(2)} {thresholds.unit}</span>
        </div>
      </div>

      {/* Discrete interval cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-lg ${item.colorBg} flex flex-col justify-between transition-all hover:border-slate-600`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0 border border-slate-700/50 shadow-sm"
                style={{ backgroundColor: item.indicatorColor }}
              />
              <span className="text-xs font-medium text-slate-200 leading-tight">
                {item.label}
              </span>
            </div>
            <div className="text-[11px] font-mono text-cyan-300 font-medium">
              {item.range}
            </div>
            <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
              {item.description}
            </div>
          </div>
        ))}
      </div>

      {/* Explicit regulatory disclaimer note */}
      <div className="flex items-start gap-2 bg-slate-950/60 border border-amber-900/30 p-2 rounded-lg text-[11px] text-amber-200/80 leading-normal">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
        <span>
          <strong className="text-amber-300">Notice: </strong>
          {thresholds.disclaimer}
        </span>
      </div>
    </div>
  );
};
