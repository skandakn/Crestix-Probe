'use client';

import React from 'react';
import { SAMPLE_TERRAIN_DEFINITIONS } from '../samples/sample-terrains';
import { Mountain, Waves, Building2, Wind, CheckCircle2 } from 'lucide-react';

interface SampleTerrainSelectorProps {
  currentTerrainId: string;
  onSelect: (sampleId: string) => void;
}

export const SampleTerrainSelector: React.FC<SampleTerrainSelectorProps> = ({
  currentTerrainId,
  onSelect
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'fluvial':
        return <Waves className="w-3.5 h-3.5 text-cyan-400" />;
      case 'alpine':
        return <Mountain className="w-3.5 h-3.5 text-amber-400" />;
      case 'coastal':
        return <Wind className="w-3.5 h-3.5 text-blue-400" />;
      case 'urban':
      default:
        return <Building2 className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 backdrop-blur-md shadow-xl text-xs space-y-3">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
        <span className="font-semibold text-slate-200">Demonstration Terrains</span>
        <span className="text-[10px] font-mono text-cyan-400">Sample Library</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SAMPLE_TERRAIN_DEFINITIONS.map(sample => {
          const isSelected = sample.id === currentTerrainId;
          return (
            <button
              key={sample.id}
              onClick={() => onSelect(sample.id)}
              className={`text-left p-2.5 rounded-lg border transition-all relative flex flex-col justify-between gap-1.5 ${
                isSelected
                  ? 'bg-cyan-950/70 border-cyan-500 shadow-md shadow-cyan-950/50'
                  : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-slate-200 text-[11px]">
                  {getIcon(sample.type)}
                  <span className="truncate max-w-[150px]">{sample.name}</span>
                </div>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
              </div>

              <div className="text-[10px] text-slate-400 line-clamp-1">{sample.tagline}</div>

              <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500">
                <span>
                  {sample.width}×{sample.height}
                </span>
                <span>•</span>
                <span>{sample.cellSize}m res</span>
                <span>•</span>
                <span className="uppercase">{sample.type}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
