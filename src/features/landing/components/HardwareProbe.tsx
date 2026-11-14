"use client";

import React, { useState } from "react";
import {
  Radio,
  ArrowRight,
  Thermometer,
  Sliders,
  Activity,
  Layers,
} from "lucide-react";
import {
  HARDWARE_COMPONENTS,
  PROTOTYPE_METRICS,
} from "../data/hardwareData";
import { cn } from "../utils/cn";

export function HardwareProbe() {
  const [activeTab, setActiveTab] = useState<"specs" | "compensator">("specs");

  // Compensator interactive state
  const [ambientTempC, setAmbientTempC] = useState<number>(24.0);
  const [targetDatumM, setTargetDatumM] = useState<number>(2.5);

  // Calculations for Acoustic Speed-of-Sound
  // c(T) = 331.3 + 0.606 * T (m/s)
  const speedOfSound = 331.3 + 0.606 * ambientTempC;
  // Round trip ToF in microseconds (2 * distance / speed * 1,000,000)
  const tofUs = Math.round(((2 * targetDatumM) / speedOfSound) * 1000000);
  // Uncalibrated room-speed baseline (fixed at 343.2 m/s @ 20°C)
  const uncalibratedSpeed = 343.2;
  const uncalibratedDistM = (uncalibratedSpeed * (tofUs / 1000000)) / 2;
  const errorMm = (uncalibratedDistM - targetDatumM) * 1000;
  const errorPercent = ((uncalibratedDistM - targetDatumM) / targetDatumM) * 100;

  return (
    <section
      id="hardware"
      className="relative py-28 bg-white border-b border-black/[0.06] overflow-hidden"
    >
      {/* Background Gradients */}
      <div className="absolute top-1/3 left-10 w-[500px] h-[500px] bg-blue-500/[0.03] blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-cyan-400/[0.03] blur-[140px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-[#0071e3] text-xs font-mono mb-4 font-semibold">
            <Radio className="w-3.5 h-3.5 text-[#0071e3]" />
            <span>IN-SITU PHYSICAL HARDWARE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-6">
            Autonomous ESP32 Ultrasonic Field Probe
          </h2>

          <p className="text-base sm:text-lg text-[#6e6e73] leading-relaxed">
            Neural surrogate models require physical ground truth. The Crestix
            Field Node (CX-Node-V1) delivers non-contact acoustic water-depth
            telemetry deployed across critical culverts, canal bridges, and
            floodplain depressions.
          </p>
        </div>

        {/* Prototype Summary Metrics (Apple Porcelain Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="p-5 rounded-3xl bg-white border border-zinc-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="text-[10px] font-mono text-[#86868b] uppercase tracking-wider mb-1">
              Active Field Nodes
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#0071e3]">
              {PROTOTYPE_METRICS.totalNodesFieldTested} Units
            </div>
            <div className="text-[11px] text-[#6e6e73] font-mono mt-0.5">
              Continuous Ingestion
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-zinc-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="text-[10px] font-mono text-[#86868b] uppercase tracking-wider mb-1">
              Acoustic Precision
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#0284c7]">
              ±2 Millimeters
            </div>
            <div className="text-[11px] text-[#6e6e73] font-mono mt-0.5">
              NTC Thermistor Corrected
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-zinc-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="text-[10px] font-mono text-[#86868b] uppercase tracking-wider mb-1">
              Detection Latency
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#1d1d1f]">
              {PROTOTYPE_METRICS.detectionLatency}
            </div>
            <div className="text-[11px] text-[#6e6e73] font-mono mt-0.5">
              Adaptive Storm Sampling
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-zinc-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="text-[10px] font-mono text-[#86868b] uppercase tracking-wider mb-1">
              Enclosure Ingress
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600">
              IP67 / IP68
            </div>
            <div className="text-[11px] text-[#6e6e73] font-mono mt-0.5">
              Weatherproof Submersible
            </div>
          </div>
        </div>

        {/* Main Hardware Container */}
        <div className="rounded-3xl bg-white border border-zinc-200/90 shadow-[0_12px_44px_rgba(0,0,0,0.05)] overflow-hidden">
          {/* Top Bar with View Mode Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 bg-[#fbfbfd] border-b border-zinc-200/80">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-[#1d1d1f]">
                HARDWARE ARCHITECTURE: CX-NODE-V1
              </span>
              <span className="text-zinc-300">|</span>
              <span className="text-[11px] font-mono text-[#0071e3] font-semibold">
                FW: {PROTOTYPE_METRICS.firmwareVersion}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("specs")}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-mono transition-all border flex items-center gap-1.5 font-medium",
                  activeTab === "specs"
                    ? "bg-[#0071e3] text-white border-transparent shadow-xs font-semibold"
                    : "bg-white border-zinc-200 text-[#6e6e73] hover:text-[#1d1d1f]"
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Subsystem Specs</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("compensator")}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-mono transition-all border flex items-center gap-1.5 font-medium",
                  activeTab === "compensator"
                    ? "bg-[#0071e3] text-white border-transparent shadow-xs font-semibold"
                    : "bg-white border-zinc-200 text-[#6e6e73] hover:text-[#1d1d1f]"
                )}
              >
                <Thermometer className="w-3.5 h-3.5" />
                <span>Speed-of-Sound Physics</span>
              </button>
            </div>
          </div>

          {/* Subsystem Specifications View */}
          {activeTab === "specs" && (
            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
              {HARDWARE_COMPONENTS.map((comp, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-[#fbfbfd] border border-zinc-200/80 hover:border-blue-300 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0071e3] border border-blue-200/60">
                        {comp.subsystem}
                      </span>
                      <span className="text-[11px] font-mono text-[#86868b]">
                        {comp.partNumber}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-[#1d1d1f] mb-2">
                      {comp.name}
                    </h4>

                    <p className="text-xs text-[#6e6e73] font-sans leading-relaxed mb-4">
                      {comp.role}
                    </p>

                    <div className="space-y-1.5 pt-3 border-t border-zinc-200/60">
                      {comp.specifications.map((spec, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-start gap-2 text-xs font-mono text-[#515154]"
                        >
                          <span className="text-[#0071e3]">•</span>
                          <span>{spec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Acoustic Speed-of-Sound Thermistor Compensator Interactive View */}
          {activeTab === "compensator" && (
            <div className="p-6 sm:p-8 space-y-6 bg-white">
              <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-[#0071e3]" />
                    <span className="font-mono text-xs font-bold text-[#1d1d1f]">
                      PHYSICS SIMULATOR: NTC TEMPERATURE SPEED-OF-SOUND CORRECTION
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#0071e3] bg-white px-2.5 py-0.5 rounded-full border border-blue-200/80 font-semibold shadow-xs">
                    Real-time Equation: v(T) = 331.3 + 0.606·T [m/s]
                  </span>
                </div>
                <p className="text-xs text-[#6e6e73] leading-relaxed font-sans">
                  The speed of sound in air is strictly a thermodynamic function of
                  absolute ambient temperature. Ultrasonic transducers that assume a static room-temperature
                  constant (343.2 m/s) incur severe ranging drift (up to ±12 cm) during summer asphalt heatwaves or sub-zero night chills. The Crestix Field Probe samples an onboard thermistor concurrently with each sonic ping, applying immediate firmware-level correction.
                </p>
              </div>

              {/* Interactive Controls & Telemetry Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left 6 cols: Sliders */}
                <div className="lg:col-span-6 p-6 rounded-2xl bg-[#fbfbfd] border border-zinc-200/80 flex flex-col justify-between gap-6 shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label
                        htmlFor="temp-slider"
                        className="text-xs font-mono text-[#1d1d1f] flex items-center gap-1.5 font-semibold"
                      >
                        <Thermometer className="w-3.5 h-3.5 text-[#0071e3]" />
                        <span>In-Situ Air Temperature (T):</span>
                      </label>
                      <span className="text-sm font-mono font-bold text-[#0071e3] bg-white border border-zinc-200 px-2.5 py-0.5 rounded-full shadow-xs">
                        {ambientTempC.toFixed(1)}°C
                      </span>
                    </div>
                    <input
                      id="temp-slider"
                      type="range"
                      min="-10.0"
                      max="45.0"
                      step="0.5"
                      value={ambientTempC}
                      onChange={(e) => setAmbientTempC(parseFloat(e.target.value))}
                      className="w-full accent-[#0071e3] cursor-pointer h-2 bg-zinc-200 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-[#86868b] mt-1">
                      <span>-10°C (Freezing Storm)</span>
                      <span>20°C (Standard Lab)</span>
                      <span>+45°C (Heatwave)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label
                        htmlFor="distance-slider"
                        className="text-xs font-mono text-[#1d1d1f] flex items-center gap-1.5 font-semibold"
                      >
                        <Sliders className="w-3.5 h-3.5 text-[#0284c7]" />
                        <span>True Transducer-to-Water Distance (d):</span>
                      </label>
                      <span className="text-sm font-mono font-bold text-[#0284c7] bg-white border border-zinc-200 px-2.5 py-0.5 rounded-full shadow-xs">
                        {targetDatumM.toFixed(2)} m
                      </span>
                    </div>
                    <input
                      id="distance-slider"
                      type="range"
                      min="0.5"
                      max="5.0"
                      step="0.05"
                      value={targetDatumM}
                      onChange={(e) => setTargetDatumM(parseFloat(e.target.value))}
                      className="w-full accent-[#0284c7] cursor-pointer h-2 bg-zinc-200 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-[#86868b] mt-1">
                      <span>0.50 m (Near Brim)</span>
                      <span>2.50 m (Canal Bed)</span>
                      <span>5.00 m (Deep Culvert)</span>
                    </div>
                  </div>

                  {/* Calculated Acoustic Parameters */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-200 font-mono text-xs">
                    <div className="p-3 rounded-xl bg-white border border-zinc-200 shadow-xs">
                      <span className="text-[10px] text-[#86868b] uppercase block">Compensated Sonic Speed</span>
                      <span className="text-sm font-bold text-[#1d1d1f]">{speedOfSound.toFixed(2)} m/s</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-zinc-200 shadow-xs">
                      <span className="text-[10px] text-[#86868b] uppercase block">Echo Round-Trip (ToF)</span>
                      <span className="text-sm font-bold text-[#0071e3]">{tofUs.toLocaleString()} µs</span>
                    </div>
                  </div>
                </div>

                {/* Right 6 cols: Error Comparison Matrix */}
                <div className="lg:col-span-6 p-6 rounded-2xl bg-white border border-zinc-200/80 flex flex-col justify-between gap-4 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                    <span className="font-mono text-xs font-bold text-[#1d1d1f] flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-[#0071e3]" />
                      CALIBRATED VS UNCALIBRATED TELEMETRY
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border",
                        Math.abs(errorMm) < 5
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      )}
                    >
                      {Math.abs(errorMm) < 5 ? "STABLE REGIME" : "CRITICAL OFFSET"}
                    </span>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    {/* Crestix Corrected Reading */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase text-emerald-800 font-bold">
                          Crestix Probe (NTC Thermistor Corrected)
                        </div>
                        <div className="text-[#515154] text-[11px]">
                          Firmware dynamically compensates for {ambientTempC}°C
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-emerald-700">
                          {targetDatumM.toFixed(3)} m
                        </div>
                        <div className="text-[10px] text-emerald-800 font-bold">
                          Error: ±0.0 mm
                        </div>
                      </div>
                    </div>

                    {/* Naive / Uncalibrated Sensor Reading */}
                    <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase text-rose-800 font-bold">
                          Uncalibrated Sensor (Static 343.2 m/s Baseline)
                        </div>
                        <div className="text-[#515154] text-[11px]">
                          Assumes 20°C regardless of real environment
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-rose-700">
                          {uncalibratedDistM.toFixed(3)} m
                        </div>
                        <div className="text-[10px] text-rose-800 font-bold">
                          Offset: {errorMm >= 0 ? "+" : ""}
                          {errorMm.toFixed(1)} mm ({errorPercent.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Impact Insight Callout */}
                  <div className="p-3.5 rounded-xl bg-[#f5f5f7] border border-black/[0.04] text-[11px] text-[#6e6e73] leading-relaxed font-sans">
                    <span className="font-semibold text-[#1d1d1f]">Municipal Impact: </span>
                    An uncalibrated {Math.abs(errorMm).toFixed(1)} mm ({Math.abs(errorMm / 10).toFixed(1)} cm) offset at this temperature would distort hydraulic head calculations and trigger either premature evacuation alarms or undetected roadway overtopping.
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Bottom Callout Bar */}
          <div className="p-4 sm:p-5 bg-[#f5f5f7] border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="text-[#6e6e73]">
              Hardware schematics, FreeRTOS C++ firmware, and 3D enclosure CAD
              files are fully documented.
            </div>
            <a
              href="#cta"
              className="inline-flex items-center gap-1.5 text-[#0071e3] hover:underline font-semibold"
            >
              <span>Request Hardware Pilot Kit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
