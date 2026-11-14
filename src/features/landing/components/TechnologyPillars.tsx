"use client";

import React, { useState } from "react";
import {
  Cpu,
  CheckCircle2,
  ArrowRight,
  Code2,
  Sliders,
} from "lucide-react";
import { TECHNOLOGY_PILLARS } from "../data/techData";
import { cn } from "../utils/cn";

export function TechnologyPillars() {
  const [selectedPillarId, setSelectedPillarId] = useState(
    TECHNOLOGY_PILLARS[0].id
  );

  // Spectral cut-off interactive state for FNO pillar
  const [spectralKmax, setSpectralKmax] = useState<number>(32);

  const activePillar =
    TECHNOLOGY_PILLARS.find((p) => p.id === selectedPillarId) ||
    TECHNOLOGY_PILLARS[0];

  return (
    <section
      id="technology"
      className="relative py-24 bg-[#07090e] border-b border-slate-800/80 overflow-hidden"
    >
      {/* Background Gradients */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-cyan-900/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-teal-900/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-4">
            <Cpu className="w-3.5 h-3.5" />
            <span>TRI-PILLAR SCIENTIFIC FOUNDATION</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6">
            The Three Pillars of Crestix Probe
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Bridging fundamental fluid mechanics, infinite-dimensional
            operator learning, and rugged in-situ acoustic hardware into an
            unbroken predictive loop.
          </p>
        </div>

        {/* Pillar Selector Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {TECHNOLOGY_PILLARS.map((pillar) => {
            const isSelected = selectedPillarId === pillar.id;
            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => setSelectedPillarId(pillar.id)}
                className={cn(
                  "p-6 rounded-2xl text-left transition-all duration-300 border flex flex-col justify-between group",
                  isSelected
                    ? "bg-gradient-to-b from-[#0e1626] to-[#080d16] border-cyan-400/80 shadow-xl shadow-cyan-950/60"
                    : "bg-[#0b0f17] border-slate-800 hover:border-slate-700 hover:bg-[#0d121c]"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={cn(
                        "text-xs font-mono font-bold px-2 py-0.5 rounded border",
                        isSelected
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/50"
                          : "bg-slate-900 text-slate-500 border-slate-800"
                      )}
                    >
                      PILLAR {pillar.num}
                    </span>
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        isSelected ? "bg-cyan-400 animate-pulse" : "bg-slate-700"
                      )}
                    />
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-200 transition-colors">
                    {pillar.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {pillar.tagline}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span
                    className={
                      isSelected ? "text-cyan-400" : "text-slate-500"
                    }
                  >
                    Explore Pillar
                  </span>
                  <ArrowRight
                    className={cn(
                      "w-3.5 h-3.5 transition-transform",
                      isSelected
                        ? "translate-x-1 text-cyan-400"
                        : "text-slate-600 group-hover:translate-x-0.5"
                    )}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Pillar Inspection Container */}
        <div className="rounded-2xl bg-[#0b0f17] border border-cyan-500/20 p-6 sm:p-8 lg:p-10 shadow-2xl shadow-cyan-950/40">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Cols: Narrative, Variable Breakdown & Core Advantages */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
                  <span>FOUNDATION {activePillar.num}</span>
                  <span className="text-slate-600">•</span>
                  <span>{activePillar.title}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  {activePillar.tagline}
                </h3>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
                  {activePillar.equationDescription}
                </p>

                {/* Mathematical Equation Card */}
                <div className="p-4 sm:p-5 rounded-xl bg-[#06080d] border border-cyan-500/30 mb-6 shadow-inner">
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Code2 className="w-3 h-3" />
                    <span>Governing Formulation</span>
                  </div>
                  <div className="font-mono text-base sm:text-lg lg:text-xl font-bold text-cyan-200 tracking-wide overflow-x-auto py-1">
                    {activePillar.primaryEquation}
                  </div>
                </div>

                {/* Variable Breakdown Matrix */}
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Mathematical Term Breakdown
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {activePillar.breakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono"
                    >
                      <div className="text-cyan-300 font-bold mb-1">
                        {item.term}
                      </div>
                      <div className="text-slate-300 font-sans text-xs leading-relaxed">
                        {item.meaning}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Core Advantages Checklist */}
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Key Computational Advantages
                </h4>
                <ul className="space-y-2.5 mb-6">
                  {activePillar.coreAdvantages.map((adv, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Academic Context Citation */}
              <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 font-mono leading-relaxed">
                <span className="text-slate-300 font-semibold">Theoretical Lineage: </span>
                {activePillar.academicContext}
              </div>
            </div>

            {/* Right 5 Cols: Visual Architecture Schematic Diagram */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="rounded-xl bg-[#06080d] border border-slate-800 p-5 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-slate-300 font-semibold">
                      ARCHITECTURAL SCHEMATIC
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">SYS-SPEC-v2</span>
                </div>

                {/* Dynamic Architectural Block based on active pillar */}
                {activePillar.id === "shallow-water-equations" && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                      <div className="text-cyan-300 font-bold mb-1">
                        1. Continuous Infiltration Abstraction
                      </div>
                      <p className="text-slate-400 text-[11px] font-sans">
                        Horton / Green-Ampt soil percolation modeling subtracting
                        permeable basin storage from surface hyetographs.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/30">
                      <div className="text-teal-300 font-bold mb-1">
                        2. Riemann Finite-Volume Fluxes (HLLC)
                      </div>
                      <p className="text-slate-400 text-[11px] font-sans">
                        Godunov scheme with hydrostatic reconstruction balancing
                        bed slope momentum source terms and water depth gradients.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                      <div className="text-slate-300 font-bold mb-1">
                        3. Wetting &amp; Drying Front Tracking
                      </div>
                      <p className="text-slate-400 text-[11px] font-sans">
                        Threshold ε = 10⁻⁴m prevents unphysical division by zero
                        depth in Manning friction calculations across dry roads.
                      </p>
                    </div>
                  </div>
                )}

                {activePillar.id === "neural-operators" && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                        <div className="text-cyan-300 font-bold mb-1">
                          1. Coordinate Lifting Layer P(x)
                        </div>
                        <p className="text-slate-400 text-[11px] font-sans">
                          Projects low-dimensional spatial input (z_bed, R_t, h_t)
                          into high-dimensional channel space (d_model = 64).
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/30">
                        <div className="text-teal-300 font-bold mb-1">
                          2. 4x Fourier Spectral Integral Layers
                        </div>
                        <p className="text-slate-400 text-[11px] font-sans">
                          2D Fast Fourier Transform (FFT) → Complex frequency tensor
                          multiplication with learnable R_k → Inverse 2D FFT.
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                        <div className="text-slate-300 font-bold mb-1">
                          3. Physics-Informed Residual Projection Q(x)
                        </div>
                        <p className="text-slate-400 text-[11px] font-sans">
                          Back-projects into continuous water depth and velocity
                          space while penalizing continuity violation gradients.
                        </p>
                      </div>
                    </div>

                    {/* Interactive Fourier Spectral Mode Selector */}
                    <div className="p-3.5 rounded-lg bg-slate-950/80 border border-cyan-500/30 font-mono text-xs space-y-2.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                          <Sliders className="w-3 h-3 text-cyan-400" />
                          <span>Fourier Truncation Cutoff (k_max):</span>
                        </span>
                        <span className="bg-cyan-950 text-cyan-200 px-2 py-0.5 rounded border border-cyan-500/40 font-bold">
                          k = {spectralKmax} modes
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5">
                        {[12, 16, 32, 64].map((k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setSpectralKmax(k)}
                            className={cn(
                              "py-1 text-[10px] rounded transition-colors border",
                              spectralKmax === k
                                ? "bg-cyan-500/30 text-cyan-200 border-cyan-400 font-bold"
                                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                            )}
                          >
                            k={k}
                          </button>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px]">
                        <div className="flex justify-between text-slate-400">
                          <span>Wavenumber Tensor:</span>
                          <span className="text-teal-300">
                            [-{spectralKmax}, +{spectralKmax}]² ℂ-modes
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Mesh Resolution:</span>
                          <span className="text-emerald-400 font-semibold">
                            Zero-shot Super-Resolution
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-sans pt-1 leading-tight">
                          Higher modes capture street-level curb channels; low modes maintain macro-drainage conservation across regional basins.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activePillar.id === "sensor-validation" && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                      <div className="text-cyan-300 font-bold mb-1">
                        1. Acoustic Echo Time-of-Flight
                      </div>
                      <p className="text-slate-400 text-[11px] font-sans">
                        JSN-SR04T transmits 40kHz sonic burst, timing echo return
                        with 1µs counter timer on ESP32 hardware timer.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/30">
                      <div className="text-teal-300 font-bold mb-1">
                        2. In-Situ Speed of Sound Thermistor
                      </div>
                      <p className="text-slate-400 text-[11px] font-sans">
                        Calibrates sonic speed across temperature swings (v =
                        331.3 + 0.606·T), eliminating thermal ranging errors.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                      <div className="text-slate-300 font-bold mb-1">
                        3. Ensemble Kalman Telemetry Ingestion
                      </div>
                      <p className="text-slate-400 text-[11px] font-sans">
                        Cryptographically signed MQTT packets update model
                        boundary conditions at municipal culverts every 30 seconds.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Technical Metrics Quick Card */}
              <div className="p-4 rounded-xl bg-[#0e1422] border border-cyan-500/20 text-xs font-mono">
                <div className="text-cyan-300 font-bold mb-2">
                  Unified System Advantage
                </div>
                <p className="text-slate-300 font-sans text-xs leading-relaxed mb-3">
                  Pure numerical models are too slow. Pure AI models hallucinate.
                  Crestix Probe binds the physics ground truth to spectral AI,
                  anchored by physical acoustic hardware.
                </p>
                <div className="flex items-center justify-between text-slate-400 text-[11px] pt-2 border-t border-slate-800">
                  <span>Theoretical Convergence:</span>
                  <span className="text-emerald-400 font-bold">O(Δx² + Δt²)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
