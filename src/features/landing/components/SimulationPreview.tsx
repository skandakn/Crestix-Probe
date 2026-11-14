"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Radio,
  BarChart2,
  Waves,
  Wifi,
  WifiOff,
} from "lucide-react";
import { SIMULATION_SCENARIOS } from "../data/simulationData";
import { cn } from "../utils/cn";
import {
  createCityDEM,
  renderFloodHeatmapCanvas,
  VIEWBOX_WIDTH,
  VIEWBOX_HEIGHT,
} from "../utils/floodHeatmap";
import { FloodTerrain3D } from "./FloodTerrain3D";
import { fetchSensorLatest } from "@/features/sensors/api";

export function SimulationPreview() {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(2); // default t=30min
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("3d");
  const [showDepthLayer, setShowDepthLayer] = useState(true);
  const [showVelocityLayer, setShowVelocityLayer] = useState(true);
  const [showContoursLayer, setShowContoursLayer] = useState(true);
  const [showSensorsLayer, setShowSensorsLayer] = useState(true);
  const [selectedSensorNode, setSelectedSensorNode] = useState<string | null>(null);
  const [cxN01LiveDepth, setCxN01LiveDepth] = useState<number | null>(null);
  const [isHardwareSynced, setIsHardwareSynced] = useState<boolean>(false);
  const [hardwareNodeStatus, setHardwareNodeStatus] = useState<"IDLE" | "CONNECTED" | "OFFLINE">("IDLE");
  const [hardwareReadingCm, setHardwareReadingCm] = useState<number | null>(null);

  const heatmapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cityDem = useMemo(() => createCityDEM(), []);

  const scenario = SIMULATION_SCENARIOS[selectedScenarioIndex];
  const currentStep = scenario.timesteps[currentStepIndex];

  // Poll live hardware telemetry when ESP32 sync is activated
  useEffect(() => {
    if (!isHardwareSynced) {
      setHardwareNodeStatus("IDLE");
      return;
    }

    let isMounted = true;
    const pollHardware = async () => {
      try {
        const latest = await fetchSensorLatest("EXP-2026-FLOOD-01", "P2");
        if (!isMounted) return;
        if (latest && latest.ok && latest.reading && latest.reading.calculatedWaterDepthCm !== null) {
          setHardwareNodeStatus(latest.stale ? "OFFLINE" : "CONNECTED");
          setHardwareReadingCm(latest.reading.calculatedWaterDepthCm);
          // Scale bench point depth (cm) to catchment station meters
          const derivedMeters = Math.max(0.01, Math.round((latest.reading.calculatedWaterDepthCm / 100) * 1000) / 1000);
          setCxN01LiveDepth(derivedMeters);
        } else {
          setHardwareNodeStatus("OFFLINE");
        }
      } catch {
        if (isMounted) setHardwareNodeStatus("OFFLINE");
      }
    };

    void pollHardware();
    const interval = setInterval(() => {
      void pollHardware();
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isHardwareSynced]);

  const cxN01BaseDepth =
    currentStep.sensorReadings.find((n) => n.nodeId === "CX-N01")?.waterDepthM ??
    currentStep.maxDepthMeters;
  const effectiveCxN01Depth = cxN01LiveDepth ?? cxN01BaseDepth;
  const effectiveWaterSurfaceElevation = Math.max(
    0,
    currentStep.maxDepthMeters + (effectiveCxN01Depth - cxN01BaseDepth)
  );

  // Render terrain-conforming 64x64 water-depth heatmap onto <canvas>
  useEffect(() => {
    if (viewMode !== "2d") return;
    const canvas = heatmapCanvasRef.current;
    if (!canvas) return;
    if (!showDepthLayer) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    renderFloodHeatmapCanvas(canvas, cityDem, effectiveWaterSurfaceElevation);
  }, [cityDem, effectiveWaterSurfaceElevation, showDepthLayer, viewMode]);

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
        return "text-rose-700 bg-rose-50 border-rose-200";
      case "warning":
        return "text-amber-700 bg-amber-50 border-amber-200";
      case "advisory":
        return "text-yellow-800 bg-yellow-50 border-yellow-200";
      default:
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
    }
  };

  return (
    <section
      id="simulation"
      className="relative py-28 bg-white border-b border-black/[0.06] overflow-hidden"
    >
      {/* Background Subtle Precision Dots */}
      <div className="absolute inset-0 bg-[radial-gradient(#0000000a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-[#0071e3] text-xs font-mono mb-4 font-semibold">
            <Waves className="w-3.5 h-3.5" />
            <span>INTERACTIVE HYDRODYNAMIC LAB</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-4">
            Real-Time Flood Propagation Simulator
          </h2>

          <p className="text-base sm:text-lg text-[#6e6e73] leading-relaxed">
            Scrub forward in storm duration to inspect how high-resolution
            shallow-water equations and Fourier Neural Operators predict 2D
            overland flood wave propagation, culvert choke points, and surface
            flow velocities.
          </p>
        </div>

        {/* Main Simulator Card (Apple Studio Porcelain Card) */}
        <div className="rounded-3xl bg-white border border-zinc-200/90 shadow-[0_12px_44px_rgba(0,0,0,0.06)] overflow-hidden">
          {/* Top Control Bar: Scenario Selection & Layer Toggles */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 lg:p-5 bg-[#fbfbfd] border-b border-zinc-200/80">
            {/* Scenario Dropdown / Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-[#86868b] uppercase tracking-wider mr-2 font-medium">
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
                    "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border",
                    selectedScenarioIndex === idx
                      ? "bg-[#1d1d1f] border-[#1d1d1f] text-white shadow-xs font-semibold"
                      : "bg-white border-zinc-200 text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-zinc-50"
                  )}
                >
                  {sc.name}
                </button>
              ))}
            </div>

            {/* Visual Layer Toggles */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-[#86868b] uppercase tracking-wider mr-1 font-medium">
                Layers:
              </span>
              <button
                type="button"
                onClick={() => setShowDepthLayer(!showDepthLayer)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-mono transition-colors border",
                  showDepthLayer
                    ? "bg-blue-50 border-blue-300 text-[#0071e3] font-semibold"
                    : "bg-white border-zinc-200 text-[#86868b] hover:text-[#1d1d1f]"
                )}
              >
                Depth (h)
              </button>
              <button
                type="button"
                onClick={() => setShowVelocityLayer(!showVelocityLayer)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-mono transition-colors border",
                  showVelocityLayer
                    ? "bg-teal-50 border-teal-300 text-teal-700 font-semibold"
                    : "bg-white border-zinc-200 text-[#86868b] hover:text-[#1d1d1f]"
                )}
              >
                Velocity (u,v)
              </button>
              <button
                type="button"
                onClick={() => setShowContoursLayer(!showContoursLayer)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-mono transition-colors border",
                  showContoursLayer
                    ? "bg-zinc-100 border-zinc-300 text-[#1d1d1f] font-semibold"
                    : "bg-white border-zinc-200 text-[#86868b] hover:text-[#1d1d1f]"
                )}
              >
                DEM Contours
              </button>
              <button
                type="button"
                onClick={() => setShowSensorsLayer(!showSensorsLayer)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-mono transition-colors border",
                  showSensorsLayer
                    ? "bg-sky-50 border-sky-300 text-sky-700 font-semibold"
                    : "bg-white border-zinc-200 text-[#86868b] hover:text-[#1d1d1f]"
                )}
              >
                ESP32 Sensors
              </button>
            </div>
          </div>

          {/* Middle Body: 2D Hydrodynamic Canvas + Side Telemetry Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
            {/* Left 8 Cols: Interactive Simulation Map Viewport */}
            <div className="lg:col-span-8 relative bg-[#f8fafc] p-4 lg:p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-zinc-200/80">
              {/* Map Canvas Header Overlay + 2D Raster / 3D Terrain Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono mb-2 z-10">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#86868b]">BASIN:</span>
                  <span className="text-[#0071e3] font-semibold">
                    Shenzhen Urban Catchment (Futian Sector • 22.5431° N, 114.0579° E)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-1.5">
                    <span className="text-[#86868b]">FORCING:</span>
                    <span className="text-[#1d1d1f] font-medium">{scenario.rainfallIntensity}</span>
                  </div>
                  <div
                    role="group"
                    aria-label="Simulation View Mode"
                    className="inline-flex items-center rounded-full bg-zinc-200/80 p-0.5 border border-zinc-300/80"
                  >
                    <button
                      type="button"
                      onClick={() => setViewMode("2d")}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold transition-all",
                        viewMode === "2d"
                          ? "bg-white text-[#0071e3] shadow-xs"
                          : "text-[#6e6e73] hover:text-[#1d1d1f]"
                      )}
                    >
                      2D Raster
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("3d")}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold transition-all",
                        viewMode === "3d"
                          ? "bg-[#0b1120] text-cyan-300 shadow-xs"
                          : "text-[#6e6e73] hover:text-[#1d1d1f]"
                      )}
                    >
                      3D Terrain
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Vector SVG Simulation Visualization + 64x64 Canvas Heatmap OR 3D Terrain */}
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl bg-white border border-zinc-200/80 overflow-hidden flex items-center justify-center shadow-xs">
                {viewMode === "3d" ? (
                  <FloodTerrain3D
                    dem={cityDem}
                    waterSurfaceElevationM={effectiveWaterSurfaceElevation}
                    showDepthLayer={showDepthLayer}
                    showContoursLayer={showContoursLayer}
                    showSensorsLayer={showSensorsLayer}
                    sensors={currentStep.sensorReadings.map((n) => ({
                      nodeId: n.nodeId,
                      waterDepthM: n.nodeId === "CX-N01" ? effectiveCxN01Depth : n.waterDepthM,
                      status: n.status,
                    }))}
                    selectedSensorNode={selectedSensorNode}
                    onSelectSensorNode={setSelectedSensorNode}
                  />
                ) : (
                  <>
                    {/* 64x64 Terrain-Masked Water Depth Heatmap Canvas */}
                    <canvas
                      ref={heatmapCanvasRef}
                      width={VIEWBOX_WIDTH}
                      height={VIEWBOX_HEIGHT}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      aria-label="64x64 terrain-masked water depth heatmap"
                    />

                    <svg
                      className="relative z-10 w-full h-full"
                      viewBox="0 0 800 480"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                  <defs>
                    <radialGradient id="sensorAuraLight" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#0071e3" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#0071e3" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Topographic Bathymetric Contours Layer */}
                  {showContoursLayer && (
                    <g opacity="0.6" stroke="#cbd5e1" strokeWidth="1.2">
                      <path d="M 50,80 Q 250,40 500,70 T 750,60" />
                      <path d="M 40,160 Q 260,110 520,150 T 760,130" strokeDasharray="4 4" />
                      <path d="M 30,240 Q 270,180 540,230 T 770,210" />
                      <path d="M 30,320 Q 290,260 560,310 T 780,290" strokeDasharray="3 3" />
                      <path d="M 20,400 Q 300,340 580,390 T 790,370" />

                      <text x="55" y="75" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                        z=24m
                      </text>
                      <text x="45" y="155" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                        z=18m
                      </text>
                      <text x="35" y="235" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                        z=12m (Drainage Basin)
                      </text>
                      <text x="35" y="315" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                        z=6m (Low Depression)
                      </text>
                    </g>
                  )}

                  {/* Built Environment Structures (Building Obstacles, DEM > 5.0m) */}
                  <g opacity="0.6" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.2">
                    <rect x="180" y="70" width="70" height="40" rx="4" />
                    <rect x="290" y="65" width="85" height="45" rx="4" />
                    <rect x="420" y="80" width="60" height="40" rx="4" />
                    <rect x="580" y="75" width="90" height="50" rx="4" />

                    <rect x="140" y="210" width="80" height="45" rx="4" />
                    <rect x="620" y="200" width="75" height="55" rx="4" />

                    <rect x="190" y="380" width="85" height="45" rx="4" />
                    <rect x="360" y="390" width="95" height="45" rx="4" />
                  </g>

                  {/* Culvert / Stormwater Conduit Pipe Network */}
                  <g opacity="0.75" stroke="#0284c7" strokeWidth="2.5" strokeDasharray="6 4">
                    <line x1="220" y1="110" x2="220" y2="240" />
                    <line x1="220" y1="240" x2="480" y2="260" />
                    <line x1="480" y1="260" x2="680" y2="350" />
                  </g>

                  {/* Surface Velocity Flow Vectors Layer */}
                  {showVelocityLayer && (
                    <g stroke="#0369a1" strokeWidth="1.6" opacity="0.9">
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
                        const coords = [
                          { x: 220, y: 240 },
                          { x: 380, y: 260 },
                          { x: 520, y: 230 },
                          { x: 330, y: 340 },
                        ][i];

                        const isSelected = selectedSensorNode === node.nodeId;
                        const isCritical = node.status === "critical";
                        const displayedDepth =
                          node.nodeId === "CX-N01"
                            ? effectiveCxN01Depth
                            : node.waterDepthM;

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
                              fill="url(#sensorAuraLight)"
                              className={isCritical ? "animate-ping" : ""}
                            />

                            {/* Node center pin */}
                            <circle
                              cx={coords.x}
                              cy={coords.y}
                              r="6"
                              fill={isCritical ? "#ef4444" : "#0071e3"}
                              stroke="#ffffff"
                              strokeWidth="2.5"
                              className="group-hover:scale-125 transition-transform"
                            />

                            {/* Node Tag Box */}
                            <g transform={`translate(${coords.x + 10}, ${coords.y - 18})`}>
                              <rect
                                x="0"
                                y="0"
                                width="84"
                                height="22"
                                rx="5"
                                fill="#ffffff"
                                stroke={isSelected ? "#0071e3" : isCritical ? "#ef4444" : "#cbd5e1"}
                                strokeWidth="1.2"
                              />
                              <text
                                x="6"
                                y="14"
                                fill={isCritical ? "#b91c1c" : "#1d1d1f"}
                                fontSize="9"
                                fontFamily="monospace"
                                fontWeight="bold"
                              >
                                {node.nodeId}: {displayedDepth.toFixed(2)}m
                              </text>
                            </g>
                          </g>
                        );
                      })}
                    </g>
                  )}
                    </svg>
                  </>
                )}

                {/* Depth Legend Floating Box */}
                <div className="absolute bottom-3 left-3 p-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-black/[0.08] text-[10px] font-mono text-[#1d1d1f] shadow-sm z-20">
                  <div className="text-[#86868b] font-bold mb-1.5 uppercase tracking-wider">
                    Water Depth (h)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
                    <span>0.1m</span>
                    <span className="w-3 h-3 rounded bg-blue-400 border border-blue-500" />
                    <span>0.5m</span>
                    <span className="w-3 h-3 rounded bg-[#0071e3] border border-blue-700" />
                    <span>1.0m</span>
                    <span className="w-3 h-3 rounded bg-cyan-400 border border-cyan-600" />
                    <span>&gt;1.5m</span>
                  </div>
                </div>

                {/* Real-time Step Label in Corner */}
                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-white/95 border border-zinc-200/80 font-mono text-xs shadow-xs z-20">
                  <span className="text-[#86868b]">Storm Time: </span>
                  <span className="text-[#0071e3] font-bold">
                    t = {currentStep.minute} min
                  </span>
                </div>
              </div>

              {/* Time Scrubber Slider & Playback Controls */}
              <div className="mt-4 pt-4 border-t border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Play / Reset Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold font-mono transition-colors active:scale-95 shadow-xs"
                    aria-label={isPlaying ? "Pause simulation" : "Play simulation"}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-white" />
                        <span>PAUSE</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-white" />
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
                    className="p-2 rounded-full bg-white hover:bg-zinc-50 text-[#6e6e73] hover:text-[#1d1d1f] border border-zinc-200 transition-colors shadow-xs"
                    title="Reset to t=0"
                    aria-label="Reset simulation to beginning"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Time Step Buttons */}
                <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-center bg-[#f5f5f7] p-1 rounded-full border border-black/[0.04]">
                  {scenario.timesteps.map((ts, idx) => (
                    <button
                      key={ts.minute}
                      type="button"
                      onClick={() => {
                        setCurrentStepIndex(idx);
                        setIsPlaying(false);
                      }}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-mono transition-all font-medium",
                        currentStepIndex === idx
                          ? "bg-white text-[#1d1d1f] shadow-xs font-bold"
                          : "text-[#6e6e73] hover:text-[#1d1d1f]"
                      )}
                    >
                      {ts.minute}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Live Telemetry, Basin Metrics & Cross-Section Profile */}
            <div className="lg:col-span-4 p-4 lg:p-6 bg-white flex flex-col justify-between">
              <div>
                {/* Telemetry Status Bar */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100 text-xs font-mono">
                  <span className="text-[#86868b] uppercase tracking-wider font-medium">
                    Hydro-Telemetry Readout
                  </span>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase",
                      getRiskColor(currentStep.riskLevel)
                    )}
                  >
                    Status: {currentStep.riskLevel}
                  </span>
                </div>

                {/* 4 Metric Cards */}
                <div className="grid grid-cols-2 gap-2.5 mb-5 font-mono">
                  <div className="p-3 rounded-2xl bg-[#f5f5f7] border border-black/[0.04]">
                    <div className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1">
                      Max Water Depth
                    </div>
                    <div className="text-xl font-bold text-[#0071e3]">
                      {effectiveWaterSurfaceElevation.toFixed(2)} m
                    </div>
                    <div className="text-[10px] text-[#86868b] mt-0.5">
                      at Sector Charlie
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#f5f5f7] border border-black/[0.04]">
                    <div className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1">
                      Peak Discharge
                    </div>
                    <div className="text-xl font-bold text-[#0284c7]">
                      {currentStep.peakDischargeM3s.toFixed(1)} m³/s
                    </div>
                    <div className="text-[10px] text-[#86868b] mt-0.5">
                      conduit throat
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#f5f5f7] border border-black/[0.04]">
                    <div className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1">
                      Inundated Area
                    </div>
                    <div className="text-xl font-bold text-[#1d1d1f]">
                      {currentStep.inundatedAreaKm2.toFixed(2)} km²
                    </div>
                    <div className="text-[10px] text-[#86868b] mt-0.5">
                      surface flood pool
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#f5f5f7] border border-black/[0.04]">
                    <div className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1">
                      Surrogate Latency
                    </div>
                    <div className="text-xl font-bold text-emerald-600">
                      38.4 ms
                    </div>
                    <div className="text-[10px] text-[#86868b] mt-0.5">
                      LarNO forward pass
                    </div>
                  </div>
                </div>

                {/* Dynamic Cross-Section Elevation & Water Surface Profile */}
                <div className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs mb-5">
                  <div className="flex items-center justify-between text-xs font-mono text-[#1d1d1f] mb-2 font-medium">
                    <span className="flex items-center gap-1.5 text-[#0071e3]">
                      <BarChart2 className="w-3.5 h-3.5" />
                      Transect Cross-Section Profile
                    </span>
                    <span className="text-[10px] text-[#86868b]">Section A-A&apos;</span>
                  </div>

                  {/* SVG Profile Chart */}
                  <div className="relative h-28 w-full bg-[#f8fafc] rounded-xl p-2 border border-zinc-200/70">
                    <svg
                      className="w-full h-full"
                      viewBox="0 0 280 80"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Bed Elevation Terrain Contour */}
                      <path
                        d="M 10,20 Q 70,60 140,65 T 270,30 L 270,80 L 10,80 Z"
                        fill="#e2e8f0"
                        stroke="#94a3b8"
                        strokeWidth="1.2"
                      />

                      {/* Dynamic Water Level (Rises with currentStep) */}
                      {(() => {
                        const waterHeightPx = Math.min(
                          45,
                          effectiveWaterSurfaceElevation * 22
                        );
                        const waterSurfaceY = 65 - waterHeightPx;

                        return (
                          <g>
                            <path
                              d={`M 50,${waterSurfaceY} Q 140,${waterSurfaceY} 230,${waterSurfaceY} L 230,65 Q 140,65 50,65 Z`}
                              fill="#0071e3"
                              fillOpacity="0.4"
                              stroke="#0071e3"
                              strokeWidth="1.5"
                            />
                            {/* Water surface label */}
                            <text
                              x="140"
                              y={Math.max(16, waterSurfaceY - 4)}
                              fill="#0071e3"
                              fontSize="8"
                              fontFamily="monospace"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              h = {effectiveWaterSurfaceElevation.toFixed(2)}m
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
                        stroke="#cbd5e1"
                        strokeWidth="0.8"
                        strokeDasharray="2 2"
                      />
                      <text x="12" y="73" fill="#94a3b8" fontSize="6" fontFamily="monospace">
                        Datum (0.0m)
                      </text>
                    </svg>
                  </div>
                  <div className="text-[10px] text-[#86868b] font-mono mt-1 text-center">
                    Ground Bathymetry vs Dynamic Water Elevation
                  </div>
                </div>

                {/* Sensor Node Card (shows selected or top active) */}
                <div className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-mono text-[#1d1d1f] mb-2 font-medium">
                    <span className="flex items-center gap-1.5 text-[#0071e3]">
                      <Radio className="w-3.5 h-3.5" />
                      In-Situ ESP32 Validation Node
                    </span>
                    {isHardwareSynced ? (
                      hardwareNodeStatus === "CONNECTED" ? (
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          LIVE TELEMETRY (P2: {hardwareReadingCm?.toFixed(1)} cm)
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          RECONNECTING ESP32...
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] text-zinc-500 font-semibold">SYNTHETIC BENCHMARK</span>
                    )}
                  </div>

                  {(() => {
                    const activeNode =
                      currentStep.sensorReadings.find(
                        (n) => n.nodeId === selectedSensorNode
                      ) || currentStep.sensorReadings[0];
                    const displayedObservedDepth =
                      activeNode.nodeId === "CX-N01"
                        ? effectiveCxN01Depth
                        : activeNode.waterDepthM;

                    return (
                      <div className="space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between text-[#1d1d1f]">
                          <span className="text-[#86868b]">Node ID:</span>
                          <span className="text-[#0071e3] font-bold">
                            {activeNode.nodeId} ({activeNode.label})
                          </span>
                        </div>
                        <div className="flex justify-between text-[#1d1d1f]">
                          <span className="text-[#86868b]">Observed Water Depth:</span>
                          <span className="text-[#1d1d1f] font-semibold">
                            {displayedObservedDepth.toFixed(3)} m (±2mm)
                            {isHardwareSynced && activeNode.nodeId === "CX-N01" && (
                              <span className="text-[10px] text-emerald-600 ml-1">
                                (Live Hardware)
                              </span>
                            )}
                          </span>
                        </div>
                        {activeNode.nodeId === "CX-N01" && (
                          <div className="pt-1.5 pb-1">
                            <div className="flex items-center justify-between text-[10px] text-[#86868b] mb-1">
                              <span>Manual In-Situ Probe Calibrator:</span>
                              {cxN01LiveDepth !== null && !isHardwareSynced && (
                                <button
                                  type="button"
                                  onClick={() => setCxN01LiveDepth(null)}
                                  className="text-[#0071e3] hover:underline"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={2.2}
                              step={0.05}
                              value={effectiveCxN01Depth}
                              disabled={isHardwareSynced && hardwareNodeStatus === "CONNECTED"}
                              onChange={(e) =>
                                setCxN01LiveDepth(parseFloat(e.target.value))
                              }
                              aria-label="CX-N01 Observed Water Depth"
                              className={cn(
                                "w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#0071e3]",
                                isHardwareSynced && hardwareNodeStatus === "CONNECTED"
                                  ? "bg-emerald-200 opacity-60 cursor-not-allowed"
                                  : "bg-zinc-200"
                              )}
                            />
                          </div>
                        )}
                        <div className="flex justify-between text-[#1d1d1f]">
                          <span className="text-[#86868b]">Flow Velocity:</span>
                          <span className="text-[#0284c7] font-semibold">
                            {activeNode.surfaceVelocityMs.toFixed(2)} m/s
                          </span>
                        </div>
                        <div className="flex justify-between text-[#1d1d1f]">
                          <span className="text-[#86868b]">Residual vs Neural Model:</span>
                          <span className="text-emerald-600 font-semibold">
                            {isHardwareSynced && activeNode.nodeId === "CX-N01"
                              ? `Δ = ${(displayedObservedDepth - cxN01BaseDepth) >= 0 ? "+" : ""}${(displayedObservedDepth - cxN01BaseDepth).toFixed(3)} m (Live In-Situ)`
                              : "Δ = +0.012 m (Assimilated)"}
                          </span>
                        </div>

                        {/* Direct Jump to Dedicated Hardware Showcase Section */}
                        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                          <a
                            href="#hardware"
                            className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold text-[#0071e3] hover:underline"
                          >
                            <Radio className="w-3 h-3 text-[#0071e3]" />
                            <span>Dedicated Hardware Showcase Below ↓</span>
                          </a>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Bottom Scenario Description */}
              <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] text-[#86868b] leading-relaxed font-sans">
                {scenario.description}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
