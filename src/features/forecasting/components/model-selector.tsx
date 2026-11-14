'use client';

import React from 'react';
import { AIModelId, AIModelInfo } from '../types/forecast';
import { AI_MODELS } from '../utils/physics';
import { Cpu, Zap, Activity, Waves, Gauge, Check } from 'lucide-react';

interface ModelSelectorProps {
  selectedModelId: AIModelId;
  onSelectModel: (modelId: AIModelId) => void;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModelId,
  onSelectModel,
  disabled = false
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          Physics-Informed AI Model Architecture
        </label>
        <span className="text-[11px] font-mono text-slate-400">3 Models Available</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {AI_MODELS.map((model) => {
          const isSelected = model.id === selectedModelId;

          const iconMap = {
            'cnn-convlstm': <Activity className="w-4 h-4 text-amber-400" />,
            'fno-2d': <Waves className="w-4 h-4 text-cyan-400" />,
            'pino-swe': <Zap className="w-4 h-4 text-emerald-400" />
          };

          return (
            <button
              key={model.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectModel(model.id)}
              className={`text-left p-3.5 rounded-xl border transition-all duration-200 relative flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'border-cyan-500/80 bg-slate-900/90 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/40'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-slate-900 border border-slate-800">
                      {iconMap[model.id]}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                        {model.shortName}
                        {isSelected && (
                          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-tight">
                        {model.category}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      model.status === 'READY'
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                        : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
                    }`}
                  >
                    {model.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 mb-2 leading-relaxed">
                  {model.name}
                </p>

                <div className="bg-slate-950/80 rounded border border-slate-800/80 p-2 mb-2 text-[11px] font-mono text-slate-400 space-y-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">Params:</span>
                    <span>{model.parametersCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">Velocity (u, v):</span>
                    <span className={model.supportsVelocity ? 'text-emerald-400' : 'text-slate-500'}>
                      {model.supportsVelocity ? 'Supported' : 'Depth Only'}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 line-clamp-2 italic">
                  {model.physicsPde}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-mono text-[10px]">{model.resolution}</span>
                <span
                  className={`text-[10px] font-mono font-medium ${
                    isSelected ? 'text-cyan-400' : 'text-slate-400'
                  }`}
                >
                  {isSelected ? 'Active Model' : 'Select'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

