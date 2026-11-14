'use client';

import React, { useState, useMemo } from 'react';
import {
  ProcessedDEMData,
  LayerSettings,
  TerrainInspectionPoint,
  CrossSectionPoint
} from '../types/terrain';
import { getSampleTerrain } from '../samples/sample-terrains';
import { TerrainViewer3D } from './TerrainViewer3D';
import { ElevationLegend } from './ElevationLegend';
import { TerrainInspectorHUD } from './TerrainInspectorHUD';
import { TerrainLayerControls } from './TerrainLayerControls';
import { TerrainMetadataPanel } from './TerrainMetadataPanel';
import { SampleTerrainSelector } from './SampleTerrainSelector';
import { TerrainUploadModal } from './TerrainUploadModal';
import { TerrainCrossSectionModal } from './TerrainCrossSectionModal';
import { Member9ContractModal } from './Member9ContractModal';
import {
  UploadCloud,
  Share2,
  Mountain,
  Layers,
  Compass,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const TerrainDashboard: React.FC = () => {
  // Current active terrain (defaults to Crestix River Valley sample)
  const [currentTerrain, setCurrentTerrain] = useState<ProcessedDEMData>(() =>
    getSampleTerrain('crestix-river-valley')
  );

  // Active layer and 3D visual settings
  const [layerSettings, setLayerSettings] = useState<LayerSettings>({
    viewMode: 'hybrid',
    colormap: 'hypsometric',
    wireframe: false,
    showGrid: true,
    showContours: false,
    contourInterval: 25,
    showStreams: true,
    streamThreshold: 45,
    verticalExaggeration: 1.5,
    showWaterPlane: false,
    waterLevel: 445,
    sunAzimuth: 315,
    sunAltitude: 45,
    opacity: 1.0
  });

  // Inspected point under raycaster
  const [inspectedPoint, setInspectedPoint] = useState<TerrainInspectionPoint | null>(null);

  // Cross section measurement points
  const [crossSectionPoints, setCrossSectionPoints] = useState<CrossSectionPoint[] | null>(null);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isMember9Open, setIsMember9Open] = useState(false);

  // Calculate submerged percentage under active water level
  const submergedPercentage = useMemo(() => {
    if (!currentTerrain || !layerSettings.showWaterPlane) return 0;
    const { elevations } = currentTerrain;
    let submerged = 0;
    for (let i = 0; i < elevations.length; i++) {
      if (elevations[i] <= layerSettings.waterLevel) submerged++;
    }
    return (submerged / elevations.length) * 100;
  }, [currentTerrain, layerSettings.showWaterPlane, layerSettings.waterLevel]);

  // Load a demonstration terrain
  const handleSelectSample = (sampleId: string) => {
    const dem = getSampleTerrain(sampleId);
    setCurrentTerrain(dem);
    // Align default water level to mid-lower elevation of new terrain
    const defaultWater = dem.stats.elevation.min + dem.stats.elevation.relief * 0.2;
    setLayerSettings(prev => ({
      ...prev,
      waterLevel: Math.round(defaultWater)
    }));
  };

  // Uploaded terrain handler
  const handleTerrainUploaded = (dem: ProcessedDEMData) => {
    setCurrentTerrain(dem);
    const defaultWater = dem.stats.elevation.min + dem.stats.elevation.relief * 0.2;
    setLayerSettings(prev => ({
      ...prev,
      waterLevel: Math.round(defaultWater)
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-950/60">
            <Mountain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white text-base">
                CRESTIX PROBE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                MEMBER 4: TERRAIN
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Terrain Intelligence & Hydro-Topographic Workspace
            </p>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-3">
          {/* Member 9 Sync status pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>M9 Simulation Ready</span>
          </div>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-950 active:scale-95 transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload DEM</span>
          </button>

          <button
            onClick={() => setIsMember9Open(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">Member 9 Interface</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        {/* Left Column: 3D Viewport + Inspector HUD */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* 3D Terrain Viewport Container */}
          <div className="relative w-full h-[380px] sm:h-[480px] md:h-[620px] rounded-2xl overflow-hidden border border-slate-800">
            <TerrainViewer3D
              dem={currentTerrain}
              settings={layerSettings}
              onInspect={setInspectedPoint}
              onCrossSectionMeasured={setCrossSectionPoints}
            />

            {/* Floating Height Legend */}
            <ElevationLegend
              viewMode={layerSettings.viewMode}
              colormap={layerSettings.colormap}
              elevStats={currentTerrain.stats.elevation}
              slopeStats={currentTerrain.stats.slope}
              inspectedPoint={inspectedPoint}
            />
          </div>

          {/* Real-time Terrain Inspector HUD */}
          <TerrainInspectorHUD point={inspectedPoint} />

          {/* Demonstration Terrains Selection Shelf */}
          <SampleTerrainSelector
            currentTerrainId={currentTerrain.metadata.id}
            onSelect={handleSelectSample}
          />
        </div>

        {/* Right Column: Layer Controls + Metadata Panel */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Topographic Layer Controls */}
          <TerrainLayerControls
            settings={layerSettings}
            onChange={setLayerSettings}
            elevStats={currentTerrain.stats.elevation}
            submergedPercentage={submergedPercentage}
          />

          {/* Terrain Metadata & Georeferencing Panel */}
          <TerrainMetadataPanel
            dem={currentTerrain}
            onOpenMember9Modal={() => setIsMember9Open(true)}
          />
        </div>
      </main>

      {/* Modals */}
      <TerrainUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onTerrainLoaded={handleTerrainUploaded}
      />

      <TerrainCrossSectionModal
        points={crossSectionPoints}
        onClose={() => setCrossSectionPoints(null)}
      />

      <Member9ContractModal
        isOpen={isMember9Open}
        onClose={() => setIsMember9Open(false)}
        dem={currentTerrain}
      />
    </div>
  );
};
