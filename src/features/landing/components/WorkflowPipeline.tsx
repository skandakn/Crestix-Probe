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
        return <Mountain className="w-5 h-5 text-cyan-400" />;
      case "CloudRain":
        return <CloudRain className="w-5 h-5 text-teal-400" />;
      case "Cpu":
        return <Cpu className="w-5 h-5 text-slate-300" />;
      case "Zap":
        return <Zap className="w-5 h-5 text-cyan-300" />;
      case "Radio":
        return <Radio className="w-5 h-5 text-emerald-400" />;
      default:
        return <Workflow className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <section
      id="workflow"
      className="relative py-24 bg-[#07090e] border-b border-slate-800/80 overflow-hidden"
    >
      {/* Background Gradients */}
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[500px] bg-teal-950/15 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-4">
            <Workflow className="w-3.5 h-3.5" />
            <span>END-TO-END PIPELINE ARCHITECTURE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6">
            From Topography to Real-Time In-Situ Verification
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Follow the 5-stage transformation pipeline converting physical
            catchment geometry and atmospheric precipitation into live
            street-scale flood hazard predictions.
          </p>
        </div>

        {/* 5-Step Pipeline Horizontal Stepper */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-10">
          {WORKFLOW_STAGES.map((stage, idx) => {
            const isSelected = activeStageIndex === idx;
            return (
              <button
                key={stage.step}
                type="button"
                onClick={() => setActiveStageIndex(idx)}
                className={cn(
                  "p-4 rounded-xl text-left transition-all duration-300 border flex flex-col justify-between group",
                  isSelected
                    ? "bg-[#0f172a] border-cyan-400/80 shadow-lg shadow-cyan-950/50"
                    : "bg-[#0b0f17] border-slate-800 hover:border-slate-700 hover:bg-[#0d121c]"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={cn(
                        "text-xs font-mono font-bold px-2 py-0.5 rounded border",
                        isSelected
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                          : "bg-slate-900 text-slate-500 border-slate-800"
                      )}
                    >
                      STAGE {stage.step}
                    </span>
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                        isSelected ? "bg-cyan-950/70" : "bg-slate-900/60"
                      )}
                    >
                      {getStageIcon(stage.iconName)}
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-white group-hover:text-cyan-200 transition-colors line-clamp-1 mb-1">
                    {stage.title}
                  </h3>

                  <p className="text-[11px] font-mono text-slate-400">
                    {stage.category}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Latency:</span>
                  <span
                    className={
                      isSelected ? "text-cyan-300 font-bold" : "text-slate-400"
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
        <div className="rounded-2xl bg-[#0b0f17] border border-cyan-500/20 p-6 sm:p-8 lg:p-10 shadow-2xl shadow-cyan-950/40">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Cols: Narrative & Mathematical Formulation */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
                  <span>STAGE {currentStage.step} DEEP-DIVE</span>
                  <span className="text-slate-600">•</span>
                  <span>{currentStage.category}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  {currentStage.title}
                </h3>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
                  {currentStage.summary}
                </p>

                {/* Mathematical Formulation Card (if present) */}
                {currentStage.formula && (
                  <div className="p-4 sm:p-5 rounded-xl bg-[#06080d] border border-cyan-500/30 mb-6 shadow-inner">
                    <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Code2 className="w-3 h-3" />
                      <span>Mathematical Transformation</span>
                    </div>
                    <div className="font-mono text-sm sm:text-base font-bold text-cyan-200 tracking-wide overflow-x-auto py-1">
                      {currentStage.formula}
                    </div>
                    {currentStage.formulaNote && (
                      <p className="text-xs text-slate-400 font-sans mt-2 leading-relaxed">
                        {currentStage.formulaNote}
                      </p>
                    )}
                  </div>
                )}

                {/* Inputs & Outputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {/* Inputs */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span>Ingested Inputs</span>
                    </div>
                    <ul className="space-y-2">
                      {currentStage.inputs.map((inp, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs text-slate-300"
                        >
                          <span className="text-cyan-400 font-mono">→</span>
                          <span>{inp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Outputs */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-400" />
                      <span>Produced Outputs</span>
                    </div>
                    <ul className="space-y-2">
                      {currentStage.outputs.map((out, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs text-slate-300"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                          <span>{out}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Stage Navigation Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <button
                  type="button"
                  disabled={activeStageIndex === 0}
                  onClick={() => setActiveStageIndex((prev) => Math.max(0, prev - 1))}
                  className="px-3 py-1.5 rounded bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  ← Previous Stage
                </button>
                <span className="text-slate-500">
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
                  className="px-3 py-1.5 rounded bg-cyan-600 text-slate-950 font-bold hover:bg-cyan-500 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  Next Stage →
                </button>
              </div>
            </div>

            {/* Right 5 Cols: Execution Metrics & Data Flow Telemetry */}
            <div className="lg:col-span-5 flex flex-col gap-4 font-mono text-xs">
              <div className="rounded-xl bg-[#06080d] border border-slate-800 p-5 shadow-inner">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                    <span className="text-slate-300 font-semibold">
                      STAGE TELEMETRY SPECS
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">REALTIME</span>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/70 border border-slate-800/80">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      Execution Runtime:
                    </span>
                    <span className="text-cyan-300 font-bold">
                      {currentStage.processingTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/70 border border-slate-800/80">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-teal-400" />
                      Grid/Data Resolution:
                    </span>
                    <span className="text-teal-300 font-bold">
                      {currentStage.resolution}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/70 border border-slate-800/80">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      Data Schema Standard:
                    </span>
                    <span className="text-slate-200">
                      OGC / Cloud-Optimized GeoTIFF
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/70 border border-slate-800/80">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Workflow className="w-3.5 h-3.5 text-cyan-400" />
                      Next Pipeline Handoff:
                    </span>
                    <span className="text-cyan-300">
                      {activeStageIndex < WORKFLOW_STAGES.length - 1
                        ? WORKFLOW_STAGES[activeStageIndex + 1].title.split(" ")[0]
                        : "Continuous Telemetry"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Pipeline Security & Integrity Pill */}
              <div className="p-4 rounded-xl bg-[#0e1422] border border-cyan-500/20 text-xs">
                <div className="text-cyan-300 font-bold mb-1">
                  Closed-Loop Continuity
                </div>
                <p className="text-slate-400 font-sans text-xs leading-relaxed">
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
