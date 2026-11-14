'use client';

import React, { useState } from 'react';
import { useForecast } from '../hooks/use-forecast';
import { useForecastPlayback } from '../hooks/use-forecast-playback';
import { useModelComparison } from '../hooks/use-model-comparison';
import { AI_MODELS } from '../utils/physics';

import { ModelSelector } from './model-selector';
import { ScenarioSummary } from './scenario-summary';
import { HorizonSelector } from './horizon-selector';
import { ForecastInitiation } from './forecast-initiation';
import { WaterDepthMap } from './water-depth-map';
import { VelocityMap } from './velocity-map';
import { ForecastTimeline } from './forecast-timeline';
import { ForecastMetadataCard } from './forecast-metadata-card';
import { ModelComparisonView } from './model-comparison-view';
import { MockDataBanner, MockDataBadge } from './mock-badge';
import { ForecastingLoadingState, ForecastingEmptyState } from './empty-and-loading-states';

import { Layers, BarChart3, Waves, Wind, Compass, Sparkles, RefreshCw } from 'lucide-react';

export const ForecastingWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'workspace' | 'comparison'>('workspace');
  const [mapViewMode, setMapViewMode] = useState<'both' | 'depth' | 'velocity'>('both');

  const {
    modelId,
    setModelId,
    scenarioId,
    setScenarioId,
    horizonHours,
    setHorizonHours,
    forecastRecord,
    isLoading,
    loadingStep,
    error,
    runForecast
  } = useForecast('pino-swe', 'krishna-inflow-surge');

  const frames = forecastRecord?.frames || [];
  const {
    currentFrame,
    currentFrameIndex,
    isPlaying,
    playbackSpeed,
    togglePlay,
    stepForward,
    stepBackward,
    seek,
    setPlaybackSpeed
  } = useForecastPlayback(frames);

  const { comparisons, isLoading: isComparisonLoading } = useModelComparison(scenarioId);

  const currentModel = AI_MODELS.find((m) => m.id === modelId) || AI_MODELS[2];
  const isMock = forecastRecord?.metadata.isMock ?? true;

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Application Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-950/50">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-mono font-bold tracking-tight text-white flex items-center gap-1.5">
                  CRESTIX PROBE <span className="text-cyan-400 font-normal">/ FORECASTING</span>
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                  MEMBER 6: AI HYDRODYNAMICS
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Physics-Informed Neural Operator (PINO) & Fourier Neural Operator Inundation Engine
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <MockDataBadge isMock={isMock} dataSource={forecastRecord?.metadata.dataSource} size="md" />

            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs font-mono w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('workspace')}
                className={`flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer touch-manipulation ${
                  activeTab === 'workspace'
                    ? 'bg-cyan-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="truncate">Simulation Studio</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('comparison')}
                className={`flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer touch-manipulation ${
                  activeTab === 'comparison'
                    ? 'bg-cyan-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="truncate">Benchmark</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* Transparency Banner */}
        <MockDataBanner isMock={isMock} />

        {error && (
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs font-mono">
            <strong>Error:</strong> {error}
          </div>
        )}

        {activeTab === 'workspace' ? (
          <div className="space-y-6">
            {/* Control Deck: Models, Scenarios & Horizons */}
            <section className="space-y-4">
              <ModelSelector
                selectedModelId={modelId}
                onSelectModel={setModelId}
                disabled={isLoading}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <ScenarioSummary
                    selectedScenarioId={scenarioId}
                    onSelectScenario={setScenarioId}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <HorizonSelector
                    selectedHorizon={horizonHours}
                    onSelectHorizon={setHorizonHours}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <ForecastInitiation
                onRunForecast={runForecast}
                isLoading={isLoading}
                loadingStep={loadingStep}
                selectedModelId={modelId}
                inferenceDurationMs={forecastRecord?.metrics.inferenceDurationMs}
                disabled={isLoading}
              />
            </section>

            {/* Display Visualizer Stage */}
            {isLoading ? (
              <ForecastingLoadingState currentStep={loadingStep} modelName={currentModel.name} />
            ) : !forecastRecord ? (
              <ForecastingEmptyState onInitiateClick={() => runForecast()} />
            ) : (
              <section className="space-y-6">
                {/* Visualizer Mode Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                      Dynamic Hydrodynamic Visualizer
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      (Frame {currentFrameIndex + 1}/{frames.length})
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-[11px] font-mono overflow-x-auto max-w-full">
                    <button
                      type="button"
                      onClick={() => setMapViewMode('both')}
                      className={`px-2 py-1 rounded cursor-pointer whitespace-nowrap touch-manipulation ${
                        mapViewMode === 'both' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                      }`}
                    >
                      Dual Maps
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapViewMode('depth')}
                      className={`px-2 py-1 rounded cursor-pointer whitespace-nowrap touch-manipulation ${
                        mapViewMode === 'depth' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                      }`}
                    >
                      Depth Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapViewMode('velocity')}
                      className={`px-2 py-1 rounded cursor-pointer whitespace-nowrap touch-manipulation ${
                        mapViewMode === 'velocity' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                      }`}
                    >
                      Velocity Only
                    </button>
                  </div>
                </div>

                {/* 2D Canvas Heatmaps */}
                <div
                  className={`grid gap-4 ${
                    mapViewMode === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
                  }`}
                >
                  {(mapViewMode === 'both' || mapViewMode === 'depth') && (
                    <WaterDepthMap
                      currentFrame={currentFrame}
                      isMock={isMock}
                      modelName={currentModel.shortName}
                    />
                  )}

                  {(mapViewMode === 'both' || mapViewMode === 'velocity') && (
                    <VelocityMap
                      currentFrame={currentFrame}
                      isMock={isMock}
                      supportsVelocity={currentModel.supportsVelocity}
                      modelName={currentModel.shortName}
                    />
                  )}
                </div>

                {/* Multi-Step Timeline Controller */}
                <ForecastTimeline
                  frames={frames}
                  currentFrameIndex={currentFrameIndex}
                  isPlaying={isPlaying}
                  playbackSpeed={playbackSpeed}
                  onPlayPause={togglePlay}
                  onStepForward={stepForward}
                  onStepBackward={stepBackward}
                  onSeek={seek}
                  onSpeedChange={setPlaybackSpeed}
                  disabled={isLoading || frames.length === 0}
                />

                {/* Telemetry and Metadata */}
                <ForecastMetadataCard
                  metadata={forecastRecord.metadata}
                  metrics={forecastRecord.metrics}
                  summary={forecastRecord.summary}
                />
              </section>
            )}
          </div>
        ) : (
          /* Benchmark Comparison View */
          <ModelComparisonView
            comparisons={comparisons}
            isMock={isMock}
            selectedModelId={modelId}
            onSelectModel={(id) => {
              setModelId(id);
              setActiveTab('workspace');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 px-4 py-4 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CRESTIX PROBE • Scientific AI Flood Forecasting System • Member 6 Module</span>
          <span>Integrated API Adapter Ready for Member 9 PyTorch Inference Service</span>
        </div>
      </footer>
    </div>
  );
};

