"use client";

import React from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Repeat,
  FastForward,
} from "lucide-react";

interface PlaybackControlsProps {
  isPlaying: boolean;
  totalFrames: number;
  currentFrameIndex: number;
  playbackSpeed: number;
  isLooping: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onChangeSpeed: (speed: number) => void;
  onToggleLoop: () => void;
  disabled?: boolean;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  totalFrames,
  currentFrameIndex,
  playbackSpeed,
  isLooping,
  onTogglePlay,
  onReset,
  onStepForward,
  onStepBackward,
  onChangeSpeed,
  onToggleLoop,
  disabled = false,
}) => {
  const speeds = [0.5, 1, 2, 4];
  const canControl = totalFrames > 0 && !disabled;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg backdrop-blur-md">
      {/* Primary Transportation Buttons */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onReset}
          disabled={!canControl}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
          title="Reset to frame 0"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onStepBackward}
          disabled={!canControl || currentFrameIndex <= 0}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
          title="Step 1 frame backward"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onTogglePlay}
          disabled={!canControl}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-xs transition-all ${
            isPlaying
              ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-950/40"
              : "bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-md shadow-cyan-950/40"
          } disabled:opacity-40`}
          title={isPlaying ? "Pause simulation" : "Play simulation"}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-slate-950" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Play Animation</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onStepForward}
          disabled={!canControl || currentFrameIndex >= totalFrames - 1}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
          title="Step 1 frame forward"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Speed & Loop settings */}
      <div className="flex items-center gap-2">
        {/* Speed Selector */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <FastForward className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1" />
          {speeds.map((s) => (
            <button
              key={s}
              type="button"
              disabled={!canControl}
              onClick={() => onChangeSpeed(s)}
              className={`px-2 py-0.5 rounded text-xs font-mono font-medium transition-colors ${
                playbackSpeed === s
                  ? "bg-cyan-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Loop Toggle */}
        <button
          type="button"
          disabled={!canControl}
          onClick={onToggleLoop}
          className={`p-2 rounded-lg border transition-colors ${
            isLooping
              ? "bg-cyan-950 text-cyan-300 border-cyan-800"
              : "bg-slate-800/80 text-slate-400 border-slate-800 hover:text-slate-200"
          } disabled:opacity-40`}
          title={isLooping ? "Loop enabled" : "Loop disabled"}
        >
          <Repeat className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
