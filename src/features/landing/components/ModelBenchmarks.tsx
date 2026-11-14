"use client";

import React, { useState } from "react";
import {
  BarChart2,
  CheckCircle2,
  Zap,
  Shield,
  Layers,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { ML_MODEL_BENCHMARKS } from "../data/researchData";
import { cn } from "../utils/cn";

export function ModelBenchmarks() {
  const [splitMode, setSplitMode] = useState<"common" | "native" | "dual">("common");
  const [activeMetricFilter, setActiveMetricFilter] = useState<"all" | "auroc" | "prauc" | "f1">("all");

  return (
    <section
      id="benchmarks"
      className="relative py-28 bg-[#fbfbfd] border-b border-black/[0.06] overflow-hidden"
    >
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[500px] bg-blue-500/[0.03] blur-[150px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-[#0071e3] text-xs font-mono mb-4 font-semibold">
            <BarChart2 className="w-3.5 h-3.5 text-[#0071e3]" />
            <span>EMPIRICAL BENCHMARK EVALUATION</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-6">
            Multi-Model Evaluation &amp; Comparative Analysis
          </h2>

          <p className="text-base sm:text-lg text-[#6e6e73] leading-relaxed">
            Evaluated on the LarNO UKEA 32 &times; 32 urban catchment grid
            (&Delta;x = 8m, &Delta;t = 5 min) at a +30 min
            forecast horizon against the UK Environment Agency standard inundation
            threshold (&tau; &ge; 0.03m).
          </p>
        </div>

        {/* View Controls & Filter Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          {/* Segmented Split Toggle (Apple Style) */}
          <div className="flex items-center gap-1 bg-[#f0f0f3] p-1 rounded-full border border-black/[0.04] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSplitMode("common")}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                splitMode === "common"
                  ? "bg-white text-[#1d1d1f] shadow-xs font-semibold"
                  : "text-[#6e6e73] hover:text-[#1d1d1f]"
              )}
            >
              Common Split (event_004)
            </button>
            <button
              type="button"
              onClick={() => setSplitMode("native")}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                splitMode === "native"
                  ? "bg-white text-[#1d1d1f] shadow-xs font-semibold"
                  : "text-[#6e6e73] hover:text-[#1d1d1f]"
              )}
            >
              Native Repo Splits
            </button>
            <button
              type="button"
              onClick={() => setSplitMode("dual")}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                splitMode === "dual"
                  ? "bg-white text-[#1d1d1f] shadow-xs font-semibold"
                  : "text-[#6e6e73] hover:text-[#1d1d1f]"
              )}
            >
              Side-by-Side Dual View
            </button>
          </div>

          {/* Metric Highlight Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#86868b] font-mono">Highlight:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveMetricFilter("all")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all",
                  activeMetricFilter === "all"
                    ? "bg-[#1d1d1f] text-white shadow-xs"
                    : "bg-white border border-zinc-200 text-[#6e6e73] hover:text-[#1d1d1f]"
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActiveMetricFilter("auroc")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all",
                  activeMetricFilter === "auroc"
                    ? "bg-[#0071e3] text-white shadow-xs font-semibold"
                    : "bg-blue-50/80 border border-blue-200/70 text-[#0071e3]"
                )}
              >
                AUROC
              </button>
              <button
                type="button"
                onClick={() => setActiveMetricFilter("prauc")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all",
                  activeMetricFilter === "prauc"
                    ? "bg-emerald-600 text-white shadow-xs font-semibold"
                    : "bg-emerald-50 border border-emerald-200 text-emerald-700"
                )}
              >
                PR-AUC
              </button>
              <button
                type="button"
                onClick={() => setActiveMetricFilter("f1")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all",
                  activeMetricFilter === "f1"
                    ? "bg-amber-600 text-white shadow-xs font-semibold"
                    : "bg-amber-50 border border-amber-200 text-amber-800"
                )}
              >
                F1-Score
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Multi-Model Grid */}
        <div
          className={cn(
            "grid gap-6 mb-10",
            splitMode === "dual" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
          )}
        >
          {/* Panel 1: Standardized Common Benchmark Split */}
          {(splitMode === "common" || splitMode === "dual") && (
            <div className="p-7 sm:p-9 rounded-3xl bg-white border border-zinc-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h3 className="font-mono text-sm font-bold text-[#1d1d1f] uppercase tracking-wider">
                      Standardized Common Benchmark Split (event_004)
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    Controlled 30,720 Cells
                  </span>
                </div>

                <p className="text-xs text-[#6e6e73] font-sans mb-6">
                  Evaluated with identical Saint-Venant hydraulic features,
                  causal elevation lags, and train-only standard scaling at +30 min lead time.
                </p>

                {/* Model Cards */}
                <div className="space-y-4">
                  {ML_MODEL_BENCHMARKS.map((m) => (
                    <div
                      key={m.id}
                      className="p-5 rounded-2xl bg-[#fbfbfd] border border-zinc-200/70 hover:border-blue-300 transition-all shadow-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#1d1d1f]">
                            {m.rank === 1 ? "🥇" : m.rank === 2 ? "🥈" : "🥉"}{" "}
                            {m.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-[#0071e3] border border-blue-200/60 font-semibold">
                            {m.latencyMs} ms / frame
                          </span>
                          <span className="text-[10px] font-mono text-[#86868b]">
                            {m.badge}
                          </span>
                        </div>
                      </div>

                      {/* 3 Metric Bars with Values */}
                      <div className="grid grid-cols-3 gap-3 font-mono text-center">
                        {/* AUROC */}
                        <div
                          className={cn(
                            "p-2.5 rounded-xl border transition-all",
                            activeMetricFilter === "auroc" || activeMetricFilter === "all"
                              ? "bg-blue-50/80 border-blue-200/80"
                              : "opacity-30 bg-zinc-50 border-zinc-200"
                          )}
                        >
                          <div className="text-[10px] text-[#86868b] uppercase">AUROC</div>
                          <div className="text-base font-bold text-[#0071e3]">
                            {m.common.auroc.toFixed(3)}
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-blue-100 mt-1 overflow-hidden">
                            <div
                              className="h-full bg-[#0071e3] rounded-full"
                              style={{ width: `${m.common.auroc * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* PR-AUC */}
                        <div
                          className={cn(
                            "p-2.5 rounded-xl border transition-all",
                            activeMetricFilter === "prauc" || activeMetricFilter === "all"
                              ? "bg-emerald-50/80 border-emerald-200/80"
                              : "opacity-30 bg-zinc-50 border-zinc-200"
                          )}
                        >
                          <div className="text-[10px] text-[#86868b] uppercase">PR-AUC</div>
                          <div className="text-base font-bold text-emerald-600">
                            {m.common.prauc.toFixed(3)}
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-emerald-100 mt-1 overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 rounded-full"
                              style={{ width: `${m.common.prauc * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* F1-Score */}
                        <div
                          className={cn(
                            "p-2.5 rounded-xl border transition-all",
                            activeMetricFilter === "f1" || activeMetricFilter === "all"
                              ? "bg-amber-50/80 border-amber-200/80"
                              : "opacity-30 bg-zinc-50 border-zinc-200"
                          )}
                        >
                          <div className="text-[10px] text-[#86868b] uppercase">F1-Score</div>
                          <div className="text-base font-bold text-amber-600">
                            {m.common.f1.toFixed(3)}
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-amber-100 mt-1 overflow-hidden">
                            <div
                              className="h-full bg-amber-600 rounded-full"
                              style={{ width: `${m.common.f1 * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Supporting Physics Line */}
                      <p className="mt-3 text-[11px] text-[#6e6e73] font-sans leading-relaxed">
                        {m.keyAdvantage}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-[11px] font-mono text-[#86868b]">
                <span>MAE Range: 0.0054m – 0.0178m</span>
                <span className="text-emerald-600 font-semibold">
                  Zero Data Leakage Verified
                </span>
              </div>
            </div>
          )}

          {/* Panel 2: Native Repository Reported Benchmarks */}
          {(splitMode === "native" || splitMode === "dual") && (
            <div className="p-7 sm:p-9 rounded-3xl bg-white border border-zinc-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h3 className="font-mono text-sm font-bold text-[#1d1d1f] uppercase tracking-wider">
                      Native Repository Reported Benchmarks
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                    Extreme Inundation Test Sets
                  </span>
                </div>

                <p className="text-xs text-[#6e6e73] font-sans mb-6">
                  Stress-tested on out-of-distribution 20-year, 100-year, and 200-year return
                  period storm events with hydrodynamic wave jumps.
                </p>

                {/* Model Cards */}
                <div className="space-y-4">
                  {ML_MODEL_BENCHMARKS.map((m) => (
                    <div
                      key={m.id}
                      className="p-5 rounded-2xl bg-[#fbfbfd] border border-zinc-200/70 hover:border-amber-300 transition-all shadow-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#1d1d1f]">
                            {m.rank === 1 ? "🥇" : m.rank === 2 ? "🥈" : "🥉"}{" "}
                            {m.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-[#515154] border border-zinc-200">
                          {m.native.context}
                        </span>
                      </div>

                      {/* 3 Metric Bars with Values */}
                      <div className="grid grid-cols-3 gap-3 font-mono text-center">
                        {/* AUROC */}
                        <div
                          className={cn(
                            "p-2.5 rounded-xl border transition-all",
                            activeMetricFilter === "auroc" || activeMetricFilter === "all"
                              ? "bg-blue-50/80 border-blue-200/80"
                              : "opacity-30 bg-zinc-50 border-zinc-200"
                          )}
                        >
                          <div className="text-[10px] text-[#86868b] uppercase">AUROC</div>
                          <div className="text-base font-bold text-[#0071e3]">
                            {m.native.auroc.toFixed(3)}
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-blue-100 mt-1 overflow-hidden">
                            <div
                              className="h-full bg-[#0071e3] rounded-full"
                              style={{ width: `${m.native.auroc * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* PR-AUC */}
                        <div
                          className={cn(
                            "p-2.5 rounded-xl border transition-all",
                            activeMetricFilter === "prauc" || activeMetricFilter === "all"
                              ? "bg-emerald-50/80 border-emerald-200/80"
                              : "opacity-30 bg-zinc-50 border-zinc-200"
                          )}
                        >
                          <div className="text-[10px] text-[#86868b] uppercase">PR-AUC</div>
                          <div className="text-base font-bold text-emerald-600">
                            {m.native.prauc.toFixed(3)}
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-emerald-100 mt-1 overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 rounded-full"
                              style={{ width: `${m.native.prauc * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* F1-Score */}
                        <div
                          className={cn(
                            "p-2.5 rounded-xl border transition-all",
                            activeMetricFilter === "f1" || activeMetricFilter === "all"
                              ? "bg-amber-50/80 border-amber-200/80"
                              : "opacity-30 bg-zinc-50 border-zinc-200"
                          )}
                        >
                          <div className="text-[10px] text-[#86868b] uppercase">F1-Score</div>
                          <div className="text-base font-bold text-amber-600">
                            {m.native.f1.toFixed(3)}
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-amber-100 mt-1 overflow-hidden">
                            <div
                              className="h-full bg-amber-600 rounded-full"
                              style={{ width: `${m.native.f1 * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#86868b]">
                        <span>Variance: R² = {m.native.r2.toFixed(3)}</span>
                        <span className="text-[#0071e3]">τ ≥ 0.03m Inundation</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-[11px] font-mono text-[#86868b]">
                <span>Tested against UKEA 20yr, 100yr, 200yr</span>
                <span className="text-amber-700 font-semibold">
                  Extreme Hydrodynamic Stress
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Operational Deployment Recommendation Matrix */}
        <div className="p-7 sm:p-9 rounded-3xl bg-white border border-zinc-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-100">
            <div>
              <h4 className="text-lg font-bold text-[#1d1d1f]">
                Operational Model Deployment Matrix
              </h4>
              <p className="text-xs text-[#6e6e73] font-mono">
                Matching machine learning architectures to edge and municipal compute tiers
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-blue-50 text-[#0071e3] border border-blue-200 font-semibold self-start sm:self-auto">
              PRODUCTION SELECTION
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tier 1 */}
            <div className="p-5 rounded-2xl bg-[#fbfbfd] border border-zinc-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#0071e3] mb-2">
                  <Zap className="w-4 h-4" />
                  <span>EDGE SENSOR MESH (ESP32)</span>
                </div>
                <h5 className="text-base font-bold text-[#1d1d1f] mb-1">
                  Linear Regression (OLS)
                </h5>
                <p className="text-xs text-[#6e6e73] leading-relaxed mb-4">
                  Runs in <strong>0.03 ms</strong> per frame with a 12 KB memory footprint.
                  Directly embedded in ESP32 microcontroller C++ firmware for real-time local flood detection.
                </p>
              </div>
              <div className="pt-3 border-t border-zinc-200/60 text-[11px] font-mono text-emerald-600 font-semibold">
                ✓ Ultra-low battery consumption
              </div>
            </div>

            {/* Tier 2 */}
            <div className="p-5 rounded-2xl bg-[#fbfbfd] border border-zinc-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#0071e3] mb-2">
                  <Shield className="w-4 h-4" />
                  <span>CITYWIDE WARNING SERVER</span>
                </div>
                <h5 className="text-base font-bold text-[#1d1d1f] mb-1">
                  XGBoost (Gradient Boosted)
                </h5>
                <p className="text-xs text-[#6e6e73] leading-relaxed mb-4">
                  Highest flood wavefront recall (<strong>95.6%</strong>). Effectively resolves
                  non-linear road overtopping, culvert backflow, and structural building barrier choke points.
                </p>
              </div>
              <div className="pt-3 border-t border-zinc-200/60 text-[11px] font-mono text-[#0071e3] font-semibold">
                ✓ Maximum life-safety early warning
              </div>
            </div>

            {/* Tier 3 */}
            <div className="p-5 rounded-2xl bg-[#fbfbfd] border border-zinc-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#0071e3] mb-2">
                  <Layers className="w-4 h-4" />
                  <span>ENSEMBLE &amp; UNCERTAINTY</span>
                </div>
                <h5 className="text-base font-bold text-[#1d1d1f] mb-1">
                  Random Forest + XGBoost
                </h5>
                <p className="text-xs text-[#6e6e73] leading-relaxed mb-4">
                  Bagged tree variance reduction provides epistemic uncertainty bands
                  alongside deterministic water-depth predictions for civil defense decision support.
                </p>
              </div>
              <div className="pt-3 border-t border-zinc-200/60 text-[11px] font-mono text-amber-700 font-semibold">
                ✓ Confidence-bounded evac route routing
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
