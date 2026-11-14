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
} from "lucide-react";

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
      className="relative py-28 bg-white border-b border-black/[0.06] overflow-hidden"
    >
      {/* Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-500/[0.04] blur-[160px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-b from-[#fbfbfd] via-[#f5f5f7] to-[#ffffff] border border-zinc-200/90 p-8 sm:p-12 lg:p-16 shadow-[0_12px_44px_rgba(0,0,0,0.05)] overflow-hidden">
          {/* Subtle Precision Grid in CTA Card */}
          <div className="absolute inset-0 bg-[radial-gradient(#00000008_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left 7 Cols: Headline, Narrative & Trust Badges */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-[#0071e3] text-xs font-mono mb-6 w-fit font-semibold">
                <Waves className="w-3.5 h-3.5" />
                <span>MUNICIPAL &amp; RESEARCH PARTNERSHIPS</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-6 leading-tight">
                Predict the Flow of Tomorrow.{" "}
                <span className="bg-gradient-to-r from-[#0071e3] via-[#0284c7] to-[#06b6d4] bg-clip-text text-transparent">
                  Deploy Crestix Probe Today.
                </span>
              </h2>

              <p className="text-base sm:text-lg text-[#6e6e73] leading-relaxed max-w-2xl mb-8">
                Whether modeling complex urban watersheds, integrating IoT
                sensor telemetry, or benchmarking neural surrogate models
                against shallow-water equations, Crestix Probe provides the
                open, physics-grounded platform.
              </p>

              {/* 3 Core Trust Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8">
                <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-xs text-xs font-mono">
                  <div className="text-[#0071e3] font-bold mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#0071e3]" />
                    Physics-Grounded
                  </div>
                  <div className="text-[#6e6e73] text-[11px] font-sans">
                    Guaranteed mass conservation through hard PINO loss penalties.
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-xs text-xs font-mono">
                  <div className="text-[#0284c7] font-bold mb-1 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-[#0284c7]" />
                    Sub-Second Latency
                  </div>
                  <div className="text-[#6e6e73] text-[11px] font-sans">
                    Fourier Neural Operator forward inference under 42ms.
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-xs text-xs font-mono">
                  <div className="text-[#1d1d1f] font-bold mb-1 flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-[#0071e3]" />
                    Open Hardware Mesh
                  </div>
                  <div className="text-[#6e6e73] text-[11px] font-sans">
                    Open ESP32 + ultrasonic sensor firmware &amp; CAD enclosures.
                  </div>
                </div>
              </div>

              {/* Quick Navigation Action Links */}
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/simulation"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-sm tracking-normal shadow-md shadow-blue-500/25 transition-all active:scale-95"
                >
                  <span>Launch Live Simulator</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200/90 text-[#1d1d1f] font-medium text-sm transition-colors shadow-xs"
                >
                  <Cpu className="w-4 h-4 text-[#0071e3]" />
                  <span>Mission Dashboard</span>
                </Link>

                <Link
                  href="/sensors"
                  className="inline-flex items-center gap-1.5 px-4 py-3.5 text-xs font-mono text-[#6e6e73] hover:text-[#0071e3] transition-colors"
                >
                  <span>Sensor Arrays</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right 5 Cols: Interactive Pilot Deployment Request Form */}
            <div className="lg:col-span-5">
              <div className="p-7 sm:p-9 rounded-3xl bg-white border border-zinc-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                {formSubmitted ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-[#1d1d1f]">
                      Pilot Request Initialized
                    </h3>
                    <p className="text-xs text-[#6e6e73] font-sans leading-relaxed">
                      Thank you for contacting the Crestix Probe team. Our
                      geospatial hydrodynamic engineers will reach out to{" "}
                      <strong className="text-[#0071e3] font-semibold">{formData.email}</strong>{" "}
                      with demonstration datasets and hardware schematics.
                    </p>
                    <button
                      type="button"
                      onClick={() => setFormSubmitted(false)}
                      className="px-4 py-2 rounded-full bg-[#f5f5f7] hover:bg-zinc-200 text-xs font-mono text-[#1d1d1f] transition-colors font-medium"
                    >
                      Submit Another Inquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-100 text-xs font-mono">
                      <span className="text-[#1d1d1f] font-semibold">
                        REQUEST MUNICIPAL OR RESEARCH PILOT
                      </span>
                      <span className="text-[#0071e3] text-[10px] font-bold">PILOT-V2</span>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-[#6e6e73] mb-1.5 font-medium">
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
                        className="w-full px-4 py-2.5 rounded-xl bg-[#fbfbfd] border border-zinc-200 focus:border-[#0071e3] focus:outline-none text-xs text-[#1d1d1f] placeholder:text-[#86868b] transition-colors font-sans shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-[#6e6e73] mb-1.5 font-medium">
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
                        className="w-full px-4 py-2.5 rounded-xl bg-[#fbfbfd] border border-zinc-200 focus:border-[#0071e3] focus:outline-none text-xs text-[#1d1d1f] placeholder:text-[#86868b] transition-colors font-sans shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-[#6e6e73] mb-1.5 font-medium">
                        Catchment Deployment Scope
                      </label>
                      <select
                        value={formData.basinScale}
                        onChange={(e) =>
                          setFormData({ ...formData, basinScale: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl bg-[#fbfbfd] border border-zinc-200 focus:border-[#0071e3] focus:outline-none text-xs text-[#1d1d1f] transition-colors font-mono shadow-2xs"
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
                        className="w-full py-3.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold text-xs tracking-normal shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Request Pilot Technical Package</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#86868b] pt-1">
                      <Lock className="w-3 h-3 text-[#0071e3]" />
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
