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
      className="relative py-28 bg-[#f5f5f7] border-b border-black/[0.06] overflow-hidden"
    >
      {/* Background Subtle Atmospheric Gradients */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-rose-500/[0.03] blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-blue-500/[0.03] blur-[140px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-mono mb-4 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>THE URBAN INUNDATION DILEMMA</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-6">
            Why Traditional Flood Forecasting Fails in Modern Cities
          </h2>

          <p className="text-base sm:text-lg text-[#6e6e73] leading-relaxed">
            Rapid urbanization, climate-driven convective cloudbursts, and
            antiquated computational tools have created a widening gap between
            how fast urban flood waters rise and how fast municipal models can
            calculate danger.
          </p>
        </div>

        {/* 3 Core Problem Pillars (Apple Porcelain Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Problem Card 1: Impervious Runoff Explosion */}
          <div className="relative p-7 sm:p-9 rounded-3xl bg-white border border-zinc-200/80 hover:border-rose-300 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="font-mono text-xs text-rose-700 font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200/70">
                  CRISIS 01
                </span>
              </div>

              <h3 className="text-xl font-bold text-[#1d1d1f] mb-3">
                Impervious Surface Explosion
              </h3>

              <p className="text-sm text-[#6e6e73] leading-relaxed">
                Urban expansion replaces natural soil infiltration with 70–90%
                impermeable concrete, asphalt, and rooftops. When a 50mm/h
                cloudburst strikes, rainfall is instantly converted into
                high-velocity overland sheet runoff.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-mono text-[#86868b]">
              <span>Runoff Coefficient:</span>
              <span className="text-rose-600 font-bold">C &gt; 0.85 (Asphalt)</span>
            </div>
          </div>

          {/* Problem Card 2: The Computational Bottleneck */}
          <div className="relative p-7 sm:p-9 rounded-3xl bg-white border border-zinc-200/80 hover:border-amber-300 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="font-mono text-xs text-amber-700 font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/70">
                  CRISIS 02
                </span>
              </div>

              <h3 className="text-xl font-bold text-[#1d1d1f] mb-3">
                The 4-Hour Simulation Delay
              </h3>

              <p className="text-sm text-[#6e6e73] leading-relaxed">
                Classical 2D Shallow Water Equations (SWE) solved via
                finite-volume numerical integration face rigid
                Courant-Friedrichs-Lewy (CFL) stability bounds. Simulating a
                single urban catchment takes 2 to 6 hours on server clusters.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-mono text-[#86868b]">
              <span>Classical Compute Latency:</span>
              <span className="text-amber-600 font-bold">120 - 360 mins</span>
            </div>
          </div>

          {/* Problem Card 3: The Ground-Truth Blindspot */}
          <div className="relative p-7 sm:p-9 rounded-3xl bg-white border border-zinc-200/80 hover:border-blue-300 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0071e3] group-hover:scale-105 transition-transform">
                  <EyeOff className="w-6 h-6" />
                </div>
                <span className="font-mono text-xs text-[#0071e3] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/70">
                  CRISIS 03
                </span>
              </div>

              <h3 className="text-xl font-bold text-[#1d1d1f] mb-3">
                Blind Ground Truth &amp; AI Drift
              </h3>

              <p className="text-sm text-[#6e6e73] leading-relaxed">
                During severe storm events, thick cloud cover blocks optical
                satellite observations entirely. Meanwhile, naive black-box AI
                models violate conservation of mass, generating phantom flood
                waters or missing dangerous choke points.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-mono text-[#86868b]">
              <span>Satellite Storm Penetration:</span>
              <span className="text-[#0071e3] font-bold">0% Optical View</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
