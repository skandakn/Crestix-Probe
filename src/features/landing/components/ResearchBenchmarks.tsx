"use client";

import React, { useState } from "react";
import {
  BarChart2,
  AlertTriangle,
  Info,
  BookOpen,
  ExternalLink,
  Cpu,
  Zap,
  TrendingUp,
  ShieldCheck,
  FileText,
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
      className="relative py-24 bg-[#090d16] border-b border-slate-800/80 overflow-hidden"
    >
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[500px] bg-cyan-950/20 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/70 border border-amber-500/30 text-amber-300 text-xs font-mono mb-4">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>{RESEARCH_DISCLAIMER.badge}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6">
            Computational Scaling &amp; Error Profiles
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Evaluating the theoretical computational complexity of spectral
            Fourier Neural Operators against classical 2D Saint-Venant
            finite-volume numerical schemes across variable spatial grid densities.
          </p>

          {/* Explicit Research Disclosure Callout Box */}
          <div className="mt-6 p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 text-amber-300/90 text-xs font-mono leading-relaxed flex items-start gap-3 shadow-md">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <strong className="text-amber-200">DATA INTEGRITY DISCLOSURE: </strong>
              {RESEARCH_DISCLAIMER.description}
            </div>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("table")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-mono font-medium transition-colors border flex items-center gap-2",
              activeTab === "table"
                ? "bg-cyan-950 border-cyan-500 text-cyan-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            )}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Scaling Benchmarks (Illustrative)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("citations")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-mono font-medium transition-colors border flex items-center gap-2",
              activeTab === "citations"
                ? "bg-cyan-950 border-cyan-500 text-cyan-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Academic Literature &amp; Citations</span>
          </button>
        </div>

        {/* Tab 1: Scaling Comparison Table & Visual Comparison */}
        {activeTab === "table" && (
          <div className="space-y-8">
            {/* The Main Benchmark Table */}
            <div className="rounded-2xl bg-[#0b0f17] border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-4 sm:p-5 bg-[#0e1422] border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-semibold">
                  BENCHMARK MATRIX: 2D SWE SOLVER VS FNO/PINO SURROGATE
                </span>
                <span className="text-amber-400 text-[10px] px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/20">
                  SYNTHETIC BENCHMARK
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm font-sans">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-mono text-xs">
                      <th className="py-3 px-4 sm:px-6">Grid Mesh Res</th>
                      <th className="py-3 px-4 sm:px-6">Spatial Nodes</th>
                      <th className="py-3 px-4 sm:px-6 text-slate-300">
                        2D SWE (Finite Vol)
                      </th>
                      <th className="py-3 px-4 sm:px-6 text-cyan-300 font-bold">
                        Crestix FNO Surrogate
                      </th>
                      <th className="py-3 px-4 sm:px-6 text-teal-300">
                        Speedup Factor*
                      </th>
                      <th className="py-3 px-4 sm:px-6">Rel. L2 Error*</th>
                      <th className="py-3 px-4 sm:px-6">Mass Residual*</th>
                      <th className="py-3 px-4 sm:px-6">Status Label</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-slate-300 font-mono text-xs">
                    {BENCHMARK_COMPARISONS.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/30">
                        <td className="py-4 px-4 sm:px-6 font-bold text-white">
                          {row.gridResolution}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-slate-400">
                          {row.spatialNodes}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-slate-400">
                          {row.numericalSolverTime}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-cyan-300 font-bold">
                          {row.fnoSurrogateTime}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-teal-300 font-semibold">
                          {row.speedupFactor}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-slate-300">
                          {row.relativeL2Error}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-emerald-400">
                          {row.massConservationLoss}
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <span className="inline-block px-2 py-0.5 rounded bg-amber-950/50 border border-amber-500/30 text-amber-300 text-[10px]">
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
              <div className="p-6 rounded-2xl bg-[#0b0f17] border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-bold text-white">
                      Runtime Complexity Scaling
                    </h4>
                    <span className="text-[10px] font-mono text-cyan-400">
                      O(N log N) vs O(N^(3/2))
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed mb-6">
                    Because classical finite-volume models require smaller time
                    steps $\Delta t$ as spatial resolution $\Delta x$ refines
                    (the CFL condition $u \Delta t / \Delta x \le 1$), runtime
                    explodes exponentially. Fourier Neural Operators scale at
                    $O(N \log N)$ FFT complexity.
                  </p>

                  <div className="space-y-4 font-mono text-xs">
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>2D SWE Numerical Solver (2048² Grid)</span>
                        <span className="text-red-400 font-bold">960.0 mins (16 Hours)</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-r from-red-600 to-amber-600" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Crestix FNO Surrogate (2048² Grid)</span>
                        <span className="text-cyan-300 font-bold">94 ms (&lt; 0.1s)</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                        <div className="w-[1.2%] h-full bg-gradient-to-r from-cyan-400 to-teal-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
                  *Illustrative comparison based on NVIDIA A100 GPU tensor core benchmarks.
                </div>
              </div>

              {/* Card 2: Physics Conservation Mass Error */}
              <div className="p-6 rounded-2xl bg-[#0b0f17] border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-bold text-white">
                      Mass Conservation Residuals
                    </h4>
                    <span className="text-[10px] font-mono text-emerald-400">
                      PINO Regularized
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed mb-6">
                    Generic unconstrained convolutional neural networks often
                    generate or destroy water mass due to gradient accumulation.
                    Crestix Probe enforces hard PDE loss constraints to bound
                    continuity error to under 0.45%.
                  </p>

                  <div className="space-y-4 font-mono text-xs">
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Standard CNN / U-Net Surrogate (Unconstrained)</span>
                        <span className="text-red-400 font-bold">14.2% Mass Error</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                        <div className="w-[75%] h-full bg-red-500/80" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Crestix PINO Formulation (Physics Enforced)</span>
                        <span className="text-emerald-400 font-bold">&lt; 0.45% Mass Error</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                        <div className="w-[3.5%] h-full bg-emerald-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
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
                className="p-6 rounded-2xl bg-[#0b0f17] border border-slate-800 hover:border-cyan-500/40 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 text-xs font-mono text-cyan-400">
                    <span>CITATION [{idx + 1}]</span>
                    <span className="text-slate-400">{cit.year}</span>
                  </div>

                  <h4 className="text-base font-bold text-white mb-2 leading-snug">
                    {cit.title}
                  </h4>

                  <p className="text-xs text-slate-400 font-mono mb-3">
                    {cit.authors}
                  </p>

                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-xs text-slate-300 font-sans mb-4">
                    <span className="text-slate-400 font-mono text-[11px] block mb-1">
                      Venue: {cit.venue}
                    </span>
                    <strong className="text-cyan-300">Methodological Anchor: </strong>
                    {cit.contribution}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Theoretical Base</span>
                  <span className="text-slate-400">Peer-Reviewed Literature</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
