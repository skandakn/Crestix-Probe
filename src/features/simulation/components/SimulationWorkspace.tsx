"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  SimulationRunRequest,
  TerrainPreset,
  DepthThresholdConfig,
  DEFAULT_DEPTH_THRESHOLDS,
  SimulationFrame,
} from "../types/contract";
import { TERRAIN_PRESETS } from "../data/terrain-presets";
import { MockSimulationApiAdapter } from "../api/mock-adapter";
import { HttpSimulationApiAdapter } from "../api/http-adapter";
import { ISimulationApiAdapter } from "../api/adapter-interface";
import { TerrainSelector } from "./TerrainSelector";
import { ParameterControls } from "./ParameterControls";
import { FloodGridCanvas, SelectedCellInfo } from "./FloodGridCanvas";
import { ColorLegend } from "./ColorLegend";
import { TimelineSlider } from "./TimelineSlider";
import { PlaybackControls } from "./PlaybackControls";
import { ConfigurationSummary } from "./ConfigurationSummary";
import { ThresholdConfigModal } from "./ThresholdConfigModal";
import { CellInspectorModal } from "./CellInspectorModal";
import { useSimulationPlayback } from "../hooks/useSimulationPlayback";
import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  Waves,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

export const SimulationWorkspace: React.FC = () => {
  // Active terrain preset
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainPreset>(TERRAIN_PRESETS[0]);

  // Adapter instances
  const mockAdapter = useMemo(() => new MockSimulationApiAdapter(), []);
  const httpAdapter = useMemo(() => new HttpSimulationApiAdapter(), []);
  const [activeAdapterType, setActiveAdapterType] = useState<"mock" | "http">("mock");
  const [adapterHealthMessage, setAdapterHealthMessage] = useState<string>("");

  // Simulation run parameters
  const [config, setConfig] = useState<SimulationRunRequest>({
    terrainId: TERRAIN_PRESETS[0].id,
    gridDimensions: {
      rows: TERRAIN_PRESETS[0].rows,
      cols: TERRAIN_PRESETS[0].cols,
      cellSizeMeters: TERRAIN_PRESETS[0].cellSizeMeters,
    },
    elevationGrid: TERRAIN_PRESETS[0].elevationGrid,
    rainfall: {
      intensityMmPerHour: TERRAIN_PRESETS[0].suggestedRainfallMmPerHour,
      durationMinutes: TERRAIN_PRESETS[0].suggestedDurationMinutes,
    },
    initialWaterDepthMeters: 0.0,
    surfaceRoughnessManning: TERRAIN_PRESETS[0].defaultRoughness,
    boundaryConditions: {
      north: "closed",
      south: "open",
      east: "closed",
      west: "closed",
    },
    timeStepSeconds: 30,
    totalDurationMinutes: 120,
  });

  // Thresholds state
  const [thresholds, setThresholds] = useState<DepthThresholdConfig>(DEFAULT_DEPTH_THRESHOLDS);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState<boolean>(false);

  // Simulation Execution State
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Frames data
  const [frames, setFrames] = useState<SimulationFrame[]>([]);
  const [selectedCell, setSelectedCell] = useState<SelectedCellInfo | null>(null);

  // Playback hook
  const {
    currentFrameIndex,
    currentFrame,
    totalFrames,
    isPlaying,
    playbackSpeed,
    isLooping,
    play,
    pause,
    togglePlay,
    reset,
    stepForward,
    stepBackward,
    seekToFrame,
    setPlaybackSpeed,
    setIsLooping,
  } = useSimulationPlayback({
    frames,
    defaultSpeed: 1,
    loop: false,
  });

  // Get active adapter
  const currentAdapter: ISimulationApiAdapter = activeAdapterType === "mock" ? mockAdapter : httpAdapter;

  // Check health on mount or adapter toggle
  const checkAdapterHealth = useCallback(async (type: "mock" | "http") => {
    const adapter = type === "mock" ? mockAdapter : httpAdapter;
    try {
      const res = await adapter.checkHealth();
      setAdapterHealthMessage(res.message);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setAdapterHealthMessage(`Health check failed: ${msg}`);
    }
  }, [mockAdapter, httpAdapter]);

  useEffect(() => {
    checkAdapterHealth(activeAdapterType);
  }, [activeAdapterType, checkAdapterHealth]);

  // Handle Terrain Preset Change
  const handleSelectTerrain = (preset: TerrainPreset) => {
    setSelectedTerrain(preset);
    setConfig((prev) => ({
      ...prev,
      terrainId: preset.id,
      gridDimensions: {
        rows: preset.rows,
        cols: preset.cols,
        cellSizeMeters: preset.cellSizeMeters,
      },
      elevationGrid: preset.elevationGrid,
      surfaceRoughnessManning: preset.defaultRoughness,
      rainfall: {
        intensityMmPerHour: preset.suggestedRainfallMmPerHour,
        durationMinutes: preset.suggestedDurationMinutes,
      },
    }));
    // Reset any previously computed frames
    setFrames([]);
    setSimulationId(null);
    setStatus("idle");
    setSelectedCell(null);
  };

  // Launch Simulation
  const handleLaunchSimulation = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessNotice(null);
    setStatus("running");

    try {
      const runResponse = await currentAdapter.runSimulation(config);
      setSimulationId(runResponse.simulationId);

      // Fetch generated frames
      const framesResponse = await currentAdapter.getSimulationFrames(runResponse.simulationId);
      setFrames(framesResponse.frames);
      setStatus("completed");
      setSuccessNotice(
        `Simulation #${runResponse.simulationId.slice(0, 10)} computed successfully with ${framesResponse.frames.length} time-steps.`
      );
      // Automatically begin playback preview
      setTimeout(() => {
        play();
      }, 200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus("failed");
      setErrorMessage(
        activeAdapterType === "http"
          ? `${msg} — Ensure Member 9 backend server is running or switch to "Deterministic Mock Engine".`
          : msg
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Simulation
  const handleResetSimulation = () => {
    reset();
    setFrames([]);
    setSimulationId(null);
    setStatus("idle");
    setErrorMessage(null);
    setSuccessNotice(null);
    setSelectedCell(null);
  };

  return (
    <div className="w-full max-w-[1480px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-800">
              CRESTIX PROBE
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs font-semibold text-slate-400">Member 5 Workspace</span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-amber-400/90 font-mono">2D Shallow-Water Visualization</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Waves className="w-7 h-7 text-cyan-400" />
            Flood Simulation Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Configure dynamic rainfall events, terrain topography, and hydraulic roughness to explore
            2D hydrodynamic floodwater propagation in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">Status:</span>
            <span
              className={`font-bold uppercase tracking-wider text-[11px] ${
                status === "completed"
                  ? "text-emerald-400"
                  : status === "running"
                  ? "text-cyan-400 animate-pulse"
                  : status === "failed"
                  ? "text-red-400"
                  : "text-slate-400"
              }`}
            >
              {status}
            </span>
          </div>

          <button
            type="button"
            onClick={() => checkAdapterHealth(activeAdapterType)}
            className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 px-3 py-2 rounded-xl text-xs border border-slate-700/60 transition-colors"
            title="Refresh adapter connection check"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check Adapter</span>
          </button>
        </div>
      </div>

      {/* Error & Success Notice Banners */}
      {errorMessage && (
        <div className="p-4 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-start gap-3 shadow-lg animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-semibold block text-red-300">Simulation Execution Error</strong>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {successNotice && (
        <div className="p-3.5 bg-emerald-950/50 border border-emerald-800/70 rounded-xl text-xs text-emerald-200 flex items-center justify-between gap-3 shadow-md animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-400 hover:text-emerald-300 text-xs underline font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Simulation Layout: Left Controls, Right Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Terrain & Hydraulic Parameters (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Terrain Preset Selector */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-xl backdrop-blur-md">
            <TerrainSelector
              selectedTerrainId={selectedTerrain.id}
              onSelectTerrain={handleSelectTerrain}
              disabled={isLoading || isPlaying}
            />
          </div>

          {/* Dynamic Hydraulic Parameter Controls */}
          <ParameterControls
            config={config}
            onChangeConfig={setConfig}
            onStartSimulation={handleLaunchSimulation}
            onResetSimulation={handleResetSimulation}
            isLoading={isLoading}
            activeAdapterType={activeAdapterType}
            onToggleAdapter={(t) => setActiveAdapterType(t)}
            adapterHealthMessage={adapterHealthMessage}
            hasFrames={frames.length > 0}
          />
        </div>

        {/* Right Column: Visualization Stage, Color Legend, Scrubber (7 columns) */}
        <div className="lg:col-span-7 space-y-4">
          {/* 2D Canvas Visualizer */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
            <FloodGridCanvas
              elevationGrid={config.elevationGrid || selectedTerrain.elevationGrid}
              currentFrame={currentFrame}
              thresholds={thresholds}
              cellSizeMeters={config.gridDimensions.cellSizeMeters}
              onSelectCell={(cell) => setSelectedCell(cell)}
              selectedCell={selectedCell ? { r: selectedCell.r, c: selectedCell.c } : null}
            />
          </div>

          {/* Color Legend with Configurable Thresholds */}
          <ColorLegend
            thresholds={thresholds}
            onOpenSettings={() => setIsThresholdModalOpen(true)}
            maxDepthInFrame={currentFrame?.maxDepthMeters || 0}
          />

          {/* Playback Controls (Play, Pause, Resume, Reset, Speed) */}
          <PlaybackControls
            isPlaying={isPlaying}
            totalFrames={totalFrames}
            currentFrameIndex={currentFrameIndex}
            playbackSpeed={playbackSpeed}
            isLooping={isLooping}
            onTogglePlay={togglePlay}
            onReset={reset}
            onStepForward={stepForward}
            onStepBackward={stepBackward}
            onChangeSpeed={setPlaybackSpeed}
            onToggleLoop={() => setIsLooping(!isLooping)}
            disabled={isLoading}
          />

          {/* Timeline Scrubber */}
          <TimelineSlider
            currentFrameIndex={currentFrameIndex}
            totalFrames={totalFrames}
            currentFrame={currentFrame}
            rainfallDurationMinutes={config.rainfall.durationMinutes}
            timeStepSeconds={config.timeStepSeconds}
            onSeek={seekToFrame}
          />
        </div>
      </div>

      {/* Configuration Summary Card */}
      <ConfigurationSummary
        config={config}
        adapterType={activeAdapterType}
        simulationId={simulationId}
        status={status}
      />

      {/* Modal Dialogs */}
      <ThresholdConfigModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        currentThresholds={thresholds}
        onSave={(newThresh) => setThresholds(newThresh)}
      />

      <CellInspectorModal
        selectedCell={selectedCell}
        onClose={() => setSelectedCell(null)}
        frames={frames}
        thresholds={thresholds}
        timeStepSeconds={config.timeStepSeconds}
      />
    </div>
  );
};
