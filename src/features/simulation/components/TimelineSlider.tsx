"use client";

import React from "react";
import { SimulationFrame } from "../types/contract";
import { Clock, CloudRain, Flame } from "lucide-react";

interface TimelineSliderProps {
  currentFrameIndex: number;
  totalFrames: number;
  currentFrame: SimulationFrame | null;
  rainfallDurationMinutes: number;
  timeStepSeconds: number;
  onSeek: (frameIndex: number) => void;
}

export const TimelineSlider: React.FC<TimelineSliderProps> = ({
  currentFrameIndex,
  totalFrames,
  currentFrame,
  rainfallDurationMinutes,
  timeStepSeconds,
  onSeek,
}) => {
  if (totalFrames <= 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-center text-xs text-slate-500">
        Run a simulation to unlock timeline scrubber and time-step playback.
      </div>
    );
  }

  // Format seconds to HH:MM:SS or MM:SS
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = Math.floor(totalSec % 60);
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}h ${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
    }
    return `${mins.toString().padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
  };

  const currentSeconds = currentFrame ? currentFrame.timeSeconds : currentFrameIndex * timeStepSeconds;
  const totalDurationSeconds = (totalFrames - 1) * timeStepSeconds;
  const rainfallEndSeconds = rainfallDurationMinutes * 60;
  const isRainActive = currentSeconds <= rainfallEndSeconds;

  // Percentage of rainfall window along timeline
  const rainfallPercent = Math.min(100, (rainfallEndSeconds / Math.max(1, totalDurationSeconds)) * 100);
  const currentProgressPercent = totalFrames > 1 ? (currentFrameIndex / (totalFrames - 1)) * 100 : 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3 backdrop-blur-md shadow-lg">
      {/* Time & Phase Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-200">Simulation Time-Step:</span>
          <span className="font-mono text-cyan-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {formatTime(currentSeconds)}
          </span>
          <span className="text-slate-500 text-[11px] font-mono">
            / {formatTime(totalDurationSeconds)}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-slate-400">Step:</span>
          <span className="text-slate-200 font-bold">
            {currentFrameIndex + 1}
          </span>
          <span className="text-slate-500">/ {totalFrames}</span>

          {/* Rain / Recession indicator badge */}
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-medium uppercase tracking-wider border ${
              isRainActive
                ? "bg-sky-950/80 text-sky-300 border-sky-800/80 animate-pulse"
                : "bg-emerald-950/80 text-emerald-300 border-emerald-800/80"
            }`}
          >
            {isRainActive ? (
              <>
                <CloudRain className="w-3 h-3 text-sky-400" />
                <span>Precipitation Phase</span>
              </>
            ) : (
              <>
                <Flame className="w-3 h-3 text-emerald-400" />
                <span>Recession / Redistribution</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scrub bar container with rainfall indicator bar below */}
      <div className="space-y-1 relative">
        {/* Rainfall Active Marker region */}
        <div className="h-1.5 w-full bg-slate-950 rounded-full relative overflow-hidden border border-slate-800">
          <div
            className="h-full bg-cyan-700/60"
            style={{ width: `${rainfallPercent}%` }}
            title={`Active Rainfall Window: First ${rainfallDurationMinutes} minutes`}
          />
        </div>

        {/* Interactive Scrub Slider */}
        <input
          type="range"
          min={0}
          max={totalFrames - 1}
          value={currentFrameIndex}
          onChange={(e) => onSeek(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300"
        />

        {/* Milestone labels */}
        <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-0.5">
          <span>T+00:00 (Init)</span>
          <span className="text-cyan-400">Rainfall Ends ({rainfallDurationMinutes}m)</span>
          <span>End ({formatTime(totalDurationSeconds)})</span>
        </div>
      </div>

      {/* Current Frame Instant Statistics */}
      {currentFrame && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800/80 text-[11px] font-mono">
          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
            <span className="text-slate-400 block text-[10px]">Peak Water Depth</span>
            <span className="text-cyan-300 font-bold text-xs">
              {currentFrame.maxDepthMeters.toFixed(3)} m
            </span>
          </div>

          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
            <span className="text-slate-400 block text-[10px]">Avg Water Depth</span>
            <span className="text-blue-300 font-bold text-xs">
              {currentFrame.avgDepthMeters.toFixed(3)} m
            </span>
          </div>

          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
            <span className="text-slate-400 block text-[10px]">Inundated Cells</span>
            <span className="text-amber-300 font-bold text-xs">
              {currentFrame.floodedCellCount} cells
            </span>
          </div>

          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
            <span className="text-slate-400 block text-[10px]">Total Stored Volume</span>
            <span className="text-emerald-300 font-bold text-xs">
              {currentFrame.totalWaterVolumeM3.toLocaleString()} m³
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
