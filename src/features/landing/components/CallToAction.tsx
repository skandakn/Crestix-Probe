"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Waves,
  ArrowRight,
  ShieldCheck,
  Send,
  CheckCircle2,
  Lock,
  Cpu,
  Radio,
  FileText,
} from "lucide-react";
import { cn } from "../utils/cn";

export function CallToAction() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    organization: "",
    email: "",
    basinScale: "municipal",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.email) {
      setFormSubmitted(true);
    }
  };

  return (
    <section
      id="cta"
      className="relative py-24 bg-[#07090e] border-b border-slate-800/80 overflow-hidden"
    >
      {/* Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-cyan-950/30 via-teal-950/20 to-blue-950/30 blur-[160px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-b from-[#0d1424] via-[#090e18] to-[#07090e] border border-cyan-500/30 p-8 sm:p-12 lg:p-16 shadow-2xl shadow-cyan-950/50 overflow-hidden">
          {/* Subtle Grid Pattern in CTA Card */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left 7 Cols: Headline, Narrative & Trust Badges */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-6 w-fit">
                <Waves className="w-3.5 h-3.5" />
                <span>MUNICIPAL &amp; RESEARCH PARTNERSHIPS</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
                Predict the Flow of Tomorrow.{" "}
                <span className="bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
                  Deploy Crestix Probe Today.
                </span>
              </h2>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mb-8">
                Whether modeling complex urban watersheds, integrating IoT
                sensor telemetry, or benchmarking neural surrogate models
                against shallow-water equations, Crestix Probe provides the
                open, physics-grounded platform.
              </p>

              {/* 3 Core Trust Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono">
                  <div className="text-cyan-400 font-bold mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    Physics-Grounded
                  </div>
                  <div className="text-slate-400 text-[11px] font-sans">
                    Guaranteed mass conservation through hard PINO loss penalties.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono">
                  <div className="text-teal-400 font-bold mb-1 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-teal-400" />
                    Sub-Second Latency
                  </div>
                  <div className="text-slate-400 text-[11px] font-sans">
                    Fourier Neural Operator forward inference under 42ms.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono">
                  <div className="text-slate-200 font-bold mb-1 flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    Open Hardware Mesh
                  </div>
                  <div className="text-slate-400 text-[11px] font-sans">
                    Open ESP32 + ultrasonic sensor firmware &amp; CAD enclosures.
                  </div>
                </div>
              </div>

              {/* Quick Navigation Action Links */}
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/simulation"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-cyan-950/60 hover:from-cyan-400 hover:to-teal-400 transition-all active:scale-95"
                >
                  <span>Launch Live Simulator</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-medium text-sm transition-colors"
                >
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Mission Dashboard</span>
                </Link>

                <Link
                  href="/sensors"
                  className="inline-flex items-center gap-1.5 px-3 py-3 text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  <span>Sensor Arrays</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right 5 Cols: Interactive Pilot Deployment Request Form */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-8 rounded-2xl bg-[#080c14] border border-cyan-500/25 shadow-xl">
                {formSubmitted ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      Pilot Request Initialized
                    </h3>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      Thank you for contacting the Crestix Probe team. Our
                      geospatial hydrodynamic engineers will reach out to{" "}
                      <strong className="text-cyan-300">{formData.email}</strong>{" "}
                      with demonstration datasets and hardware schematics.
                    </p>
                    <button
                      type="button"
                      onClick={() => setFormSubmitted(false)}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 transition-colors"
                    >
                      Submit Another Inquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800 text-xs font-mono">
                      <span className="text-slate-300 font-semibold">
                        REQUEST MUNICIPAL OR RESEARCH PILOT
                      </span>
                      <span className="text-cyan-400 text-[10px]">PILOT-V2</span>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">
                        Organization / University / Agency
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.organization}
                        onChange={(e) =>
                          setFormData({ ...formData, organization: e.target.value })
                        }
                        placeholder="e.g. City Flood Resilience Office / Stanford Fluid Lab"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-slate-800 focus:border-cyan-400 focus:outline-none text-xs text-slate-200 placeholder:text-slate-600 transition-colors font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">
                        Work / Academic Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="engineer@watershed.gov or researcher@univ.edu"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-slate-800 focus:border-cyan-400 focus:outline-none text-xs text-slate-200 placeholder:text-slate-600 transition-colors font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">
                        Catchment Deployment Scope
                      </label>
                      <select
                        value={formData.basinScale}
                        onChange={(e) =>
                          setFormData({ ...formData, basinScale: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-slate-800 focus:border-cyan-400 focus:outline-none text-xs text-slate-200 transition-colors font-mono"
                      >
                        <option value="municipal">
                          Municipal Urban Basin (10 - 100 km²)
                        </option>
                        <option value="critical-infra">
                          Critical Infrastructure (Airports / Highway Corridors)
                        </option>
                        <option value="academic">
                          Academic Research &amp; Synthetic PDE Benchmarks
                        </option>
                        <option value="iot-pilot">
                          Field Hardware Pilot (ESP32 Sensor Array Testing)
                        </option>
                      </select>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs tracking-wide shadow-lg shadow-cyan-950/60 transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Request Pilot Technical Package</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-slate-400 pt-1">
                      <Lock className="w-3 h-3 text-cyan-400" />
                      <span>Zero data tracking • Open science &amp; public sector ready</span>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
