'use client';

import React, { useState, useRef } from 'react';
import { ProcessedDEMData, TerrainMetadata } from '../types/terrain';
import { parseAsciiGrid } from '../processing/ascii-grid-parser';
import { parseGeoTIFF } from '../processing/geotiff-parser';
import { processDEM } from '../processing/dem-processor';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  FileCode,
  Info,
  Loader2
} from 'lucide-react';

interface TerrainUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTerrainLoaded: (dem: ProcessedDEMData) => void;
}

export const TerrainUploadModal: React.FC<TerrainUploadModalProps> = ({
  isOpen,
  onClose,
  onTerrainLoaded
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'documentation'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    setError(null);
    setSuccessInfo(null);
    setLoading(true);
    setStatusMessage(`Validating and parsing ${file.name}...`);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'asc' || ext === 'grd' || ext === 'dem') {
        setStatusMessage('Parsing Esri ASCII Grid raster headers & elevation tokens...');
        const text = await file.text();
        const { metadata, elevations } = parseAsciiGrid(text, file.name);

        setStatusMessage('Computing Horn slope, D8 drainage flow, and statistics...');
        const processed = processDEM(metadata, elevations);

        setSuccessInfo(`Loaded ${metadata.name}: ${metadata.width}x${metadata.height} grid (${metadata.cellSize}m)`);
        setTimeout(() => {
          onTerrainLoaded(processed);
          onClose();
        }, 600);
      } else if (ext === 'tif' || ext === 'tiff') {
        setStatusMessage('Reading GeoTIFF TIFF tags, projection tags, and elevation band...');
        const arrayBuffer = await file.arrayBuffer();
        const { metadata, elevations } = await parseGeoTIFF(arrayBuffer, file.name);

        setStatusMessage('Executing topographic gradients & drainage network analysis...');
        const processed = processDEM(metadata, elevations);

        setSuccessInfo(`Loaded GeoTIFF: ${metadata.width}x${metadata.height} (${metadata.cellSize}m)`);
        setTimeout(() => {
          onTerrainLoaded(processed);
          onClose();
        }, 600);
      } else if (ext === 'json') {
        setStatusMessage('Reading Crestix DEM JSON schema...');
        const text = await file.text();
        const parsed = JSON.parse(text);

        if (!parsed.metadata || !parsed.elevations) {
          throw new Error('Invalid Crestix JSON: Must contain "metadata" and "elevations" fields.');
        }

        const elevBuffer = new Float32Array(parsed.elevations);
        const processed = processDEM(parsed.metadata, elevBuffer);

        setSuccessInfo(`Loaded JSON DEM: ${processed.metadata.name}`);
        setTimeout(() => {
          onTerrainLoaded(processed);
          onClose();
        }, 600);
      } else {
        throw new Error(
          `Unsupported file extension ".${ext}". Please upload a GeoTIFF (.tif, .tiff), Esri ASCII Grid (.asc, .dem, .grd), or Crestix DEM JSON (.json).`
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown parsing error occurred';
      setError(message);
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Upload Terrain DEM Dataset</h3>
              <p className="text-[11px] text-slate-400">
                Ingest Digital Elevation Models for hydraulic flood simulation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 px-6 pt-2 bg-slate-950/30 gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 border-b-2 transition-all ${
              activeTab === 'upload'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => setActiveTab('documentation')}
            className={`pb-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'documentation'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Supported Formats & Specs</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {activeTab === 'upload' ? (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-950/30'
                    : 'border-slate-700/80 hover:border-slate-500 bg-slate-950/40 hover:bg-slate-950/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".tif,.tiff,.asc,.grd,.dem,.json"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-cyan-400 shadow-inner">
                  <UploadCloud className="w-6 h-6" />
                </div>

                <div>
                  <div className="text-sm font-semibold text-slate-200">
                    Click to select file or drag & drop here
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    GeoTIFF (<span className="text-cyan-400 font-mono">.tif, .tiff</span>), Esri ASCII (<span className="text-cyan-400 font-mono">.asc, .dem, .grd</span>), Crestix JSON (<span className="text-cyan-400 font-mono">.json</span>)
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-500 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
                  Max recommended grid: 512×512 cells
                </div>
              </div>

              {/* Progress / Status banner */}
              {loading && (
                <div className="p-3 rounded-xl bg-cyan-950/50 border border-cyan-800/60 text-cyan-300 text-xs flex items-center gap-3 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/70 text-rose-200 text-xs flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold text-rose-300">File Ingestion Failed</div>
                    <div className="text-[11px] text-rose-200/90 leading-relaxed">{error}</div>
                  </div>
                </div>
              )}

              {/* Success State */}
              {successInfo && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/70 text-emerald-200 text-xs flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">{successInfo}</span>
                </div>
              )}
            </div>
          ) : (
            /* Documentation & Specifications Tab */
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-100 flex items-center gap-1.5 text-sm">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Documented Initial Terrain Formats</span>
                </h4>
                <p className="text-slate-400 text-[11px]">
                  Crestix Probe supports three primary standard geospatial raster representations.
                </p>
              </div>

              {/* Format 1: Esri ASCII Grid */}
              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl space-y-2 font-mono text-[11px]">
                <div className="text-cyan-300 font-bold flex items-center justify-between">
                  <span>1. Esri ASCII Raster Grid (.asc / .dem)</span>
                  <span className="text-[10px] text-slate-500">Plaintext GIS</span>
                </div>
                <div className="text-slate-400 text-[10px]">
                  Standard interchange format containing 6 header parameters followed by elevation values in row-major order:
                </div>
                <pre className="p-2.5 bg-slate-900 rounded border border-slate-800 text-[10px] text-emerald-300 overflow-x-auto">
{`ncols         120
nrows         120
xllcorner     77.585
yllcorner     12.965
cellsize      20
NODATA_value  -9999
512.4 513.1 513.8 514.2 ...`}
                </pre>
              </div>

              {/* Format 2: GeoTIFF */}
              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl space-y-2 font-mono text-[11px]">
                <div className="text-cyan-300 font-bold flex items-center justify-between">
                  <span>2. GeoTIFF Single-Band DEM (.tif / .tiff)</span>
                  <span className="text-[10px] text-slate-500">Binary Raster</span>
                </div>
                <div className="text-slate-400 text-[10px]">
                  Standard 16-bit or 32-bit floating point raster band with embedded ModelPixelScaleTag, ModelTiepointTag, and optional GDAL_NODATA tag.
                </div>
              </div>

              {/* Format 3: Crestix DEM JSON */}
              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl space-y-2 font-mono text-[11px]">
                <div className="text-cyan-300 font-bold flex items-center justify-between">
                  <span>3. Crestix Member 9 JSON Schema (.json)</span>
                  <span className="text-[10px] text-slate-500">API Contract</span>
                </div>
                <div className="text-slate-400 text-[10px]">
                  Direct JSON representation containing metadata and a 1D elevation array, fully compatible with the Member 9 backend simulation contract.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
