"use client";

import React from "react";
import {
  Zap,
  Mountain,
  ShieldCheck,
  Radio,
  Compass,
  Server,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { PRODUCT_FEATURES, ProductFeature } from "../data/featuresData";
import { cn } from "../utils/cn";

export function ProductFeatures() {
  const getIcon = (name: string) => {
    switch (name) {
      case "Zap":
        return <Zap className="w-5 h-5 text-cyan-400" />;
      case "Mountain":
        return <Mountain className="w-5 h-5 text-teal-400" />;
      case "ShieldCheck":
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case "Radio":
        return <Radio className="w-5 h-5 text-sky-400" />;
      case "Compass":
        return <Compass className="w-5 h-5 text-cyan-300" />;
      case "Server":
        return <Server className="w-5 h-5 text-teal-300" />;
      default:
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <section
      id="features"
      className="relative py-24 bg-[#090d16] border-b border-slate-800/80 overflow-hidden"
    >
      {/* Background Gradients */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[400px] bg-cyan-950/20 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-500/30 text-teal-300 text-xs font-mono mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PLATFORM CAPABILITIES</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6">
            Engineered for Mission-Critical Flood Intelligence
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Every layer of Crestix Probe is designed for high-resolution
            geospatial fidelity, strict hydrodynamic conservation, and
            real-time emergency decision support.
          </p>
        </div>

        {/* 6 Grid Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {PRODUCT_FEATURES.map((feature: ProductFeature) => (
            <div
              key={feature.id}
              className="relative rounded-2xl bg-[#0b0f17] border border-slate-800/90 hover:border-cyan-500/40 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-cyan-950/30 group"
            >
              <div>
                {/* Header Icon & Badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-cyan-500/40 group-hover:bg-cyan-950/30 transition-all duration-300">
                    {getIcon(feature.iconName)}
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-cyan-300 group-hover:border-cyan-500/30 transition-colors">
                    {feature.badge}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-200 transition-colors">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-300 leading-relaxed mb-6 font-normal">
                  {feature.description}
                </p>

                {/* Technical Specification Callout */}
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 mb-6">
                  <span className="text-cyan-400 font-semibold">Spec: </span>
                  {feature.technicalSpec}
                </div>
              </div>

              {/* Metrics Readout Footer */}
              <div className="pt-4 border-t border-slate-800/80">
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  {feature.metrics.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded bg-slate-900/40 border border-slate-800/60"
                    >
                      <div className="text-[9px] text-slate-400 uppercase tracking-tight">
                        {m.label}
                      </div>
                      <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {m.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
