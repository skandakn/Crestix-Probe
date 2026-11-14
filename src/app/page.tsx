import Link from 'next/link';
import {
  Mountain,
  Waves,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
  TrendingUp,
  Cpu,
  BarChart3
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 px-6 py-4 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white">
              <Mountain className="w-5 h-5" />
            </div>
            <span className="font-mono font-bold text-sm tracking-wider text-slate-100">
              CRESTIX PROBE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/terrain"
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-cyan-950"
            >
              <Mountain className="w-3.5 h-3.5" />
              <span>Terrain Intelligence</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/forecasting"
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-700"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Forecasting</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 flex flex-col items-center text-center justify-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>CRESTIX PROBE SUITE • MEMBER 4 & MEMBER 6 DELIVERABLES</span>
        </div>

        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight text-white leading-tight">
            Terrain Intelligence & Hydro-Topographic Workspace
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Interactive 3D digital elevation workspace for slope computation, hydrological D8 drainage network routing, and simulation preparation for Member 9 flood solvers.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/terrain"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-sm font-bold flex items-center gap-2 shadow-xl shadow-cyan-900/40 ring-1 ring-cyan-400/40 transition-all cursor-pointer"
          >
            <Mountain className="w-4 h-4" />
            <span>Launch Terrain Intelligence Workspace</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>

          <Link
            href="/forecasting"
            className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-mono text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Waves className="w-4 h-4 text-cyan-400" />
            <span>Launch AI Forecasting</span>
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left pt-12">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <Mountain className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono text-sm font-bold text-slate-100">Interactive 3D Surface</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Three.js GPU-accelerated terrain mesh with OrbitControls, vertex displacement, elevation tinting, and live raycasting inspection.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h3 className="font-mono text-sm font-bold text-slate-100">Horn Slope & D8 Drainage</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real 3x3 finite-difference gradient computation and deterministic D8 flow routing with upstream area accumulation.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="font-mono text-sm font-bold text-slate-100">Member 9 Simulation Sync</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Formal data contract interface exporting simulation-ready DEM matrices, roughness arrays, and boundary parameters.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 text-center text-xs font-mono text-slate-500">
        Crestix Probe • Member 4: Terrain Intelligence Module • Member 6: AI Forecasting Module
      </footer>
    </div>
  );
}
