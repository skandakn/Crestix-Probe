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
      className="relative py-28 bg-white border-b border-black/[0.06] overflow-hidden"
    >
      {/* Background Subtle Precision Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000006_1px,transparent_1px),linear-gradient(to_bottom,#00000006_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Atmospheric Soft Light Gradients */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-blue-500/[0.03] blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-cyan-400/[0.03] blur-[140px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-[#0071e3] text-xs font-mono mb-4 font-semibold">
            <Cpu className="w-3.5 h-3.5" />
            <span>TRI-PILLAR SCIENTIFIC FOUNDATION</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-6">
            The Three Pillars of Crestix Probe
          </h2>

          <p className="text-base sm:text-lg text-[#6e6e73] leading-relaxed">
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
                  "p-6 rounded-3xl text-left transition-all duration-300 border flex flex-col justify-between group",
                  isSelected
                    ? "bg-[#fbfbfd] border-[#0071e3] shadow-[0_8px_30px_rgba(0,113,227,0.08)]"
                    : "bg-white border-zinc-200/80 hover:border-zinc-300 hover:bg-[#f5f5f7] shadow-xs"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={cn(
                        "text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border",
                        isSelected
                          ? "bg-blue-50 text-[#0071e3] border-blue-200/70"
                          : "bg-[#f5f5f7] text-[#86868b] border-zinc-200"
                      )}
                    >
                      PILLAR {pillar.num}
                    </span>
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        isSelected ? "bg-[#0071e3] animate-pulse" : "bg-zinc-300"
                      )}
                    />
                  </div>

                  <h3 className="text-lg font-bold text-[#1d1d1f] mb-2 group-hover:text-[#0071e3] transition-colors">
                    {pillar.title}
                  </h3>

                  <p className="text-xs text-[#6e6e73] line-clamp-2 leading-relaxed">
                    {pillar.tagline}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-mono">
                  <span
                    className={
                      isSelected ? "text-[#0071e3] font-semibold" : "text-[#86868b]"
                    }
                  >
                    Explore Pillar
                  </span>
                  <ArrowRight
                    className={cn(
                      "w-3.5 h-3.5 transition-transform",
                      isSelected
                        ? "translate-x-1 text-[#0071e3]"
                        : "text-[#86868b] group-hover:translate-x-0.5"
                    )}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Pillar Inspection Container */}
        <div className="rounded-3xl bg-white border border-zinc-200/90 p-7 sm:p-10 shadow-[0_12px_44px_rgba(0,0,0,0.05)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left 7 Cols: Narrative, Variable Breakdown & Core Advantages */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#0071e3] mb-2 font-semibold">
                  <span>FOUNDATION {activePillar.num}</span>
                  <span className="text-zinc-300">•</span>
                  <span>{activePillar.title}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-[#1d1d1f] mb-4">
                  {activePillar.tagline}
                </h3>

                <p className="text-sm sm:text-base text-[#6e6e73] leading-relaxed mb-6">
                  {activePillar.equationDescription}
                </p>

                {/* Mathematical Equation Card */}
                <div className="p-5 rounded-2xl bg-[#f5f5f7] border border-black/[0.05] mb-6 shadow-xs">
                  <div className="text-[10px] font-mono text-[#0071e3] uppercase tracking-widest mb-2 flex items-center gap-1.5 font-bold">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Governing Formulation</span>
                  </div>
                  <div className="font-mono text-base sm:text-lg lg:text-xl font-bold text-[#1d1d1f] tracking-wide overflow-x-auto py-1">
                    {activePillar.primaryEquation}
                  </div>
                </div>

                {/* Variable Breakdown Matrix */}
                <h4 className="text-xs font-mono font-bold text-[#86868b] uppercase tracking-wider mb-3">
                  Mathematical Term Breakdown
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {activePillar.breakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 text-xs font-mono shadow-xs"
                    >
                      <div className="text-[#0071e3] font-bold mb-1">
                        {item.term}
                      </div>
                      <div className="text-[#6e6e73] font-sans text-xs leading-relaxed">
                        {item.meaning}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Core Advantages Checklist */}
                <h4 className="text-xs font-mono font-bold text-[#86868b] uppercase tracking-wider mb-3">
                  Key Computational Advantages
                </h4>
                <ul className="space-y-2.5 mb-6">
                  {activePillar.coreAdvantages.map((adv, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-[#1d1d1f]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Academic Context Citation */}
              <div className="mt-6 pt-4 border-t border-zinc-100 text-xs text-[#86868b] font-mono leading-relaxed">
                <span className="text-[#1d1d1f] font-semibold">Theoretical Lineage: </span>
                {activePillar.academicContext}
              </div>
            </div>

            {/* Right 5 Cols: Visual Architecture Schematic Diagram */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="rounded-2xl bg-[#f8fafc] border border-zinc-200/80 p-5 font-mono text-xs shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200 text-[#1d1d1f]">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#0071e3] animate-pulse" />
                    <span className="font-semibold text-[#1d1d1f]">
                      ARCHITECTURAL SCHEMATIC
                    </span>
                  </div>
                  <span className="text-[10px] text-[#86868b]">SYS-SPEC-v2</span>
                </div>

                {/* Dynamic Architectural Block based on active pillar */}
                {activePillar.id === "shallow-water-equations" && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-xs">
                      <div className="text-[#0071e3] font-bold mb-1">
                        1. Continuous Infiltration Abstraction
                      </div>
                      <p className="text-[#6e6e73] text-[11px] font-sans">
                        Horton / Green-Ampt soil percolation modeling subtracting
                        permeable basin storage from surface hyetographs.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 shadow-xs">
                      <div className="text-[#0071e3] font-bold mb-1">
                        2. Riemann Finite-Volume Fluxes (HLLC)
                      </div>
                      <p className="text-[#515154] text-[11px] font-sans">
                        Godunov scheme with hydrostatic reconstruction balancing
                        bed slope momentum source terms and water depth gradients.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-xs">
                      <div className="text-[#1d1d1f] font-bold mb-1">
                        3. Wetting &amp; Drying Front Tracking
                      </div>
                      <p className="text-[#6e6e73] text-[11px] font-sans">
                        Threshold ε = 10⁻⁴m prevents unphysical division by zero
                        depth in Manning friction calculations across dry roads.
                      </p>
                    </div>
                  </div>
                )}

                {activePillar.id === "neural-operators" && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-xs">
                        <div className="text-[#0071e3] font-bold mb-1">
                          1. Coordinate Lifting Layer P(x)
                        </div>
                        <p className="text-[#6e6e73] text-[11px] font-sans">
                          Projects low-dimensional spatial input (z_bed, R_t, h_t)
                          into high-dimensional channel space (d_model = 64).
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 shadow-xs">
                        <div className="text-[#0071e3] font-bold mb-1">
                          2. 4x Fourier Spectral Integral Layers
                        </div>
                        <p className="text-[#515154] text-[11px] font-sans">
                          2D Fast Fourier Transform (FFT) → Complex frequency tensor
                          multiplication with learnable R_k → Inverse 2D FFT.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-xs">
                        <div className="text-[#1d1d1f] font-bold mb-1">
                          3. Physics-Informed Residual Projection Q(x)
                        </div>
                        <p className="text-[#6e6e73] text-[11px] font-sans">
                          Back-projects into continuous water depth and velocity
                          space while penalizing continuity violation gradients.
                        </p>
                      </div>
                    </div>

                    {/* Interactive Fourier Spectral Mode Selector */}
                    <div className="p-3.5 rounded-xl bg-white border border-zinc-200 font-mono text-xs space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#1d1d1f] font-bold flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-[#0071e3]" />
                          <span>Fourier Truncation Cutoff (k_max):</span>
                        </span>
                        <span className="bg-blue-50 text-[#0071e3] px-2.5 py-0.5 rounded-full border border-blue-200 font-bold">
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
                              "py-1 text-[10px] rounded-full transition-colors border font-medium",
                              spectralKmax === k
                                ? "bg-[#0071e3] text-white border-transparent font-bold shadow-xs"
                                : "bg-[#f5f5f7] text-[#6e6e73] border-zinc-200 hover:bg-zinc-200/70"
                            )}
                          >
                            k={k}
                          </button>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-zinc-100 space-y-1 text-[11px]">
                        <div className="flex justify-between text-[#6e6e73]">
                          <span>Wavenumber Tensor:</span>
                          <span className="text-[#0071e3] font-semibold">
                            [-{spectralKmax}, +{spectralKmax}]² ℂ-modes
                          </span>
                        </div>
                        <div className="flex justify-between text-[#6e6e73]">
                          <span>Mesh Resolution:</span>
                          <span className="text-emerald-600 font-semibold">
                            Zero-shot Super-Resolution
                          </span>
                        </div>
                        <p className="text-[10px] text-[#86868b] font-sans pt-1 leading-tight">
                          Higher modes capture street-level curb channels; low modes maintain macro-drainage conservation across regional basins.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activePillar.id === "sensor-validation" && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-xs">
                      <div className="text-[#0071e3] font-bold mb-1">
                        1. Acoustic Echo Time-of-Flight
                      </div>
                      <p className="text-[#6e6e73] text-[11px] font-sans">
                        JSN-SR04T transmits 40kHz sonic burst, timing echo return
                        with 1µs counter timer on ESP32 hardware timer.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 shadow-xs">
                      <div className="text-[#0071e3] font-bold mb-1">
                        2. In-Situ Speed of Sound Thermistor
                      </div>
                      <p className="text-[#515154] text-[11px] font-sans">
                        Calibrates sonic speed across temperature swings (v =
                        331.3 + 0.606·T), eliminating thermal ranging errors.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-xs">
                      <div className="text-[#1d1d1f] font-bold mb-1">
                        3. Ensemble Kalman Telemetry Ingestion
                      </div>
                      <p className="text-[#6e6e73] text-[11px] font-sans">
                        Cryptographically signed MQTT packets update model
                        boundary conditions at municipal culverts every 30 seconds.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Technical Metrics Quick Card */}
              <div className="p-4 rounded-2xl bg-white border border-zinc-200/90 text-xs font-mono shadow-xs">
                <div className="text-[#0071e3] font-bold mb-2">
                  Unified System Advantage
                </div>
                <p className="text-[#6e6e73] font-sans text-xs leading-relaxed mb-3">
                  Pure numerical models are too slow. Pure AI models hallucinate.
                  Crestix Probe binds the physics ground truth to spectral AI,
                  anchored by physical acoustic hardware.
                </p>
                <div className="flex items-center justify-between text-[#86868b] text-[11px] pt-2 border-t border-zinc-100">
                  <span>Theoretical Convergence:</span>
                  <span className="text-emerald-600 font-bold">O(Δx² + Δt²)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
