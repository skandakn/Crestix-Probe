import React from 'react';
import { AlertTriangle, Database, CheckCircle2, Info } from 'lucide-react';

interface MockDataBadgeProps {
  isMock: boolean;
  dataSource?: 'LIVE_PYTORCH_INFERENCE' | 'SAMPLE_BENCHMARK_DATA';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const MockDataBadge: React.FC<MockDataBadgeProps> = ({
  isMock,
  dataSource = isMock ? 'SAMPLE_BENCHMARK_DATA' : 'LIVE_PYTORCH_INFERENCE',
  size = 'md',
  className = ''
}) => {
  if (!isMock) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 ${
          size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'
        } ${className}`}
        title="Verified inference payload from Member 9 PyTorch inference service"
      >
        <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        LIVE INFERENCE (PYTORCH)
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-md border border-amber-500/40 bg-amber-500/15 text-amber-300 animate-pulse ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'
      } ${className}`}
      title="Synthesized hydrodynamic benchmark data for interface validation prior to Member 9 connection"
    >
      <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      SAMPLE BENCHMARK DATA (MOCK)
    </span>
  );
};

export const MockDataBanner: React.FC<{ isMock: boolean; className?: string }> = ({ isMock, className = '' }) => {
  if (!isMock) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-950/20 px-4 py-2.5 text-amber-200 text-xs leading-relaxed backdrop-blur-sm ${className}`}
    >
      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <span className="font-semibold text-amber-300 uppercase tracking-wider mr-1.5 font-mono">
          Scientific Transparency Notice:
        </span>
        Outputs and evaluation metrics displayed below originate from precomputed synthetic shallow-water benchmark scenarios.
        No unverified AI claims are made. Real model outputs will populate automatically once Member 9’s PyTorch inference microservice is attached via the isolated API adapter.
      </div>
    </div>
  );
};

