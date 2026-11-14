'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import TerrainDashboard with ssr: false since Three.js requires browser window/WebGL context
const TerrainDashboard = dynamic(
  () =>
    import('@/features/terrain/components/TerrainDashboard').then(
      mod => mod.TerrainDashboard
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-300">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <span className="font-mono text-sm tracking-wide">
          Initializing Crestix Terrain Intelligence Module...
        </span>
      </div>
    )
  }
);

export default function TerrainPage() {
  return <TerrainDashboard />;
}
