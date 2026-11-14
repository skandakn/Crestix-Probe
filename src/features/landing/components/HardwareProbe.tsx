"use client";

import React, { useState, useEffect } from "react";
import {
  Radio,
  Cpu,
  Terminal,
  Zap,
  BatteryCharging,
  ShieldCheck,
  Play,
  Pause,
  RotateCcw,
  Activity,
  Layers,
  ArrowRight,
  Maximize2,
  CheckCircle2,
} from "lucide-react";
import {
  HARDWARE_COMPONENTS,
  SAMPLE_SERIAL_PACKETS,
  PROTOTYPE_METRICS,
} from "../data/hardwareData";
import { cn } from "../utils/cn";

export function HardwareProbe() {
  const [activeTab, setActiveTab] = useState<"specs" | "serial">("specs");
  const [isTerminalStreaming, setIsTerminalStreaming] = useState(true);
  const [packets, setPackets] = useState(SAMPLE_SERIAL_PACKETS);

  // Live serial terminal stream simulator
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTerminalStreaming) {
      interval = setInterval(() => {
        const randomNodeIndex = Math.floor(Math.random() * 3) + 1;
        const now = new Date();
        const timeStr = now.toTimeString().split(" ")[0] + "." + Math.floor(now.getMilliseconds());

        const newPacket = {
          timestamp: timeStr,
          topic: `crestix/cx-0${randomNodeIndex}/telemetry`,
          payload: {
            node_id: `CX-NODE-0${randomNodeIndex}`,
            hw_rev: "v1.4",
            datum_m: Number((8.0 + randomNodeIndex * 2.2).toFixed(3)),
            tof_us: Math.floor(13000 + Math.random() * 6000),
            temp_c: Number((21.0 + Math.random() * 1.5).toFixed(1)),
            water_depth_m: Number((0.65 + Math.random() * 0.8).toFixed(3)),
            rate_rise_cm_h: Number((12.0 + Math.random() * 20.0).toFixed(1)),
            batt_mv: Math.floor(3300 + Math.random() * 50),
            rssi_dbm: Math.floor(-85 + Math.random() * 18),
            snr_db: Number((9.0 + Math.random() * 3.5).toFixed(1)),
            sample_mode: "BURST_STORM",
            crc_ok: true,
          },
        };

        setPackets((prev) => [newPacket, ...prev.slice(0, 9)]);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTerminalStreaming]);

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

        {/* Main Hardware Container: Schematics & Live Terminal */}
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

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("specs")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border",
                  activeTab === "specs"
                    ? "bg-cyan-950 border-cyan-500 text-cyan-300"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                )}
              >
                Subsystem Specifications
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("serial")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border flex items-center gap-1.5",
                  activeTab === "serial"
                    ? "bg-cyan-950 border-cyan-500 text-cyan-300"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                )}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Live Serial Terminal Stream</span>
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

          {/* Live Serial Terminal View */}
          {activeTab === "serial" && (
            <div className="p-4 sm:p-6 bg-[#06080d] flex flex-col">
              {/* Terminal Controls Bar */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      isTerminalStreaming ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
                    )}
                  />
                  <span className="text-slate-300">
                    MQTT INGESTION MONITOR (TLS 1.3 / LoRaWAN)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTerminalStreaming(!isTerminalStreaming)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px] transition-colors"
                  >
                    {isTerminalStreaming ? (
                      <>
                        <Pause className="w-3 h-3 text-amber-400" />
                        <span>Pause Feed</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 text-emerald-400" />
                        <span>Resume Feed</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPackets([])}
                    className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-[11px] transition-colors"
                    title="Clear Buffer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Terminal Output Log Window */}
              <div className="h-96 overflow-y-auto space-y-2.5 font-mono text-xs p-3 rounded-lg bg-[#04060a] border border-slate-800/80">
                {packets.length === 0 ? (
                  <div className="text-slate-400 text-center py-10">
                    Terminal buffer cleared. Waiting for telemetry packet broadcast...
                  </div>
                ) : (
                  packets.map((pkt, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded bg-slate-900/40 border border-slate-800/60 hover:border-cyan-500/30 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 mb-1 border-b border-slate-800/40 pb-1">
                        <span className="text-cyan-400 font-bold">
                          [{pkt.timestamp}] TOPIC: {pkt.topic}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-emerald-400">CRC: OK</span>
                          <span className="text-slate-400">
                            RSSI: {pkt.payload.rssi_dbm} dBm
                          </span>
                        </div>
                      </div>

                      <pre className="text-[11px] text-slate-300 leading-tight overflow-x-auto">
                        {JSON.stringify(pkt.payload, null, 2)}
                      </pre>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Adaptive Telemetry Rate: 30s Burst during Storm Rise</span>
                <span className="text-teal-400">
                  Data Assimilation Protocol: EnKF v2.1
                </span>
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
