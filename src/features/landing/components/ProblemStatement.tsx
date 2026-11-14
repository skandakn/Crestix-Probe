"use client";

import React from "react";
import {
  AlertTriangle,
  Clock,
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

              <p className="text-sm text-slate-300 leading-relaxed">
                Urban expansion replaces natural soil infiltration with 70–90%
                impermeable concrete, asphalt, and rooftops. When a 50mm/h
                cloudburst strikes, rainfall is instantly converted into
                high-velocity overland sheet runoff.
              </p>
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

              <p className="text-sm text-slate-300 leading-relaxed">
                Classical 2D Shallow Water Equations (SWE) solved via
                finite-volume numerical integration face rigid
                Courant-Friedrichs-Lewy (CFL) stability bounds. Simulating a
                single urban catchment takes 2 to 6 hours on server clusters.
              </p>
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

              <p className="text-sm text-slate-300 leading-relaxed">
                During severe storm events, thick cloud cover blocks optical
                satellite observations entirely. Meanwhile, naive black-box AI
                models violate conservation of mass, generating phantom flood
                waters or missing dangerous choke points.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Satellite Storm Penetration:</span>
              <span className="text-cyan-400 font-bold">0% Optical View</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
