'use client';

import React from 'react';
import { ForecastFrame } from '../types/forecast';
import { Play, Pause, SkipBack, SkipForward, FastForward, Clock, Activity } from 'lucide-react';

interface ForecastTimelineProps {
  frames: ForecastFrame[];
  currentFrameIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onPlayPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onSeek: (index: number) => void;
  onSpeedChange: (speed: number) => void;
  disabled?: boolean;
}

export const ForecastTimeline: React.FC<ForecastTimelineProps> = ({
  frames,
  currentFrameIndex,
  isPlaying,
  playbackSpeed,
  onPlayPause,
  onStepForward,
  onStepBackward,
  onSeek,
  onSpeedChange,
  disabled = false
}) => {
  const currentFrame = frames[currentFrameIndex] || frames[0];
  const totalFrames = frames.length;

  if (totalFrames === 0) return null;

  // Compute normalized hydrograph peak for sparkline
  const maxInflow = Math.max(...frames.map((f) => f.inflowM3s), 1);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
      {/* Top Bar: Simulation Time & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
              <span>FORECAST TIMELINE HORIZON</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400 font-bold">
                Frame {currentFrameIndex + 1} of {totalFrames}
              </span>
            </div>
            <div className="text-base font-mono font-bold text-slate-100 flex items-center gap-2">
              <span>T+{currentFrame?.simulationHour.toFixed(2)}h</span>
              <span className="text-xs font-normal text-slate-400">
                ({currentFrame?.timestepMinutes * currentFrameIndex} min elapsed)
              </span>
            </div>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1">
          <button
            type="button"
            disabled={disabled || currentFrameIndex === 0}
            onClick={onStepBackward}
            title="Step Backward"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded disabled:opacity-40 cursor-pointer"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={onPlayPause}
            title={isPlaying ? 'Pause' : 'Play Timeline'}
            className="p-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded shadow-md transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>

          <button
            type="button"
            disabled={disabled || currentFrameIndex >= totalFrames - 1}
            onClick={onStepForward}
            title="Step Forward"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded disabled:opacity-40 cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Speed Selector */}
          <div className="flex items-center gap-0.5">
            {[0.5, 1, 2, 4].map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => onSpeedChange(speed)}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors cursor-pointer ${
                  playbackSpeed === speed
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hydrograph Inflow Sparkline with Scrubber */}
      <div className="relative pt-2 pb-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-400" />
            Catchment Inflow Hydrograph (m³/s)
          </span>
          <span className="text-cyan-300 font-bold">
            Q = {currentFrame?.inflowM3s.toLocaleString()} m³/s
          </span>
        </div>

        {/* SVG Sparkline */}
        <div className="h-10 w-full relative bg-slate-950/70 border border-slate-800/80 rounded-md overflow-hidden">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${totalFrames} 100`}>
            {/* Hydrograph Area */}
            <path
              d={`M 0 100 ${frames
                .map((f, i) => `L ${i} ${100 - (f.inflowM3s / maxInflow) * 85}`)
                .join(' ')} L ${totalFrames - 1} 100 Z`}
              fill="rgba(6, 182, 212, 0.15)"
            />
            {/* Hydrograph Line */}
            <path
              d={`M 0 ${100 - (frames[0]?.inflowM3s / maxInflow) * 85} ${frames
                .map((f, i) => `L ${i} ${100 - (f.inflowM3s / maxInflow) * 85}`)
                .join(' ')}`}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Current Timeline Scrubber Cursor */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 shadow-md shadow-rose-500/50 pointer-events-none transition-all duration-75"
            style={{ left: `${(currentFrameIndex / (totalFrames - 1)) * 100}%` }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1 -mt-0.5 border border-white" />
          </div>
        </div>

        {/* Interactive Range Input Scrubber */}
        <input
          type="range"
          min={0}
          max={totalFrames - 1}
          value={currentFrameIndex}
          disabled={disabled}
          onChange={(e) => onSeek(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-2"
        />

        {/* Start / Mid / End time labels */}
        <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
          <span>T+0.00h (Inflow Arrival)</span>
          <span>Peak Surge (~T+{(frames[Math.floor(totalFrames * 0.3)]?.simulationHour ?? 0).toFixed(1)}h)</span>
          <span>T+{frames[totalFrames - 1]?.simulationHour.toFixed(1)}h (Horizon End)</span>
        </div>
      </div>
    </div>
  );
};
