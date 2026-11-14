"use client";

import React from "react";
import {
  Zap,
  Mountain,
  ShieldCheck,
  Radio,
  Compass,
  Server,
  Sparkles,
} from "lucide-react";
import { PRODUCT_FEATURES, ProductFeature } from "../data/featuresData";

export function ProductFeatures() {
  const getIcon = (name: string) => {
    switch (name) {
      case "Zap":
        return <Zap className="w-5 h-5 text-[#0071e3]" />;
      case "Mountain":
        return <Mountain className="w-5 h-5 text-[#0284c7]" />;
      case "ShieldCheck":
        return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case "Radio":
        return <Radio className="w-5 h-5 text-[#0071e3]" />;
      case "Compass":
        return <Compass className="w-5 h-5 text-[#0284c7]" />;
      case "Server":
        return <Server className="w-5 h-5 text-indigo-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#0071e3]" />;
    }
  };

  return (
    <section
      id="features"
      className="relative py-28 bg-[#f5f5f7] border-b border-black/[0.06] overflow-hidden"
    >
      {/* Background Gradients */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[400px] bg-blue-500/[0.03] blur-[150px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-[#0071e3] text-xs font-mono mb-4 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PLATFORM CAPABILITIES</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-6">
            Engineered for Mission-Critical Flood Intelligence
          </h2>

          <p className="text-base sm:text-lg text-[#6e6e73] leading-relaxed">
            Every layer of Crestix Probe is designed for high-resolution
            geospatial fidelity, strict hydrodynamic conservation, and
            real-time emergency decision support.
          </p>
        </div>

        {/* 6 Grid Feature Cards (Apple Bento Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {PRODUCT_FEATURES.map((feature: ProductFeature) => (
            <div
              key={feature.id}
              className="relative rounded-3xl bg-white border border-zinc-200/80 hover:border-blue-300 p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] group"
            >
              <div>
                {/* Header Icon & Badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {getIcon(feature.iconName)}
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#f5f5f7] border border-zinc-200 text-[#6e6e73] group-hover:text-[#0071e3] group-hover:border-blue-200 transition-colors">
                    {feature.badge}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-[#1d1d1f] mb-3 group-hover:text-[#0071e3] transition-colors">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-[#6e6e73] leading-relaxed mb-6 font-normal">
                  {feature.description}
                </p>

                {/* Technical Specification Callout */}
                <div className="p-3.5 rounded-2xl bg-[#f5f5f7] border border-black/[0.04] text-[11px] font-mono text-[#515154] mb-6">
                  <span className="text-[#0071e3] font-semibold">Spec: </span>
                  {feature.technicalSpec}
                </div>
              </div>

              {/* Metrics Readout Footer */}
              <div className="pt-4 border-t border-zinc-100">
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  {feature.metrics.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-[#fbfbfd] border border-zinc-200/60"
                    >
                      <div className="text-[9px] text-[#86868b] uppercase tracking-tight">
                        {m.label}
                      </div>
                      <div className="text-xs font-bold text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors mt-0.5">
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
