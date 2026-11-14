"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Layers,
  Activity,
  Info,
  Maximize2,
  AlertTriangle,
  Radio,
  Eye,
  ShieldAlert,
  BarChart2,
  Waves,
} from "lucide-react";
import { SIMULATION_SCENARIOS, SIMULATION_DISCLAIMER } from "../data/simulationData";
import { cn } from "../utils/cn";

export function SimulationPreview() {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(2); // default t=30min
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDepthLayer, setShowDepthLayer] = useState(true);
  const [showVelocityLayer, setShowVelocityLayer] = useState(true);
  const [showContoursLayer, setShowContoursLayer] = useState(true);
  const [showSensorsLayer, setShowSensorsLayer] = useState(true);
  const [selectedSensorNode, setSelectedSensorNode] = useState<string | null>(null);

  const scenario = SIMULATION_SCENARIOS[selectedScenarioIndex];
  const currentStep = scenario.timesteps[currentStepIndex];

  // Auto-play interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => (prev + 1) % scenario.timesteps.length);
      }, 2200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, scenario.timesteps.length]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical":
        return "text-red-400 bg-red-950/60 border-red-500/40";
      case "warning":
        return "text-amber-400 bg-amber-950/60 border-amber-500/40";
      case "advisory":
        return "text-yellow-300 bg-yellow-950/50 border-yellow-500/30";
      default:
        return "text-emerald-400 bg-emerald-950/50 border-emerald-500/30";
    }
  };

  return (
    <section
      id="simulation"
      className="relative py-24 bg-[#07090e] border-b border-slate-800/80 overflow-hidden"
    >
      {/* Background Subtle Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-4">
            <Waves className="w-3.5 h-3.5" />
            <span>INTERACTIVE HYDRODYNAMIC LAB</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
            Real-Time Flood Propagation Simulator
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Scrub forward in storm duration to inspect how high-resolution
            shallow-water equations and Fourier Neural Operators predict 2D
            overland flood wave propagation, culvert choke points, and surface
            flow velocities.
          </p>

          {/* Research Disclaimer Pill */}
          <div className="mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/80 border border-amber-500/30 text-amber-300/90 text-xs font-mono leading-relaxed">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>{SIMULATION_DISCLAIMER}</span>
          </div>
        </div>

        {/* Main Simulator Card */}
        <div className="rounded-2xl bg-[#0b0f17] border border-cyan-500/20 shadow-2xl shadow-cyan-950/40 overflow-hidden">
          {/* Top Control Bar: Scenario Selection & Layer Toggles */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 lg:p-6 bg-[#0d131f] border-b border-slate-800">
            {/* Scenario Dropdown / Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider mr-2">
                Scenario:
              </span>
              {SIMULATION_SCENARIOS.map((sc, idx) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    setSelectedScenarioIndex(idx);
                    setCurrentStepIndex(0);
                    setIsPlaying(false);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border",
                    selectedScenarioIndex === idx
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-950"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  )}
                >
                  {sc.name}
                </button>
              ))}
            </div>

            {/* Visual Layer Toggles */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider mr-1">
                Layers:
              </span>
              <button
                type="button"
                onClick={() => setShowDepthLayer(!showDepthLayer)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-mono transition-colors border",
                  showDepthLayer
                    ? "bg-cyan-950 border-cyan-500 text-cyan-300"
                    : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400"
                )}
              >
                Depth (h)
              </button>
              <button
                type="button"
                onClick={() => setShowVelocityLayer(!showVelocityLayer)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-mono transition-colors border",
                  showVelocityLayer
                    ? "bg-teal-950 border-teal-500 text-teal-300"
                    : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400"
                )}
              >
                Velocity (u,v)
              </button>
              <button
                type="button"
                onClick={() => setShowContoursLayer(!showContoursLayer)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-mono transition-colors border",
                  showContoursLayer
                    ? "bg-slate-800 border-slate-600 text-slate-200"
                    : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400"
                )}
              >
                DEM Contours
              </button>
              <button
                type="button"
                onClick={() => setShowSensorsLayer(!showSensorsLayer)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-mono transition-colors border",
                  showSensorsLayer
                    ? "bg-blue-950 border-blue-500 text-blue-300"
                    : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400"
                )}
              >
                ESP32 Sensors
              </button>
            </div>
          </div>

          {/* Middle Body: 2D Hydrodynamic Canvas + Side Telemetry Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
            {/* Left 8 Cols: Interactive Simulation Map Viewport */}
            <div className="lg:col-span-8 relative bg-[#06080d] p-4 lg:p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
              {/* Map Canvas Header Overlay */}
              <div className="flex items-center justify-between text-xs font-mono mb-2 z-10">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">BASIN MODEL:</span>
                  <span className="text-cyan-300 font-semibold">{scenario.subtitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">FORCING:</span>
                  <span className="text-slate-300">{scenario.rainfallIntensity}</span>
                </div>
              </div>

              {/* Main Vector SVG Simulation Visualization */}
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-xl bg-[#080b12] border border-slate-800/90 overflow-hidden flex items-center justify-center shadow-inner">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 800 480"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    {/* Gradients for dynamic depth levels */}
                    <linearGradient id="depthLevel1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#0369a1" stopOpacity="0.1" />
                    </linearGradient>
                    <linearGradient id="depthLevel2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#082f49" stopOpacity="0.3" />
                    </linearGradient>
                    <linearGradient id="depthLevel3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#0369a1" stopOpacity="0.5" />
                    </linearGradient>
                    <linearGradient id="depthLevel4" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.7" />
                    </linearGradient>

                    <radialGradient id="sensorAura" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Topographic Bathymetric Contours Layer */}
                  {showContoursLayer && (
                    <g opacity="0.4" stroke="#334155" strokeWidth="1.2">
                      {/* Hill / High terrain boundary */}
                      <path d="M 50,80 Q 250,40 500,70 T 750,60" />
                      <path d="M 40,160 Q 260,110 520,150 T 760,130" strokeDasharray="4 4" />
                      <path d="M 30,240 Q 270,180 540,230 T 770,210" />
                      <path d="M 30,320 Q 290,260 560,310 T 780,290" strokeDasharray="3 3" />
                      <path d="M 20,400 Q 300,340 580,390 T 790,370" />

                      {/* Elevation labels */}
                      <text x="55" y="75" fill="#64748b" fontSize="9" fontFamily="monospace">
                        z=24m
                      </text>
                      <text x="45" y="155" fill="#64748b" fontSize="9" fontFamily="monospace">
                        z=18m
                      </text>
                      <text x="35" y="235" fill="#64748b" fontSize="9" fontFamily="monospace">
                        z=12m (Drainage Basin)
                      </text>
                      <text x="35" y="315" fill="#64748b" fontSize="9" fontFamily="monospace">
                        z=6m (Low Depression)
                      </text>
                    </g>
                  )}

                  {/* Built Environment Structures (Building Obstacles) */}
                  <g opacity="0.35" fill="#1e293b" stroke="#475569" strokeWidth="1">
                    <rect x="180" y="70" width="70" height="40" rx="3" />
                    <rect x="290" y="65" width="85" height="45" rx="3" />
                    <rect x="420" y="80" width="60" height="40" rx="3" />
                    <rect x="580" y="75" width="90" height="50" rx="3" />

                    <rect x="140" y="210" width="80" height="45" rx="3" />
                    <rect x="620" y="200" width="75" height="55" rx="3" />

                    <rect x="190" y="380" width="85" height="45" rx="3" />
                    <rect x="360" y="390" width="95" height="45" rx="3" />
                  </g>

                  {/* Culvert / Stormwater Conduit Pipe Network */}
                  <g opacity="0.5" stroke="#0e7490" strokeWidth="2.5" strokeDasharray="6 4">
                    <line x1="220" y1="110" x2="220" y2="240" />
                    <line x1="220" y1="240" x2="480" y2="260" />
                    <line x1="480" y1="260" x2="680" y2="350" />
                  </g>

                  {/* Hydrodynamic Inundation Water Zones (Dynamic by Step) */}
                  {showDepthLayer && (
                    <g className="transition-all duration-700 ease-in-out">
                      {currentStep.floodZones.map((zone) => {
                        let fillUrl = "url(#depthLevel1)";
                        let strokeColor = "#0284c7";
                        if (zone.depthLevel === 2) {
                          fillUrl = "url(#depthLevel2)";
                          strokeColor = "#0ea5e9";
                        } else if (zone.depthLevel === 3) {
                          fillUrl = "url(#depthLevel3)";
                          strokeColor = "#06b6d4";
                        } else if (zone.depthLevel === 4) {
                          fillUrl = "url(#depthLevel4)";
                          strokeColor = "#38bdf8";
                        }

                        return (
                          <path
                            key={zone.id}
                            d={zone.path}
                            fill={fillUrl}
                            stroke={strokeColor}
                            strokeWidth="1.8"
                            className="transition-all duration-700"
                          />
                        );
                      })}
                    </g>
                  )}

                  {/* Surface Velocity Flow Vectors Layer */}
                  {showVelocityLayer && (
                    <g stroke="#2dd4bf" strokeWidth="1.4" opacity="0.85">
                      {/* Flow vectors animated according to velocity */}
                      <path d="M 230,220 L 265,235 M 265,235 L 257,231 M 265,235 L 259,240" />
                      <path d="M 290,230 L 330,245 M 330,245 L 321,241 M 330,245 L 324,250" />
                      <path d="M 360,240 L 405,255 M 405,255 L 396,251 M 405,255 L 399,260" />
                      <path d="M 440,250 L 485,260 M 485,260 L 476,256 M 485,260 L 479,265" />
                      <path d="M 490,170 L 470,210 M 470,210 L 476,204 M 470,210 L 466,203" />
                      <path d="M 540,260 L 580,285 M 580,285 L 571,281 M 580,285 L 574,290" />
                      <path d="M 330,300 L 370,325 M 370,325 L 361,321 M 370,325 L 364,330" />
                      <path d="M 250,270 L 290,285 M 290,285 L 281,281 M 290,285 L 284,290" />
                    </g>
                  )}

                  {/* In-Situ ESP32 Physical Sensor Nodes */}
                  {showSensorsLayer && (
                    <g>
                      {currentStep.sensorReadings.map((node, i) => {
                        // Coordinates for the 4 sensor nodes
                        const coords = [
                          { x: 220, y: 240 },
                          { x: 380, y: 260 },
                          { x: 520, y: 230 },
                          { x: 330, y: 340 },
                        ][i];

                        const isSelected = selectedSensorNode === node.nodeId;
                        const isCritical = node.status === "critical";

                        return (
                          <g
                            key={node.nodeId}
                            onClick={() =>
                              setSelectedSensorNode(
                                isSelected ? null : node.nodeId
                              )
                            }
                            className="cursor-pointer group"
                          >
                            {/* Pulse aura */}
                            <circle
                              cx={coords.x}
                              cy={coords.y}
                              r={isCritical ? "24" : "18"}
                              fill="url(#sensorAura)"
                              className={isCritical ? "animate-ping" : ""}
                            />

                            {/* Node center pin */}
                            <circle
                              cx={coords.x}
                              cy={coords.y}
                              r="6"
                              fill={isCritical ? "#ef4444" : "#22d3ee"}
                              stroke="#07090e"
                              strokeWidth="2"
                              className="group-hover:scale-125 transition-transform"
                            />

                            {/* Node Tag Box */}
                            <g transform={`translate(${coords.x + 10}, ${coords.y - 18})`}>
                              <rect
                                x="0"
                                y="0"
                                width="82"
                                height="22"
                                rx="4"
                                fill="#07090e"
                                stroke={isSelected ? "#22d3ee" : isCritical ? "#ef4444" : "#334155"}
                                strokeWidth="1"
                              />
                              <text
                                x="6"
                                y="14"
                                fill={isCritical ? "#fca5a5" : "#cbd5e1"}
                                fontSize="9"
                                fontFamily="monospace"
                                fontWeight="bold"
                              >
                                {node.nodeId}: {node.waterDepthM}m
                              </text>
                            </g>
                          </g>
                        );
                      })}
                    </g>
                  )}
                </svg>

                {/* Depth Legend Floating Box */}
                <div className="absolute bottom-3 left-3 p-2.5 rounded-lg bg-[#07090e]/90 backdrop-blur-md border border-slate-800 text-[10px] font-mono text-slate-300">
                  <div className="text-slate-400 font-bold mb-1.5 uppercase tracking-wider">
                    Water Depth (h)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-sky-900/50 border border-sky-700" />
                    <span>0.1m</span>
                    <span className="w-3 h-3 rounded bg-cyan-700 border border-cyan-500" />
                    <span>0.5m</span>
                    <span className="w-3 h-3 rounded bg-cyan-500 border border-cyan-300" />
                    <span>1.0m</span>
                    <span className="w-3 h-3 rounded bg-sky-300 border border-white" />
                    <span>&gt;1.5m</span>
                  </div>
                </div>

                {/* Real-time Step Label in Corner */}
                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 font-mono text-xs">
                  <span className="text-slate-400">Storm Time: </span>
                  <span className="text-cyan-300 font-bold">
                    t = {currentStep.minute} min
                  </span>
                </div>
              </div>

              {/* Time Scrubber Slider & Playback Controls */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Play / Reset Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-mono transition-colors active:scale-95"
                    aria-label={isPlaying ? "Pause simulation" : "Play simulation"}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-slate-950" />
                        <span>PAUSE</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        <span>PLAY SEQUENCE</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentStepIndex(0);
                    }}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                    title="Reset to t=0"
                    aria-label="Reset simulation to beginning"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Time Step Buttons */}
                <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-center">
                  {scenario.timesteps.map((ts, idx) => (
                    <button
                      key={ts.minute}
                      type="button"
                      onClick={() => {
                        setCurrentStepIndex(idx);
                        setIsPlaying(false);
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-mono transition-all",
                        currentStepIndex === idx
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold"
                          : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                      )}
                    >
                      {ts.minute}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Live Telemetry, Basin Metrics & Cross-Section Profile */}
            <div className="lg:col-span-4 p-4 lg:p-6 bg-[#0a0e17] flex flex-col justify-between">
              <div>
                {/* Telemetry Status Bar */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 text-xs font-mono">
                  <span className="text-slate-400 uppercase tracking-wider">
                    Hydro-Telemetry Readout
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold border uppercase",
                      getRiskColor(currentStep.riskLevel)
                    )}
                  >
                    Status: {currentStep.riskLevel}
                  </span>
                </div>

                {/* 4 Metric Cards */}
                <div className="grid grid-cols-2 gap-2.5 mb-5 font-mono">
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                      Max Water Depth
                    </div>
                    <div className="text-xl font-bold text-cyan-300">
                      {currentStep.maxDepthMeters.toFixed(2)} m
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      at Sector Charlie
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                      Peak Discharge
                    </div>
                    <div className="text-xl font-bold text-teal-300">
                      {currentStep.peakDischargeM3s.toFixed(1)} m³/s
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      conduit throat
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                      Inundated Area
                    </div>
                    <div className="text-xl font-bold text-slate-200">
                      {currentStep.inundatedAreaKm2.toFixed(2)} km²
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      surface flood pool
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                      Surrogate Latency
                    </div>
                    <div className="text-xl font-bold text-emerald-400">
                      38.4 ms
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      FNO-2D forward pass
                    </div>
                  </div>
                </div>

                {/* Dynamic Cross-Section Elevation & Water Surface Profile */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 mb-5">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <BarChart2 className="w-3.5 h-3.5" />
                      Transect Cross-Section Profile
                    </span>
                    <span className="text-[10px] text-slate-400">Section A-A&apos;</span>
                  </div>

                  {/* SVG Profile Chart */}
                  <div className="relative h-28 w-full bg-[#06080d] rounded-lg p-2 border border-slate-800/80">
                    <svg
                      className="w-full h-full"
                      viewBox="0 0 280 80"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Bed Elevation Terrain Contour */}
                      <path
                        d="M 10,20 Q 70,60 140,65 T 270,30 L 270,80 L 10,80 Z"
                        fill="#1e293b"
                        stroke="#475569"
                        strokeWidth="1.2"
                      />

                      {/* Dynamic Water Level (Rises with currentStep) */}
                      {(() => {
                        // Calculate dynamic water level y based on maxDepthMeters
                        const waterHeightPx = Math.min(
                          45,
                          currentStep.maxDepthMeters * 22
                        );
                        const waterSurfaceY = 65 - waterHeightPx;

                        return (
                          <g>
                            <path
                              d={`M 50,${waterSurfaceY} Q 140,${waterSurfaceY} 230,${waterSurfaceY} L 230,65 Q 140,65 50,65 Z`}
                              fill="#06b6d4"
                              fillOpacity="0.5"
                              stroke="#22d3ee"
                              strokeWidth="1.2"
                            />
                            {/* Water surface label */}
                            <text
                              x="140"
                              y={Math.max(16, waterSurfaceY - 4)}
                              fill="#67e8f9"
                              fontSize="8"
                              fontFamily="monospace"
                              textAnchor="middle"
                            >
                              h = {currentStep.maxDepthMeters.toFixed(2)}m
                            </text>
                          </g>
                        );
                      })()}

                      {/* Reference line */}
                      <line
                        x1="10"
                        y1="75"
                        x2="270"
                        y2="75"
                        stroke="#334155"
                        strokeWidth="0.8"
                        strokeDasharray="2 2"
                      />
                      <text x="12" y="73" fill="#64748b" fontSize="6" fontFamily="monospace">
                        Datum (0.0m)
                      </text>
                    </svg>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1 text-center">
                    Ground Bathymetry vs Dynamic Water Elevation
                  </div>
                </div>

                {/* Sensor Node Card (shows selected or top active) */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
                    <span className="flex items-center gap-1.5 text-teal-400">
                      <Radio className="w-3.5 h-3.5" />
                      In-Situ ESP32 Validation Node
                    </span>
                    <span className="text-[10px] text-emerald-400">TELEMETRY OK</span>
                  </div>

                  {(() => {
                    const activeNode =
                      currentStep.sensorReadings.find(
                        (n) => n.nodeId === selectedSensorNode
                      ) || currentStep.sensorReadings[0];

                    return (
                      <div className="space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">Node ID:</span>
                          <span className="text-cyan-300 font-bold">
                            {activeNode.nodeId} ({activeNode.label})
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">Observed Water Depth:</span>
                          <span className="text-slate-100 font-semibold">
                            {activeNode.waterDepthM.toFixed(3)} m (±2mm)
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">Flow Velocity:</span>
                          <span className="text-teal-300 font-semibold">
                            {activeNode.surfaceVelocityMs.toFixed(2)} m/s
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">Residual vs Neural Model:</span>
                          <span className="text-emerald-400 font-semibold">
                            Δ = +0.012 m (Assimilated)
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Bottom Scenario Description */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed font-sans">
                {scenario.description}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
