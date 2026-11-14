"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Play,
  Radio,
  ChevronRight,
} from "lucide-react";
import { cn } from "../utils/cn";

export function Hero() {
  const [activeTab, setActiveTab] = useState<"depth" | "velocity">("depth");

  return (
    <section
      id="overview"
      className="relative min-h-[92vh] pt-32 pb-24 flex flex-col justify-center overflow-hidden bg-white border-b border-black/[0.06]"
    >
      {/* Background Subtle Precision Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000006_1px,transparent_1px),linear-gradient(to_bottom,#00000006_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Atmospheric Soft Gradients (Apple Light Style) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-500/[0.04] blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[350px] bg-cyan-400/[0.04] blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[300px] bg-sky-300/[0.05] blur-[120px] rounded-full pointer-events-none" />

      {/* Subtle Topographic Contour SVG Overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <svg
          className="w-full h-full object-cover"
          viewBox="0 0 1440 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-100,200 C300,150 600,350 900,220 C1200,90 1400,250 1600,180"
            stroke="#0284c7"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
          <path
            d="M-100,320 C250,280 550,450 850,340 C1150,230 1350,380 1600,300"
            stroke="#0071e3"
            strokeWidth="1.4"
          />
          <path
            d="M-100,440 C200,400 500,560 800,460 C1100,360 1300,520 1600,420"
            stroke="#0ea5e9"
            strokeWidth="1.2"
            strokeDasharray="8 6"
          />
          <path
            d="M-100,560 C150,520 450,680 750,580 C1050,480 1250,650 1600,550"
            stroke="#0284c7"
            strokeWidth="1.6"
          />
        </svg>
      </div>


      {/* Main Hero Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Headline & Narrative */}
          <div className="lg:col-span-7 flex flex-col">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/70 w-fit mb-6 shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-[#0071e3] animate-ping" />
              <span className="text-xs font-mono font-semibold tracking-wider text-[#0071e3] uppercase">
                Predicting the Flow of Tomorrow
              </span>
            </div>

            {/* Editorial Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1d1d1f] leading-[1.08] mb-6">
              Physics-Informed Real-Time Urban Flood Forecasting at{" "}
              <span className="bg-gradient-to-r from-[#0071e3] via-[#0284c7] to-[#06b6d4] bg-clip-text text-transparent">
                Street-Scale
              </span>{" "}
              Resolution.
            </h1>

            {/* Clear Product Description */}
            <p className="text-lg sm:text-xl text-[#6e6e73] leading-relaxed max-w-2xl font-normal mb-8">
              A physics-informed AI platform for real-time urban flood
              forecasting using{" "}
              <strong className="text-[#1d1d1f] font-semibold">
                hydrodynamic simulation
              </strong>
              ,{" "}
              <strong className="text-[#0071e3] font-semibold">
                neural surrogate models
              </strong>{" "}
              and{" "}
              <strong className="text-[#1d1d1f] font-semibold">
                physical sensor validation
              </strong>
              .
            </p>

            {/* Scientific Architecture Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10 max-w-2xl">
              <div className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-blue-400/50 hover:shadow-md transition-all">
                <div className="text-[10px] font-mono text-[#86868b] uppercase tracking-wider mb-1">
                  Physics Base
                </div>
                <div className="text-xs font-semibold text-[#1d1d1f]">
                  2D Saint-Venant SWE
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-blue-400/50 hover:shadow-md transition-all">
                <div className="text-[10px] font-mono text-[#86868b] uppercase tracking-wider mb-1">
                  AI Architecture
                </div>
                <div className="text-xs font-semibold text-[#0071e3]">
                  FNO / PINO Surrogate
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-blue-400/50 hover:shadow-md transition-all">
                <div className="text-[10px] font-mono text-[#86868b] uppercase tracking-wider mb-1">
                  Forward Latency
                </div>
                <div className="text-xs font-semibold text-emerald-600">
                  &lt; 42ms Inference
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-blue-400/50 hover:shadow-md transition-all">
                <div className="text-[10px] font-mono text-[#86868b] uppercase tracking-wider mb-1">
                  Hardware Anchor
                </div>
                <div className="text-xs font-semibold text-[#1d1d1f]">
                  ESP32 Ultrasonic Node
                </div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#simulation"
                className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-sm tracking-normal shadow-md shadow-blue-500/20 transition-all duration-200 active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Explore Interactive Simulation</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="#hardware"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-white hover:bg-[#f5f5f7] border border-zinc-200/90 text-[#1d1d1f] font-medium text-sm transition-all duration-200 shadow-xs"
              >
                <Radio className="w-4 h-4 text-[#0071e3]" />
                <span>View ESP32 Sensor Hardware</span>
              </a>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-3.5 text-xs font-mono text-[#6e6e73] hover:text-[#0071e3] transition-colors"
              >
                <span>Mission Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: High-End Geospatial Simulation Teaser Display */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl bg-white border border-zinc-200/90 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.06)] overflow-hidden">
              {/* Header Bar of Teaser */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#0071e3] animate-pulse" />
                  <span className="font-semibold text-[#1d1d1f]">
                    HYDRODYNAMIC WAVE ENGINE
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[#86868b] text-[11px]">
                  <span>SURROGATE: LarNO</span>
                  <span className="text-zinc-300">|</span>
                  <span className="text-emerald-600 font-semibold">t=30m</span>
                </div>
              </div>

              {/* Viewport Control Tabs (Apple segmented control) */}
              <div className="flex items-center gap-1.5 mb-3 bg-[#f5f5f7] p-1 rounded-full border border-black/[0.04]">
                <button
                  type="button"
                  onClick={() => setActiveTab("depth")}
                  className={cn(
                    "flex-1 py-1 rounded-full text-[11px] font-mono transition-colors text-center font-medium",
                    activeTab === "depth"
                      ? "bg-white text-[#1d1d1f] shadow-xs"
                      : "text-[#6e6e73] hover:text-[#1d1d1f]"
                  )}
                >
                  Water Depth (h)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("velocity")}
                  className={cn(
                    "flex-1 py-1 rounded-full text-[11px] font-mono transition-colors text-center font-medium",
                    activeTab === "velocity"
                      ? "bg-white text-[#1d1d1f] shadow-xs"
                      : "text-[#6e6e73] hover:text-[#1d1d1f]"
                  )}
                >
                  Velocity (u,v)
                </button>
              </div>

              {/* Interactive Visual Map Area (SVG Canvas) */}
              <div className="relative aspect-[4/3] rounded-2xl bg-[#f8fafc] border border-zinc-200/70 overflow-hidden flex items-center justify-center">
                {/* SVG Hydrodynamic Visualisation */}
                <svg
                  className="w-full h-full"
                  viewBox="0 0 500 360"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    {/* Water Depth Gradients (Apple Vibrant Cyan-Blue) */}
                    <linearGradient id="floodGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0071e3" stopOpacity="0.75" />
                      <stop offset="50%" stopColor="#0284c7" stopOpacity="0.65" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.35" />
                    </linearGradient>

                    <radialGradient id="nodePulseLight" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#0071e3" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#0071e3" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Terrain Elevation Contour Lines */}
                  <g opacity="0.6" stroke="#cbd5e1" strokeWidth="1">
                    <ellipse cx="250" cy="180" rx="220" ry="140" strokeDasharray="3 3" />
                    <ellipse cx="250" cy="180" rx="170" ry="105" />
                    <ellipse cx="250" cy="180" rx="120" ry="70" strokeDasharray="4 2" />
                    <ellipse cx="250" cy="180" rx="70" ry="40" />
                  </g>

                  {/* Urban Street Grid Vectors */}
                  <g opacity="0.4" stroke="#94a3b8" strokeWidth="1.2">
                    <line x1="60" y1="90" x2="440" y2="90" />
                    <line x1="40" y1="180" x2="460" y2="180" />
                    <line x1="60" y1="270" x2="440" y2="270" />
                    <line x1="120" y1="40" x2="120" y2="320" />
                    <line x1="250" y1="30" x2="250" y2="330" />
                    <line x1="380" y1="40" x2="380" y2="320" />
                  </g>

                  {/* Flood Inundation Polygon (Dynamic Water Front) */}
                  <path
                    d="M 90,190 Q 180,120 280,160 T 420,180 Q 400,260 290,270 T 110,250 Z"
                    fill="url(#floodGradLight)"
                    stroke="#0284c7"
                    strokeWidth="1.8"
                    className="transition-all duration-700"
                  />

                  {/* High Depth Channel Core */}
                  <path
                    d="M 160,195 Q 220,165 290,185 T 370,195 Q 350,240 270,245 T 180,235 Z"
                    fill="#0284c7"
                    fillOpacity="0.45"
                    stroke="#0071e3"
                    strokeWidth="1.4"
                  />

                  {/* Velocity Vector Streamlines */}
                  <g stroke="#0369a1" strokeWidth="1.4" opacity="0.9">
                    <path d="M 120,175 L 145,185 M 145,185 L 138,181 M 145,185 L 140,189" />
                    <path d="M 210,150 L 235,168 M 235,168 L 227,166 M 235,168 L 230,173" />
                    <path d="M 320,155 L 300,175 M 300,175 L 305,168 M 300,175 L 307,175" />
                    <path d="M 360,210 L 330,220 M 330,220 L 336,214 M 330,220 L 338,222" />
                    <path d="M 220,260 L 245,245 M 245,245 L 237,247 M 245,245 L 242,252" />
                  </g>

                  {/* Physical ESP32 Sensor Nodes (Pulsing Beacons) */}
                  {/* Node 1: Culvert Outfall */}
                  <g className="cursor-pointer">
                    <circle cx="160" cy="180" r="16" fill="url(#nodePulseLight)" />
                    <circle cx="160" cy="180" r="4.5" fill="#0071e3" stroke="#ffffff" strokeWidth="2" />
                    <text x="172" y="176" fill="#1d1d1f" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      CX-N01: 0.76m
                    </text>
                  </g>

                  {/* Node 2: Canal Junction */}
                  <g className="cursor-pointer">
                    <circle cx="280" cy="210" r="18" fill="url(#nodePulseLight)" />
                    <circle cx="280" cy="210" r="4.5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                    <text x="292" y="206" fill="#1d1d1f" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      CX-N02: 0.88m
                    </text>
                  </g>

                  {/* Node 3: Low Depression */}
                  <g className="cursor-pointer">
                    <circle cx="370" cy="185" r="14" fill="url(#nodePulseLight)" />
                    <circle cx="370" cy="185" r="4.5" fill="#0ea5e9" stroke="#ffffff" strokeWidth="2" />
                    <text x="382" y="181" fill="#1d1d1f" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      CX-N03: 0.62m
                    </text>
                  </g>

                  {/* Critical Inundation Alert Marker */}
                  <g transform="translate(240, 160)">
                    <rect x="0" y="0" width="88" height="20" rx="6" fill="#ffffff" stroke="#ef4444" strokeWidth="1.2" />
                    <circle cx="10" cy="10" r="3" fill="#ef4444" className="animate-ping" />
                    <text x="20" y="14" fill="#b91c1c" fontSize="8" fontFamily="monospace" fontWeight="bold">
                      SURCHARGE WARN
                    </text>
                  </g>
                </svg>

                {/* Corner Geospatial Crosshairs */}
                <div className="absolute top-2 left-2 text-[9px] font-mono text-[#86868b]">
                  + 22.5431° N (Shenzhen)
                </div>
                <div className="absolute top-2 right-2 text-[9px] font-mono text-[#86868b]">
                  + 114.0579° E
                </div>
                <div className="absolute bottom-2 left-2 text-[9px] font-mono text-[#0071e3] font-medium">
                  GRID: 1024×1024 • RES: 0.5M
                </div>
                <div className="absolute bottom-2 right-2 text-[9px] font-mono text-[#86868b]">
                  SCALE: 1:5000
                </div>
              </div>

              {/* Bottom Quick Readout Strip */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-100 text-center font-mono">
                <div className="p-2.5 rounded-xl bg-[#f5f5f7] border border-black/[0.04]">
                  <div className="text-[10px] text-[#86868b]">Peak Depth</div>
                  <div className="text-sm font-bold text-[#0071e3]">0.95 m</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#f5f5f7] border border-black/[0.04]">
                  <div className="text-[10px] text-[#86868b]">Inundation Area</div>
                  <div className="text-sm font-bold text-[#0284c7]">2.15 km²</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#f5f5f7] border border-black/[0.04]">
                  <div className="text-[10px] text-[#86868b]">Mass Residual</div>
                  <div className="text-sm font-bold text-emerald-600">&lt; 0.39%</div>
                </div>
              </div>

              {/* Research Disclosure Caption */}
              <div className="mt-2.5 text-[10px] text-[#86868b] font-mono text-center">
                *Illustrative numerical simulation calibrated on synthetic urban basin benchmarks.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
