'use client';

import React from 'react';
import {
  LayerSettings,
  TerrainViewMode,
  ColormapPalette,
  ElevationStats
} from '../types/terrain';
import {
  Layers,
  Palette,
  Eye,
  Grid,
  TrendingUp,
  Waves,
  Sun,
  Activity,
  Maximize2
} from 'lucide-react';

interface TerrainLayerControlsProps {
  settings: LayerSettings;
  onChange: (settings: LayerSettings) => void;
  elevStats: ElevationStats;
  submergedPercentage: number;
}

export const TerrainLayerControls: React.FC<TerrainLayerControlsProps> = ({
  settings,
  onChange,
  elevStats,
  submergedPercentage
}) => {
  const updateSetting = <K extends keyof LayerSettings>(key: K, value: LayerSettings[K]) => {
    onChange({
      ...settings,
      [key]: value
    });
  };

  const viewModes: Array<{ id: TerrainViewMode; label: string; icon: React.ReactNode }> = [
    { id: 'hybrid', label: 'Hybrid 3D', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'elevation', label: 'Elevation', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'slope', label: 'Slope Gradient', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'drainage', label: 'Drainage Flow', icon: <Waves className="w-3.5 h-3.5" /> },
    { id: 'floodHazard', label: 'Flood Hazard', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'hillshade', label: 'Hillshade', icon: <Sun className="w-3.5 h-3.5" /> }
  ];

  const colormaps: Array<{ id: ColormapPalette; label: string }> = [
    { id: 'hypsometric', label: 'Hypsometric' },
    { id: 'terrain', label: 'Natural Terrain' },
    { id: 'viridis', label: 'Viridis' },
    { id: 'magma', label: 'Magma' },
    { id: 'plasma', label: 'Plasma' }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 backdrop-blur-md shadow-xl text-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-200">Layer & Visual Controls</span>
        </div>
        <span className="text-[10px] font-mono text-cyan-400">Interactive</span>
      </div>

      {/* 1. Base Layer View Mode */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
          Surface Representation
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {viewModes.map(mode => (
            <button
              key={mode.id}
              onClick={() => updateSetting('viewMode', mode.id)}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-medium transition-all text-[11px] ${
                settings.viewMode === mode.id
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-950'
                  : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {mode.icon}
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Colormap Palette (for elevation & hybrid) */}
      {(settings.viewMode === 'elevation' || settings.viewMode === 'hybrid') && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>Colormap Palette</span>
            </label>
            <span className="font-mono text-[10px] text-slate-400 capitalize">
              {settings.colormap}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {colormaps.map(cmap => (
              <button
                key={cmap.id}
                onClick={() => updateSetting('colormap', cmap.id)}
                className={`px-2 py-1 rounded text-[10px] font-medium border transition-all ${
                  settings.colormap === cmap.id
                    ? 'bg-purple-900/70 border-purple-400 text-purple-200'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cmap.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Topographic Overlays */}
      <div className="space-y-2 pt-1 border-t border-slate-800/80">
        <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
          Overlays & Features
        </label>

        <div className="grid grid-cols-2 gap-2">
          {/* Wireframe toggle */}
          <button
            onClick={() => updateSetting('wireframe', !settings.wireframe)}
            className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
              settings.wireframe
                ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-indigo-400" />
              <span>3D Mesh Grid</span>
            </span>
            <span className="font-mono text-[10px]">{settings.wireframe ? 'ON' : 'OFF'}</span>
          </button>

          {/* Contour Lines toggle */}
          <button
            onClick={() => updateSetting('showContours', !settings.showContours)}
            className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
              settings.showContours
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Contour Lines</span>
            </span>
            <span className="font-mono text-[10px]">{settings.showContours ? 'ON' : 'OFF'}</span>
          </button>

          {/* Drainage Streams toggle */}
          <button
            onClick={() => updateSetting('showStreams', !settings.showStreams)}
            className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
              settings.showStreams
                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
              <span>River Network</span>
            </span>
            <span className="font-mono text-[10px]">{settings.showStreams ? 'ON' : 'OFF'}</span>
          </button>

          {/* Ground Coordinate Grid */}
          <button
            onClick={() => updateSetting('showGrid', !settings.showGrid)}
            className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
              settings.showGrid
                ? 'bg-blue-950/80 border-blue-500 text-blue-200'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Spatial Bounds</span>
            </span>
            <span className="font-mono text-[10px]">{settings.showGrid ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* 4. Vertical Exaggeration Slider */}
      <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
            Vertical Exaggeration
          </label>
          <span className="font-mono font-bold text-cyan-400 text-xs">
            {settings.verticalExaggeration.toFixed(1)}x
          </span>
        </div>
        <input
          type="range"
          min="0.5"
          max="4.0"
          step="0.1"
          value={settings.verticalExaggeration}
          onChange={e => updateSetting('verticalExaggeration', parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>0.5x (Subdued)</span>
          <span>1.0x (True Scale)</span>
          <span>4.0x (Enhanced)</span>
        </div>
      </div>

      {/* 5. Interactive Flood Water Simulation Plane */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80 bg-blue-950/30 p-3 rounded-xl border border-blue-900/50">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
            <Waves className="w-3.5 h-3.5 text-blue-400" />
            <span>Flood Level Simulation Plane</span>
          </label>
          <button
            onClick={() => updateSetting('showWaterPlane', !settings.showWaterPlane)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
              settings.showWaterPlane
                ? 'bg-blue-600 text-white border-blue-400'
                : 'bg-slate-900 text-slate-400 border-slate-700'
            }`}
          >
            {settings.showWaterPlane ? 'ACTIVE' : 'DISABLED'}
          </button>
        </div>

        {settings.showWaterPlane && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-slate-300">Simulated Water Elevation:</span>
              <span className="font-bold text-blue-300">{Math.round(settings.waterLevel)} m</span>
            </div>

            <input
              type="range"
              min={Math.floor(elevStats.min)}
              max={Math.ceil(elevStats.max)}
              step="1"
              value={settings.waterLevel}
              onChange={e => updateSetting('waterLevel', parseFloat(e.target.value))}
              className="w-full h-2 bg-blue-950 rounded-lg appearance-none cursor-pointer accent-blue-400 border border-blue-800"
            />

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Min: {Math.round(elevStats.min)}m</span>
              <span className="text-blue-400 font-semibold">
                Inundated: {submergedPercentage.toFixed(1)}% of terrain
              </span>
              <span>Max: {Math.round(elevStats.max)}m</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
