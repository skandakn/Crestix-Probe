"use client";

import React, { useState } from "react";
import {
  BarChart2,
  AlertTriangle,
  Info,
  BookOpen,
} from "lucide-react";
import {
  RESEARCH_DISCLAIMER,
  BENCHMARK_COMPARISONS,
  ACADEMIC_CITATIONS,
} from "../data/researchData";
import { cn } from "../utils/cn";

export function ResearchBenchmarks() {
  const [activeTab, setActiveTab] = useState<"table" | "citations">("table");

  return (
    <section
      id="research"
      className="relative py-28 bg-[#f5f5f7] border-b border-black/[0.06] overflow-hidden"
    >
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[500px] bg-blue-500/[0.03] blur-[150px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-mono mb-4 font-semibold">
            <Info className="w-3.5 h-3.5 text-amber-600" />
            <span>{RESEARCH_DISCLAIMER.badge}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-6">
            Computational Scaling &amp; Error Profiles
          </h2>

          <p className="text-base sm:text-lg text-[#6e6e73] leading-relaxed">
            Evaluating the theoretical computational complexity of spectral
            Fourier Neural Operators against classical 2D Saint-Venant
            finite-volume numerical schemes across variable spatial grid densities.
          </p>

          {/* Explicit Research Disclosure Callout Box */}
          <div className="mt-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs font-mono leading-relaxed flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <strong className="text-amber-950 font-bold">DATA INTEGRITY DISCLOSURE: </strong>
              {RESEARCH_DISCLAIMER.description}
            </div>
          </div>
        </div>

        {/* View Toggle Tabs (Apple Segmented Capsule) */}
        <div className="flex items-center gap-1.5 mb-8 bg-zinc-200/60 p-1 rounded-full w-fit border border-black/[0.04]">
          <button
            type="button"
            onClick={() => setActiveTab("table")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-mono font-medium transition-all flex items-center gap-2",
              activeTab === "table"
                ? "bg-white text-[#1d1d1f] shadow-xs font-bold"
                : "text-[#6e6e73] hover:text-[#1d1d1f]"
            )}
          >
            <BarChart2 className="w-3.5 h-3.5 text-[#0071e3]" />
            <span>Scaling Benchmarks (Illustrative)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("citations")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-mono font-medium transition-all flex items-center gap-2",
              activeTab === "citations"
                ? "bg-white text-[#1d1d1f] shadow-xs font-bold"
                : "text-[#6e6e73] hover:text-[#1d1d1f]"
            )}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#0071e3]" />
            <span>Academic Literature &amp; Citations</span>
          </button>
        </div>

        {/* Tab 1: Scaling Comparison Table & Visual Comparison */}
        {activeTab === "table" && (
          <div className="space-y-8">
            {/* The Main Benchmark Table */}
            <div className="rounded-3xl bg-white border border-zinc-200/80 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
              <div className="p-4 sm:p-5 bg-[#fbfbfd] border-b border-zinc-200/80 flex items-center justify-between text-xs font-mono">
                <span className="text-[#1d1d1f] font-semibold">
                  BENCHMARK MATRIX: 2D SWE SOLVER VS FNO/PINO SURROGATE
                </span>
                <span className="text-amber-700 text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 font-semibold">
                  SYNTHETIC BENCHMARK
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm font-sans">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-[#f5f5f7] text-[#86868b] font-mono text-xs">
                      <th className="py-3 px-4 sm:px-6">Grid Mesh Res</th>
                      <th className="py-3 px-4 sm:px-6">Spatial Nodes</th>
                      <th className="py-3 px-4 sm:px-6 text-[#1d1d1f]">
                        2D SWE (Finite Vol)
                      </th>
                      <th className="py-3 px-4 sm:px-6 text-[#0071e3] font-bold">
                        Crestix FNO Surrogate
                      </th>
                      <th className="py-3 px-4 sm:px-6 text-teal-700 font-bold">
                        Speedup Factor*
                      </th>
                      <th className="py-3 px-4 sm:px-6">Rel. L2 Error*</th>
                      <th className="py-3 px-4 sm:px-6">Mass Residual*</th>
                      <th className="py-3 px-4 sm:px-6">Status Label</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-[#1d1d1f] font-mono text-xs">
                    {BENCHMARK_COMPARISONS.map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="py-4 px-4 sm:px-6 font-bold text-[#1d1d1f]">
                          {row.gridResolution}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-[#6e6e73]">
                          {row.spatialNodes}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-[#6e6e73]">
                          {row.numericalSolverTime}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-[#0071e3] font-bold">
                          {row.fnoSurrogateTime}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-teal-700 font-semibold">
                          {row.speedupFactor}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-[#6e6e73]">
                          {row.relativeL2Error}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-emerald-600 font-semibold">
                          {row.massConservationLoss}
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold">
                            {row.calibrationStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visual Runtime Comparison Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Forward Latency Scaling */}
              <div className="p-7 rounded-3xl bg-white border border-zinc-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-bold text-[#1d1d1f]">
                      Runtime Complexity Scaling
                    </h4>
                    <span className="text-[10px] font-mono text-[#0071e3] font-semibold">
                      O(N log N) vs O(N^(3/2))
                    </span>
                  </div>

                  <p className="text-xs text-[#6e6e73] font-sans leading-relaxed mb-6">
                    Because classical finite-volume models require smaller time
                    steps $\Delta t$ as spatial resolution $\Delta x$ refines
                    (the CFL condition $u \Delta t / \Delta x \le 1$), runtime
                    explodes exponentially. Fourier Neural Operators scale at
                    $O(N \log N)$ FFT complexity.
                  </p>

                  <div className="space-y-4 font-mono text-xs">
                    <div>
                      <div className="flex justify-between text-[#6e6e73] mb-1.5">
                        <span>2D SWE Numerical Solver (2048² Grid)</span>
                        <span className="text-rose-600 font-bold">960.0 mins (16 Hours)</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-zinc-100 overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-r from-rose-500 to-amber-500" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[#6e6e73] mb-1.5">
                        <span>Crestix FNO Surrogate (2048² Grid)</span>
                        <span className="text-[#0071e3] font-bold">94 ms (&lt; 0.1s)</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-zinc-100 overflow-hidden">
                        <div className="w-[1.2%] h-full bg-gradient-to-r from-[#0071e3] to-[#06b6d4]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-zinc-100 text-[10px] text-[#86868b] font-mono">
                  *Illustrative comparison based on NVIDIA A100 GPU tensor core benchmarks.
                </div>
              </div>

              {/* Card 2: Physics Conservation Mass Error */}
              <div className="p-7 rounded-3xl bg-white border border-zinc-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-bold text-[#1d1d1f]">
                      Mass Conservation Residuals
                    </h4>
                    <span className="text-[10px] font-mono text-emerald-600 font-semibold">
                      PINO Regularized
                    </span>
                  </div>

                  <p className="text-xs text-[#6e6e73] font-sans leading-relaxed mb-6">
                    Generic unconstrained convolutional neural networks often
                    generate or destroy water mass due to gradient accumulation.
                    Crestix Probe enforces hard PDE loss constraints to bound
                    continuity error to under 0.45%.
                  </p>

                  <div className="space-y-4 font-mono text-xs">
                    <div>
                      <div className="flex justify-between text-[#6e6e73] mb-1.5">
                        <span>Standard CNN / U-Net Surrogate (Unconstrained)</span>
                        <span className="text-rose-600 font-bold">14.2% Mass Error</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-zinc-100 overflow-hidden">
                        <div className="w-[75%] h-full bg-rose-400" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[#6e6e73] mb-1.5">
                        <span>Crestix PINO Formulation (Physics Enforced)</span>
                        <span className="text-emerald-600 font-bold">&lt; 0.45% Mass Error</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-zinc-100 overflow-hidden">
                        <div className="w-[3.5%] h-full bg-emerald-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-zinc-100 text-[10px] text-[#86868b] font-mono">
                  *Illustrative synthetic validation on closed impermeable test basins.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Academic Foundations & Peer-Reviewed Literature */}
        {activeTab === "citations" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ACADEMIC_CITATIONS.map((cit, idx) => (
              <div
                key={idx}
                className="p-7 rounded-3xl bg-white border border-zinc-200/80 hover:border-blue-300 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 text-xs font-mono text-[#0071e3] font-semibold">
                    <span>CITATION [{idx + 1}]</span>
                    <span className="text-[#86868b]">{cit.year}</span>
                  </div>

                  <h4 className="text-base font-bold text-[#1d1d1f] mb-2 leading-snug">
                    {cit.title}
                  </h4>

                  <p className="text-xs text-[#86868b] font-mono mb-3">
                    {cit.authors}
                  </p>

                  <div className="p-3.5 rounded-2xl bg-[#f5f5f7] border border-black/[0.04] text-xs text-[#515154] font-sans mb-4">
                    <span className="text-[#86868b] font-mono text-[11px] block mb-1">
                      Venue: {cit.venue}
                    </span>
                    <strong className="text-[#0071e3]">Methodological Anchor: </strong>
                    {cit.contribution}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] font-mono text-[#86868b]">
                  <span>Theoretical Base</span>
                  <span>Peer-Reviewed Literature</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
