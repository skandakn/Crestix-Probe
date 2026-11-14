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
      className="relative py-24 bg-[#07090e] border-b border-slate-800/80 overflow-hidden"
    >
      {/* Background Gradients */}
      <div className="absolute top-1/3 left-10 w-[500px] h-[500px] bg-teal-950/20 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-cyan-950/20 blur-[140px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-4">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>IN-SITU PHYSICAL HARDWARE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6">
            Autonomous ESP32 Ultrasonic Field Probe
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Neural surrogate models require physical ground truth. The Crestix
            Field Node (CX-Node-V1) delivers non-contact acoustic water-depth
            telemetry deployed across critical culverts, canal bridges, and
            floodplain depressions.
          </p>
        </div>

        {/* Prototype Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
          <div className="p-4 rounded-xl bg-[#0b0f17] border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Active Field Nodes
            </div>
            <div className="text-xl sm:text-2xl font-bold text-cyan-300">
              {PROTOTYPE_METRICS.totalNodesFieldTested} Units
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Continuous Ingestion
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0b0f17] border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Acoustic Precision
            </div>
            <div className="text-xl sm:text-2xl font-bold text-teal-300">
              ±2 Millimeters
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              NTC Thermistor Corrected
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0b0f17] border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Detection Latency
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-100">
              {PROTOTYPE_METRICS.detectionLatency}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Adaptive Storm Sampling
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0b0f17] border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Enclosure Ingress
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400">
              IP67 / IP68
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Weatherproof Submersible
            </div>
          </div>
        </div>

        {/* Main Hardware Container: Schematics, Physics Compensator & Live Terminal */}
        <div className="rounded-2xl bg-[#0b0f17] border border-cyan-500/20 shadow-2xl shadow-cyan-950/40 overflow-hidden">
          {/* Top Bar with View Mode Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 bg-[#0e1422] border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-white">
                HARDWARE ARCHITECTURE: CX-NODE-V1
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-[11px] font-mono text-cyan-400">
                FW: {PROTOTYPE_METRICS.firmwareVersion}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("specs")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border flex items-center gap-1.5",
                  activeTab === "specs"
                    ? "bg-cyan-950 border-cyan-500 text-cyan-300"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Subsystem Specs</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("compensator")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border flex items-center gap-1.5",
                  activeTab === "compensator"
                    ? "bg-cyan-950 border-cyan-500 text-cyan-300"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                )}
              >
                <Thermometer className="w-3.5 h-3.5 text-teal-400" />
                <span>Speed-of-Sound Physics</span>
              </button>
            </div>
          </div>

          {/* Subsystem Specifications View */}
          {activeTab === "specs" && (
            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {HARDWARE_COMPONENTS.map((comp, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        {comp.subsystem}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {comp.partNumber}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white mb-2">
                      {comp.name}
                    </h4>

                    <p className="text-xs text-slate-300 font-sans leading-relaxed mb-4">
                      {comp.role}
                    </p>

                    <div className="space-y-1.5 pt-3 border-t border-slate-800">
                      {comp.specifications.map((spec, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-start gap-2 text-xs font-mono text-slate-300"
                        >
                          <span className="text-teal-400">•</span>
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
            <div className="p-6 sm:p-8 space-y-6">
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-teal-950/20 to-slate-900/60 border border-cyan-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-cyan-400" />
                    <span className="font-mono text-xs font-bold text-white">
                      PHYSICS SIMULATOR: NTC TEMPERATURE SPEED-OF-SOUND CORRECTION
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-500/30">
                    Real-time Equation: v(T) = 331.3 + 0.606·T [m/s]
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  The speed of sound in air is strictly a thermodynamic function of
                  absolute ambient temperature. Ultrasonic transducers that assume a static room-temperature
                  constant (343.2 m/s) incur severe ranging drift (up to ±12 cm) during summer asphalt heatwaves or sub-zero night chills. The Crestix Field Probe samples an onboard thermistor concurrently with each sonic ping, applying immediate firmware-level correction.
                </p>
              </div>

              {/* Interactive Controls & Telemetry Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left 6 cols: Sliders */}
                <div className="lg:col-span-6 p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label
                        htmlFor="temp-slider"
                        className="text-xs font-mono text-slate-300 flex items-center gap-1.5"
                      >
                        <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                        <span>In-Situ Air Temperature (T):</span>
                      </label>
                      <span className="text-sm font-mono font-bold text-cyan-300 bg-slate-800 px-2 py-0.5 rounded">
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
                      className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                      <span>-10°C (Freezing Storm)</span>
                      <span>20°C (Standard Lab)</span>
                      <span>+45°C (Heatwave)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label
                        htmlFor="distance-slider"
                        className="text-xs font-mono text-slate-300 flex items-center gap-1.5"
                      >
                        <Sliders className="w-3.5 h-3.5 text-teal-400" />
                        <span>True Transducer-to-Water Distance (d):</span>
                      </label>
                      <span className="text-sm font-mono font-bold text-teal-300 bg-slate-800 px-2 py-0.5 rounded">
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
                      className="w-full accent-teal-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                      <span>0.50 m (Near Brim)</span>
                      <span>2.50 m (Canal Bed)</span>
                      <span>5.00 m (Deep Culvert)</span>
                    </div>
                  </div>

                  {/* Calculated Acoustic Parameters */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 font-mono text-xs">
                    <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">Compensated Sonic Speed</span>
                      <span className="text-sm font-bold text-white">{speedOfSound.toFixed(2)} m/s</span>
                    </div>
                    <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">Echo Round-Trip (ToF)</span>
                      <span className="text-sm font-bold text-cyan-300">{tofUs.toLocaleString()} µs</span>
                    </div>
                  </div>
                </div>

                {/* Right 6 cols: Error Comparison Matrix */}
                <div className="lg:col-span-6 p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-teal-400" />
                      CALIBRATED VS UNCALIBRATED TELEMETRY
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-mono font-bold px-2 py-0.5 rounded",
                        Math.abs(errorMm) < 5
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                          : "bg-amber-950 text-amber-300 border border-amber-500/40"
                      )}
                    >
                      {Math.abs(errorMm) < 5 ? "STABLE REGIME" : "CRITICAL OFFSET"}
                    </span>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    {/* Crestix Corrected Reading */}
                    <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase text-emerald-400 font-bold">
                          Crestix Probe (NTC Thermistor Corrected)
                        </div>
                        <div className="text-slate-300 text-[11px]">
                          Firmware dynamically compensates for {ambientTempC}°C
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-emerald-300">
                          {targetDatumM.toFixed(3)} m
                        </div>
                        <div className="text-[10px] text-emerald-400 font-bold">
                          Error: ±0.0 mm
                        </div>
                      </div>
                    </div>

                    {/* Naive / Uncalibrated Sensor Reading */}
                    <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase text-rose-400 font-bold">
                          Uncalibrated Sensor (Static 343.2 m/s Baseline)
                        </div>
                        <div className="text-slate-300 text-[11px]">
                          Assumes 20°C regardless of real environment
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-rose-300">
                          {uncalibratedDistM.toFixed(3)} m
                        </div>
                        <div className="text-[10px] text-rose-400 font-bold">
                          Offset: {errorMm >= 0 ? "+" : ""}
                          {errorMm.toFixed(1)} mm ({errorPercent.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Impact Insight Callout */}
                  <div className="p-3 rounded-lg bg-[#06080d] border border-slate-800 text-[11px] text-slate-400 leading-relaxed font-sans">
                    <span className="font-semibold text-slate-200">Municipal Impact: </span>
                    An uncalibrated {Math.abs(errorMm).toFixed(1)} mm ({Math.abs(errorMm / 10).toFixed(1)} cm) offset at this temperature would distort hydraulic head calculations and trigger either premature evacuation alarms or undetected roadway overtopping.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Callout Bar */}
          <div className="p-4 sm:p-5 bg-[#0e1422] border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="text-slate-300">
              Hardware schematics, FreeRTOS C++ firmware, and 3D enclosure CAD
              files are fully documented.
            </div>
            <a
              href="#cta"
              className="inline-flex items-center gap-1.5 text-cyan-300 hover:text-cyan-200 font-semibold"
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
