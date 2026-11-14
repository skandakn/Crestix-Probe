'use client';

import React from 'react';
import { ProcessedDEMData } from '../types/terrain';
import {
  FileText,
  MapPin,
  Mountain,
  TrendingUp,
  Waves,
  ShieldCheck,
  Download,
  Share2
} from 'lucide-react';

interface TerrainMetadataPanelProps {
  dem: ProcessedDEMData;
  onOpenMember9Modal: () => void;
}

export const TerrainMetadataPanel: React.FC<TerrainMetadataPanelProps> = ({
  dem,
  onOpenMember9Modal
}) => {
  const { metadata, stats } = dem;
  const totalCells = metadata.width * metadata.height;
  const areaKm2 = ((totalCells * metadata.cellSize * metadata.cellSize) / 1_000_000).toFixed(2);

  const handleDownloadGeoJSON = () => {
    const geojson = {
      type: 'FeatureCollection',
      properties: {
        datasetId: metadata.id,
        name: metadata.name,
        format: metadata.format,
        cellSizeMeters: metadata.cellSize,
        elevationStats: stats.elevation,
        slopeStats: stats.slope,
        drainageStats: stats.drainage
      },
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [metadata.bounds.west, metadata.bounds.south],
                [metadata.bounds.east, metadata.bounds.south],
                [metadata.bounds.east, metadata.bounds.north],
                [metadata.bounds.west, metadata.bounds.north],
                [metadata.bounds.west, metadata.bounds.south]
              ]
            ]
          },
          properties: {
            description: 'Terrain Bounding Box'
          }
        }
      ]
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: 'application/geo+json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.id}-bounds.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 backdrop-blur-md shadow-xl text-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-200">Terrain Metadata & Hydro-Metrics</span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
          {metadata.format}
        </span>
      </div>

      {/* Dataset Summary */}
      <div className="space-y-1">
        <h4 className="font-semibold text-slate-100 text-sm">{metadata.name}</h4>
        <p className="text-slate-400 text-[11px] leading-relaxed">{metadata.description}</p>
      </div>

      {/* Spatial Reference Card */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 space-y-1.5 font-mono text-[11px]">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>CRS:</span>
          </span>
          <span className="text-slate-200">{metadata.crs}</span>
        </div>

        <div className="flex items-center justify-between text-slate-400">
          <span>Grid Dimensions:</span>
          <span className="text-slate-200">
            {metadata.width} × {metadata.height} ({totalCells.toLocaleString()} cells)
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-400">
          <span>Cell Resolution:</span>
          <span className="text-cyan-400 font-semibold">{metadata.cellSize}m / cell</span>
        </div>

        <div className="flex items-center justify-between text-slate-400">
          <span>Total Spatial Area:</span>
          <span className="text-slate-200">{areaKm2} km²</span>
        </div>

        <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/60 text-[10px]">
          <span>Bounds (W, S, E, N):</span>
          <span className="text-slate-300 truncate max-w-[200px]">
            {metadata.bounds.west.toFixed(3)}, {metadata.bounds.south.toFixed(3)} to{' '}
            {metadata.bounds.east.toFixed(3)}, {metadata.bounds.north.toFixed(3)}
          </span>
        </div>
      </div>

      {/* Hydro-Topographic Statistics */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
          Topographic & Hydro Statistics
        </label>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {/* Elevation summary */}
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2 space-y-1">
            <div className="flex items-center gap-1 font-semibold text-cyan-300 text-[11px]">
              <Mountain className="w-3.5 h-3.5" />
              <span>Elevation Range</span>
            </div>
            <div className="flex justify-between text-slate-400 font-mono">
              <span>Min / Max:</span>
              <span className="text-slate-200 font-bold">
                {stats.elevation.min}m / {stats.elevation.max}m
              </span>
            </div>
            <div className="flex justify-between text-slate-400 font-mono">
              <span>Mean ± Std:</span>
              <span>
                {stats.elevation.mean}m ± {stats.elevation.stdDev}m
              </span>
            </div>
            <div className="flex justify-between text-slate-400 font-mono">
              <span>Total Relief:</span>
              <span className="text-cyan-400 font-bold">{stats.elevation.relief}m</span>
            </div>
          </div>

          {/* Slope summary */}
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2 space-y-1">
            <div className="flex items-center gap-1 font-semibold text-amber-300 text-[11px]">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Slope & Hazards</span>
            </div>
            <div className="flex justify-between text-slate-400 font-mono">
              <span>Mean Slope:</span>
              <span className="text-slate-200 font-bold">{stats.slope.mean}°</span>
            </div>
            <div className="flex justify-between text-slate-400 font-mono">
              <span>Steep Runoff (&gt;15°):</span>
              <span className="text-orange-400">{stats.slope.steepPercentage}%</span>
            </div>
            <div className="flex justify-between text-slate-400 font-mono">
              <span>Flood Basin (&lt;3°):</span>
              <span className="text-blue-400 font-bold">{stats.slope.flatPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Drainage summary */}
        <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2 space-y-1 text-[11px]">
          <div className="flex items-center gap-1 font-semibold text-blue-300 text-[11px]">
            <Waves className="w-3.5 h-3.5" />
            <span>Drainage Network & Hydrology</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-400 font-mono">
            <div className="flex justify-between">
              <span>Peak Accumulation:</span>
              <span className="text-slate-200 font-bold">
                {stats.drainage.maxAccumulation.toLocaleString()} cells
              </span>
            </div>
            <div className="flex justify-between">
              <span>Depression Sinks:</span>
              <span className="text-rose-400 font-bold">
                {stats.drainage.depressionCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Stream Cells:</span>
              <span className="text-slate-200">
                {stats.drainage.streamCellCount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Est. Stream Length:</span>
              <span className="text-cyan-400 font-bold">
                {stats.drainage.estimatedStreamLengthKm} km
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Member 9 Hand-off Action Button */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
        <button
          onClick={onOpenMember9Modal}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-950/40 active:scale-98 transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Coordinate with Member 9 Simulation</span>
        </button>

        <button
          onClick={handleDownloadGeoJSON}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-all"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>Export Bounding Box (GeoJSON)</span>
        </button>
      </div>
    </div>
  );
};
