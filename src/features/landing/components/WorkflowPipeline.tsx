"use client";

import React, { useState } from "react";
import {
  Mountain,
  CloudRain,
  Cpu,
  Zap,
  Radio,
  Workflow,
  CheckCircle2,
  Layers,
  Code2,
  Clock,
  Gauge,
} from "lucide-react";
import { WORKFLOW_STAGES } from "../data/workflowData";
import { cn } from "../utils/cn";

export function WorkflowPipeline() {
  const [activeStageIndex, setActiveStageIndex] = useState(3); // default to AI Forecast (stage 4)
  const currentStage = WORKFLOW_STAGES[activeStageIndex];

  const getStageIcon = (name: string) => {
    switch (name) {
      case "Mountain":
        return <Mountain className="w-5 h-5 text-[#0071e3]" />;
      case "CloudRain":
        return <CloudRain className="w-5 h-5 text-[#0284c7]" />;
      case "Cpu":
        return <Cpu className="w-5 h-5 text-[#1d1d1f]" />;
      case "Zap":
        return <Zap className="w-5 h-5 text-[#0071e3]" />;
      case "Radio":
        return <Radio className="w-5 h-5 text-emerald-600" />;
      default:
        return <Workflow className="w-5 h-5 text-[#0071e3]" />;
    }
  };

  return (
    <section
      id="workflow"
      className="relative py-28 bg-white border-b border-black/[0.06] overflow-hidden"
    >
      {/* Background Gradients */}
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[500px] bg-blue-500/[0.03] blur-[150px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-[#0071e3] text-xs font-mono mb-4 font-semibold">
            <Workflow className="w-3.5 h-3.5" />
            <span>END-TO-END PIPELINE ARCHITECTURE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-6">
            From Topography to Real-Time In-Situ Verification
          </h2>

          <p className="text-base sm:text-lg text-[#6e6e73] leading-relaxed">
            Follow the 5-stage transformation pipeline converting physical
            catchment geometry and atmospheric precipitation into live
            street-scale flood hazard predictions.
          </p>
        </div>

        {/* 5-Step Pipeline Horizontal Stepper */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-10">
          {WORKFLOW_STAGES.map((stage, idx) => {
            const isSelected = activeStageIndex === idx;
            return (
              <button
                key={stage.step}
                type="button"
                onClick={() => setActiveStageIndex(idx)}
                className={cn(
                  "p-5 rounded-3xl text-left transition-all duration-300 border flex flex-col justify-between group",
                  isSelected
                    ? "bg-[#fbfbfd] border-[#0071e3] shadow-[0_8px_30px_rgba(0,113,227,0.08)]"
                    : "bg-white border-zinc-200/80 hover:border-zinc-300 hover:bg-[#f5f5f7] shadow-xs"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span
                      className={cn(
                        "text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border",
                        isSelected
                          ? "bg-blue-50 text-[#0071e3] border-blue-200/70"
                          : "bg-[#f5f5f7] text-[#86868b] border-zinc-200"
                      )}
                    >
                      STAGE {stage.step}
                    </span>
                    <div
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                        isSelected ? "bg-blue-50" : "bg-[#f5f5f7]"
                      )}
                    >
                      {getStageIcon(stage.iconName)}
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors line-clamp-1 mb-1">
                    {stage.title}
                  </h3>

                  <p className="text-[11px] font-mono text-[#86868b]">
                    {stage.category}
                  </p>
                </div>

                <div className="mt-4 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#86868b]">Latency:</span>
                  <span
                    className={
                      isSelected ? "text-[#0071e3] font-bold" : "text-[#515154]"
                    }
                  >
                    {stage.processingTime}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Stage Deep-Dive Card */}
        <div className="rounded-3xl bg-white border border-zinc-200/90 p-7 sm:p-10 shadow-[0_12px_44px_rgba(0,0,0,0.05)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left 7 Cols: Narrative & Mathematical Formulation */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#0071e3] mb-2 font-semibold">
                  <span>STAGE {currentStage.step} DEEP-DIVE</span>
                  <span className="text-zinc-300">•</span>
                  <span>{currentStage.category}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-[#1d1d1f] mb-4">
                  {currentStage.title}
                </h3>

                <p className="text-sm sm:text-base text-[#6e6e73] leading-relaxed mb-6">
                  {currentStage.summary}
                </p>

                {/* Mathematical Formulation Card (if present) */}
                {currentStage.formula && (
                  <div className="p-5 rounded-2xl bg-[#f5f5f7] border border-black/[0.05] mb-6 shadow-xs">
                    <div className="text-[10px] font-mono text-[#0071e3] uppercase tracking-widest mb-1.5 flex items-center gap-1.5 font-bold">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Mathematical Transformation</span>
                    </div>
                    <div className="font-mono text-sm sm:text-base font-bold text-[#1d1d1f] tracking-wide overflow-x-auto py-1">
                      {currentStage.formula}
                    </div>
                    {currentStage.formulaNote && (
                      <p className="text-xs text-[#6e6e73] font-sans mt-2 leading-relaxed">
                        {currentStage.formulaNote}
                      </p>
                    )}
                  </div>
                )}

                {/* Inputs & Outputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {/* Inputs */}
                  <div className="p-4 rounded-2xl bg-[#fbfbfd] border border-zinc-200/80 shadow-xs">
                    <div className="text-xs font-mono font-bold text-[#1d1d1f] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#0071e3]" />
                      <span>Ingested Inputs</span>
                    </div>
                    <ul className="space-y-2">
                      {currentStage.inputs.map((inp, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs text-[#6e6e73]"
                        >
                          <span className="text-[#0071e3] font-mono">→</span>
                          <span>{inp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Outputs */}
                  <div className="p-4 rounded-2xl bg-[#fbfbfd] border border-zinc-200/80 shadow-xs">
                    <div className="text-xs font-mono font-bold text-[#1d1d1f] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Produced Outputs</span>
                    </div>
                    <ul className="space-y-2">
                      {currentStage.outputs.map((out, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs text-[#6e6e73]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{out}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Stage Navigation Footer */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-mono">
                <button
                  type="button"
                  disabled={activeStageIndex === 0}
                  onClick={() => setActiveStageIndex((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-full bg-white border border-zinc-200 text-[#1d1d1f] hover:bg-zinc-50 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-xs"
                >
                  ← Previous Stage
                </button>
                <span className="text-[#86868b]">
                  Stage {activeStageIndex + 1} of {WORKFLOW_STAGES.length}
                </span>
                <button
                  type="button"
                  disabled={activeStageIndex === WORKFLOW_STAGES.length - 1}
                  onClick={() =>
                    setActiveStageIndex((prev) =>
                      Math.min(WORKFLOW_STAGES.length - 1, prev + 1)
                    )
                  }
                  className="px-4 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-xs"
                >
                  Next Stage →
                </button>
              </div>
            </div>

            {/* Right 5 Cols: Execution Metrics & Data Flow Telemetry */}
            <div className="lg:col-span-5 flex flex-col gap-4 font-mono text-xs">
              <div className="rounded-2xl bg-[#f8fafc] border border-zinc-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#0071e3] animate-pulse" />
                    <span className="text-[#1d1d1f] font-semibold">
                      STAGE TELEMETRY SPECS
                    </span>
                  </div>
                  <span className="text-[10px] text-[#86868b]">REALTIME</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-zinc-200 shadow-xs">
                    <span className="text-[#6e6e73] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#0071e3]" />
                      Execution Runtime:
                    </span>
                    <span className="text-[#0071e3] font-bold">
                      {currentStage.processingTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-zinc-200 shadow-xs">
                    <span className="text-[#6e6e73] flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-teal-600" />
                      Grid/Data Resolution:
                    </span>
                    <span className="text-teal-700 font-bold">
                      {currentStage.resolution}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-zinc-200 shadow-xs">
                    <span className="text-[#6e6e73] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#86868b]" />
                      Data Schema Standard:
                    </span>
                    <span className="text-[#1d1d1f] font-medium">
                      OGC / Cloud-Optimized GeoTIFF
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-zinc-200 shadow-xs">
                    <span className="text-[#6e6e73] flex items-center gap-1.5">
                      <Workflow className="w-3.5 h-3.5 text-[#0071e3]" />
                      Next Pipeline Handoff:
                    </span>
                    <span className="text-[#0071e3] font-semibold">
                      {activeStageIndex < WORKFLOW_STAGES.length - 1
                        ? WORKFLOW_STAGES[activeStageIndex + 1].title.split(" ")[0]
                        : "Continuous Telemetry"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Pipeline Security & Integrity Pill */}
              <div className="p-4 rounded-2xl bg-white border border-zinc-200/90 text-xs shadow-xs">
                <div className="text-[#0071e3] font-bold mb-1">
                  Closed-Loop Continuity
                </div>
                <p className="text-[#6e6e73] font-sans text-xs leading-relaxed">
                  Notice how Stage 5 (In-Situ Sensor Validation) feeds back
                  directly into Stage 4 (AI Surrogate) to adjust boundary
                  conditions and Manning friction, guaranteeing zero long-term
                  model drift.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
