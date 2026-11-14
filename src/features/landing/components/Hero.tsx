"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Play,
  Radio,
  ChevronRight,
  Compass,
} from "lucide-react";
import { cn } from "../utils/cn";

export function Hero() {
  const [activeTab, setActiveTab] = useState<"depth" | "velocity" | "terrain">("depth");

  return (
    <section
      id="overview"
      className="relative min-h-[92vh] pt-32 pb-20 flex flex-col justify-center overflow-hidden bg-[#07090e] border-b border-cyan-950/40"
    >
      {/* Background Geospatial Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d0f_1px,transparent_1px),linear-gradient(to_bottom,#1f293d0f_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Atmospheric Radial Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-cyan-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[350px] bg-teal-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[300px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Subtle Topographic Contour SVG Overlay */}
      <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden">
        <svg
          className="w-full h-full object-cover"
          viewBox="0 0 1440 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-100,200 C300,150 600,350 900,220 C1200,90 1400,250 1600,180"
            stroke="#22d3ee"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
          <path
            d="M-100,320 C250,280 550,450 850,340 C1150,230 1350,380 1600,300"
            stroke="#14b8a6"
            strokeWidth="1.4"
          />
          <path
            d="M-100,440 C200,400 500,560 800,460 C1100,360 1300,520 1600,420"
            stroke="#06b6d4"
            strokeWidth="1.2"
            strokeDasharray="8 6"
          />
          <path
            d="M-100,560 C150,520 450,680 750,580 C1050,480 1250,650 1600,550"
            stroke="#0e7490"
            strokeWidth="1.6"
          />
        </svg>
      </div>

      {/* Metadata Telemetry Coordinates Strip */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              GEO-BASIN: URBAN SECTOR 04-METRO
            </span>
            <span className="hidden sm:inline text-slate-600">/</span>
            <span className="hidden sm:inline">LAT 37°46&apos;38&quot;N</span>
            <span className="hidden sm:inline">LON 122°25&apos;09&quot;W</span>
            <span className="hidden md:inline">DATUM WGS84</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
              SWE-PINO RESOLUTION: 0.5M
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              16 SENSORS LINKED
            </span>
          </div>
        </div>
      </div>

      {/* Main Hero Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Headline & Narrative */}
          <div className="lg:col-span-7 flex flex-col">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-950/80 to-teal-950/80 border border-cyan-500/30 w-fit mb-6 shadow-sm shadow-cyan-950">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-mono font-medium tracking-wider text-cyan-300 uppercase">
                Predicting the Flow of Tomorrow
              </span>
            </div>

            {/* Editorial Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.08] mb-6">
              Physics-Informed Real-Time Urban Flood Forecasting at{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Street-Scale
              </span>{" "}
              Resolution.
            </h1>

            {/* Clear Product Description */}
            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl font-normal mb-8">
              A physics-informed AI platform for real-time urban flood
              forecasting using{" "}
              <strong className="text-cyan-300 font-medium">
                hydrodynamic simulation
              </strong>
              ,{" "}
              <strong className="text-teal-300 font-medium">
                neural surrogate models
              </strong>{" "}
              and{" "}
              <strong className="text-slate-100 font-medium">
                physical sensor validation
              </strong>
              .
            </p>

            {/* Scientific Architecture Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-10 max-w-2xl">
              <div className="p-3 rounded-xl bg-[#0b0f17] border border-slate-800 hover:border-cyan-500/40 transition-colors">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Physics Base
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  2D Saint-Venant SWE
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#0b0f17] border border-slate-800 hover:border-cyan-500/40 transition-colors">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  AI Architecture
                </div>
                <div className="text-xs font-semibold text-cyan-300">
                  FNO / PINO Surrogate
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#0b0f17] border border-slate-800 hover:border-cyan-500/40 transition-colors">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Forward Latency
                </div>
                <div className="text-xs font-semibold text-teal-300">
                  &lt; 42ms Inference
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#0b0f17] border border-slate-800 hover:border-cyan-500/40 transition-colors">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Hardware Anchor
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  ESP32 Ultrasonic Node
                </div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#simulation"
                className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-sm tracking-wide shadow-xl shadow-cyan-950/60 transition-all duration-200 active:scale-95"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Explore Interactive Simulation</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="#hardware"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/40 text-slate-200 hover:text-white font-medium text-sm transition-all duration-200 shadow-sm"
              >
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>View ESP32 Sensor Hardware</span>
              </a>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-3.5 text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors"
              >
                <span>Mission Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: High-End Geospatial Simulation Teaser Display */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl bg-gradient-to-b from-[#0e1422] to-[#080c14] border border-cyan-500/25 p-4 shadow-2xl shadow-cyan-950/50 overflow-hidden">
              {/* Header Bar of Teaser */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="font-semibold text-slate-200">
                    HYDRODYNAMIC WAVE ENGINE
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span>SURROGATE: FNO-2D</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-emerald-400">t=30m</span>
                </div>
              </div>

              {/* Viewport Control Tabs */}
              <div className="flex items-center gap-1.5 mb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("depth")}
                  className={cn(
                    "px-2.5 py-1 rounded text-[11px] font-mono transition-colors",
                    activeTab === "depth"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200"
                  )}
                >
                  Water Depth (h)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("velocity")}
                  className={cn(
                    "px-2.5 py-1 rounded text-[11px] font-mono transition-colors",
                    activeTab === "velocity"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200"
                  )}
                >
                  Velocity (u,v)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("terrain")}
                  className={cn(
                    "px-2.5 py-1 rounded text-[11px] font-mono transition-colors",
                    activeTab === "terrain"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200"
                  )}
                >
                  LiDAR Bathymetry
                </button>
              </div>

              {/* Interactive Visual Map Area (SVG Canvas) */}
              <div className="relative aspect-[4/3] rounded-xl bg-[#06080d] border border-slate-800/80 overflow-hidden flex items-center justify-center">
                {/* SVG Hydrodynamic Visualisation */}
                <svg
                  className="w-full h-full"
                  viewBox="0 0 500 360"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    {/* Water Depth Gradients */}
                    <linearGradient id="floodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#0284c7" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#0f172a" stopOpacity="0.2" />
                    </linearGradient>

                    <radialGradient id="nodePulse" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Terrain Elevation Contour Lines */}
                  <g opacity="0.35" stroke="#334155" strokeWidth="1">
                    <ellipse cx="250" cy="180" rx="220" ry="140" strokeDasharray="3 3" />
                    <ellipse cx="250" cy="180" rx="170" ry="105" />
                    <ellipse cx="250" cy="180" rx="120" ry="70" strokeDasharray="4 2" />
                    <ellipse cx="250" cy="180" rx="70" ry="40" />
                  </g>

                  {/* Urban Street Grid Vectors */}
                  <g opacity="0.25" stroke="#475569" strokeWidth="1.2">
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
                    fill="url(#floodGrad)"
                    stroke="#22d3ee"
                    strokeWidth="1.5"
                    className="transition-all duration-700"
                  />

                  {/* High Depth Channel Core */}
                  <path
                    d="M 160,195 Q 220,165 290,185 T 370,195 Q 350,240 270,245 T 180,235 Z"
                    fill="#38bdf8"
                    fillOpacity="0.4"
                    stroke="#67e8f9"
                    strokeWidth="1.2"
                  />

                  {/* Velocity Vector Streamlines */}
                  {activeTab !== "terrain" && (
                    <g stroke="#5eead4" strokeWidth="1.2" opacity="0.8">
                      {/* Flow vectors pointing towards depression */}
                      <path d="M 120,175 L 145,185 M 145,185 L 138,181 M 145,185 L 140,189" />
                      <path d="M 210,150 L 235,168 M 235,168 L 227,166 M 235,168 L 230,173" />
                      <path d="M 320,155 L 300,175 M 300,175 L 305,168 M 300,175 L 307,175" />
                      <path d="M 360,210 L 330,220 M 330,220 L 336,214 M 330,220 L 338,222" />
                      <path d="M 220,260 L 245,245 M 245,245 L 237,247 M 245,245 L 242,252" />
                    </g>
                  )}

                  {/* Physical ESP32 Sensor Nodes (Pulsing Beacons) */}
                  {/* Node 1: Culvert Outfall */}
                  <g className="cursor-pointer">
                    <circle cx="160" cy="180" r="16" fill="url(#nodePulse)" />
                    <circle cx="160" cy="180" r="4.5" fill="#22d3ee" stroke="#082f49" strokeWidth="1.5" />
                    <text x="172" y="176" fill="#cbd5e1" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      CX-N01: 0.76m
                    </text>
                  </g>

                  {/* Node 2: Canal Junction */}
                  <g className="cursor-pointer">
                    <circle cx="280" cy="210" r="18" fill="url(#nodePulse)" />
                    <circle cx="280" cy="210" r="4.5" fill="#2dd4bf" stroke="#042f2e" strokeWidth="1.5" />
                    <text x="292" y="206" fill="#cbd5e1" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      CX-N02: 0.88m
                    </text>
                  </g>

                  {/* Node 3: Low Depression */}
                  <g className="cursor-pointer">
                    <circle cx="370" cy="185" r="14" fill="url(#nodePulse)" />
                    <circle cx="370" cy="185" r="4.5" fill="#38bdf8" stroke="#0c4a6e" strokeWidth="1.5" />
                    <text x="382" y="181" fill="#cbd5e1" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      CX-N03: 0.62m
                    </text>
                  </g>

                  {/* Critical Inundation Alert Marker */}
                  <g transform="translate(240, 160)">
                    <rect x="0" y="0" width="84" height="20" rx="4" fill="#0f172a" stroke="#ef4444" strokeWidth="1" />
                    <circle cx="10" cy="10" r="3" fill="#ef4444" className="animate-ping" />
                    <text x="20" y="14" fill="#fca5a5" fontSize="8" fontFamily="monospace" fontWeight="bold">
                      SURCHARGE WARN
                    </text>
                  </g>
                </svg>

                {/* Corner Geospatial Crosshairs */}
                <div className="absolute top-2 left-2 text-[9px] font-mono text-slate-500">
                  + 37.7749° N
                </div>
                <div className="absolute top-2 right-2 text-[9px] font-mono text-slate-500">
                  - 122.4194° W
                </div>
                <div className="absolute bottom-2 left-2 text-[9px] font-mono text-cyan-400/80">
                  GRID: 1024×1024 • RES: 0.5M
                </div>
                <div className="absolute bottom-2 right-2 text-[9px] font-mono text-slate-400">
                  SCALE: 1:5000
                </div>
              </div>

              {/* Bottom Quick Readout Strip */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center font-mono">
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Peak Depth</div>
                  <div className="text-sm font-bold text-cyan-300">0.95 m</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Inundation Area</div>
                  <div className="text-sm font-bold text-teal-300">2.15 km²</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Mass Residual</div>
                  <div className="text-sm font-bold text-emerald-400">&lt; 0.39%</div>
                </div>
              </div>

              {/* Research Disclosure Caption */}
              <div className="mt-2 text-[10px] text-slate-400 font-mono text-center">
                *Illustrative numerical simulation calibrated on synthetic urban basin benchmarks.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
