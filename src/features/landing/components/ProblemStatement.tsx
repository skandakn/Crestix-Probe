"use client";

import React from "react";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  EyeOff,
} from "lucide-react";

export function ProblemStatement() {
  return (
    <section
      id="problem"
      className="relative py-24 bg-[#090d16] border-b border-slate-800/80 overflow-hidden"
    >
      {/* Background Gradients */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-red-950/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-cyan-950/20 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/70 border border-red-500/30 text-red-300 text-xs font-mono mb-4">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>THE URBAN INUNDATION DILEMMA</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6">
            Why Traditional Flood Forecasting Fails in Modern Cities
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Rapid urbanization, climate-driven convective cloudbursts, and
            antiquated computational tools have created a widening gap between
            how fast urban flood waters rise and how fast municipal models can
            calculate danger.
          </p>
        </div>

        {/* 3 Core Problem Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {/* Problem Card 1: Impervious Runoff Explosion */}
          <div className="relative p-6 sm:p-8 rounded-2xl bg-[#0b0f17] border border-slate-800/90 hover:border-red-500/30 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-red-950/50 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="font-mono text-xs text-red-400/80 font-semibold px-2 py-0.5 rounded bg-red-950/40 border border-red-500/20">
                  CRISIS 01
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-3">
                Impervious Surface Explosion
              </h3>

              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Urban expansion replaces natural soil infiltration with 70–90%
                impermeable concrete, asphalt, and rooftops. When a 50mm/h
                cloudburst strikes, rainfall is instantly converted into
                high-velocity overland sheet runoff.
              </p>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs font-mono text-slate-400">
                <span className="text-red-400 font-semibold">Impact: </span>
                Storm sewer collector pipes surcharge within 15 minutes,
                transforming street corridors into raging canals before pumps can
                respond.
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Runoff Coefficient:</span>
              <span className="text-red-400 font-bold">C &gt; 0.85 (Asphalt)</span>
            </div>
          </div>

          {/* Problem Card 2: The Computational Bottleneck */}
          <div className="relative p-6 sm:p-8 rounded-2xl bg-[#0b0f17] border border-slate-800/90 hover:border-amber-500/30 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-amber-950/50 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="font-mono text-xs text-amber-400/80 font-semibold px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/20">
                  CRISIS 02
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-3">
                The 4-Hour Simulation Delay
              </h3>

              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Classical 2D Shallow Water Equations (SWE) solved via
                finite-volume numerical integration face rigid
                Courant-Friedrichs-Lewy (CFL) stability bounds. Simulating a
                single urban catchment takes 2 to 6 hours on server clusters.
              </p>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs font-mono text-slate-400">
                <span className="text-amber-400 font-semibold">Impact: </span>
                By the time numerical models finish computing where the flood
                wave travels, the storm has already crested and critical
                intersections are submerged.
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Classical Compute Latency:</span>
              <span className="text-amber-400 font-bold">120 - 360 mins</span>
            </div>
          </div>

          {/* Problem Card 3: The Ground-Truth Blindspot */}
          <div className="relative p-6 sm:p-8 rounded-2xl bg-[#0b0f17] border border-slate-800/90 hover:border-cyan-500/30 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <EyeOff className="w-6 h-6" />
                </div>
                <span className="font-mono text-xs text-cyan-400/80 font-semibold px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/20">
                  CRISIS 03
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-3">
                Blind Ground Truth &amp; AI Drift
              </h3>

              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                During severe storm events, thick cloud cover blocks optical
                satellite observations entirely. Meanwhile, naive black-box AI
                models violate conservation of mass, generating phantom flood
                waters or missing dangerous choke points.
              </p>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs font-mono text-slate-400">
                <span className="text-cyan-400 font-semibold">Impact: </span>
                Emergency managers are left guessing real-time culvert water
                levels without verified physical measurement or physically
                bounded surrogate models.
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Satellite Storm Penetration:</span>
              <span className="text-cyan-400 font-bold">0% Optical View</span>
            </div>
          </div>
        </div>

        {/* Paradigm Comparison Table: Legacy vs Crestix Probe */}
        <div className="rounded-2xl bg-[#0b0f17] border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-5 sm:p-6 bg-[#0e1422] border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-lg font-bold text-white">
                Architectural Paradigm Comparison
              </h4>
              <p className="text-xs font-mono text-slate-400">
                Legacy Numerical Modeling vs The Crestix Probe Unified Platform
              </p>
            </div>
            <div className="text-xs font-mono px-3 py-1 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
              PHYSICS + NEURAL OPERATOR + HARDWARE
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm font-sans">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-mono text-xs">
                  <th className="py-3 px-4 sm:px-6">Capability Dimension</th>
                  <th className="py-3 px-4 sm:px-6 text-red-300/90">
                    Legacy 2D Hydrodynamic Models
                  </th>
                  <th className="py-3 px-4 sm:px-6 text-cyan-300 font-bold">
                    Crestix Probe Architecture
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                <tr className="hover:bg-slate-900/30">
                  <td className="py-4 px-4 sm:px-6 font-mono font-medium text-white">
                    Forward Forecast Latency
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-slate-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>2 to 6 Hours (Finite Volume CPU/GPU)</span>
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-cyan-300 font-semibold">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>&lt; 42 Milliseconds (Fourier Neural Operator)</span>
                    </div>
                  </td>
                </tr>

                <tr className="hover:bg-slate-900/30">
                  <td className="py-4 px-4 sm:px-6 font-mono font-medium text-white">
                    Conservation Law Guarantee
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-slate-400">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Strict (but computationally crippling)</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-cyan-300 font-semibold">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>PINO Residual Loss: &lt; 0.4% Mass Error Bound</span>
                    </div>
                  </td>
                </tr>

                <tr className="hover:bg-slate-900/30">
                  <td className="py-4 px-4 sm:px-6 font-mono font-medium text-white">
                    Topographic Spatial Resolution
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-slate-400">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>Coarse 10m–30m DEM (Misses curbs &amp; ditches)</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-cyan-300 font-semibold">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>0.5m LiDAR Mesh + Zero-Shot Super-Resolution</span>
                    </div>
                  </td>
                </tr>

                <tr className="hover:bg-slate-900/30">
                  <td className="py-4 px-4 sm:px-6 font-mono font-medium text-white">
                    Ground-Truth Feedback Loop
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-slate-400">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>Uncalibrated / Static historical gauge lookup</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-cyan-300 font-semibold">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>ESP32 In-Situ Ultrasonic Continuous Kalman Ingestion</span>
                    </div>
                  </td>
                </tr>

                <tr className="hover:bg-slate-900/30">
                  <td className="py-4 px-4 sm:px-6 font-mono font-medium text-white">
                    Emergency Evacuation Guidance
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-slate-400">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>Static floodplain zones (No live road routing)</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-cyan-300 font-semibold">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Dynamic Depth-Weighted Road Network Dijkstra Routing</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
