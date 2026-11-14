"use client";

import React from "react";
import Link from "next/link";
import {
  Waves,
  Radio,
  Cpu,
  ArrowUp,
  ShieldCheck,
  Compass,
  FileText,
  ExternalLink,
  Activity,
  Code2,
} from "lucide-react";

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-[#05070b] border-t border-slate-800/90 text-slate-400 font-sans text-xs">
      {/* Upper Grid of Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1 & 2: Brand Identity & Mission Statement */}
          <div className="lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-950 to-teal-950 border border-cyan-500/30">
                  <Waves className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-base font-bold tracking-wider text-white">
                    CRESTIX PROBE
                  </span>
                  <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
                    Predicting the Flow of Tomorrow
                  </span>
                </div>
              </div>

              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 max-w-sm">
                A physics-informed AI platform for real-time urban flood
                forecasting using hydrodynamic simulation, neural surrogate
                models and physical sensor validation.
              </p>

              {/* Status Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 mb-6">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>SURROGATE: ACTIVE</span>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-400">16 NODES ONLINE</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              Designed for municipal resilience agencies, hydrological
              institutes, and environmental research laboratories worldwide.
            </div>
          </div>

          {/* Col 3: Architecture & Modeling */}
          <div>
            <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-4">
              Architecture
            </h3>
            <ul className="space-y-2.5 font-sans">
              <li>
                <a
                  href="#technology"
                  className="hover:text-cyan-300 transition-colors"
                >
                  2D Shallow Water Equations
                </a>
              </li>
              <li>
                <a
                  href="#technology"
                  className="hover:text-cyan-300 transition-colors"
                >
                  Fourier Neural Operators (FNO)
                </a>
              </li>
              <li>
                <a
                  href="#technology"
                  className="hover:text-cyan-300 transition-colors"
                >
                  Physics-Informed PINO Loss
                </a>
              </li>
              <li>
                <a
                  href="#hardware"
                  className="hover:text-cyan-300 transition-colors"
                >
                  ESP32 Ultrasonic Ranging Node
                </a>
              </li>
              <li>
                <a
                  href="#workflow"
                  className="hover:text-cyan-300 transition-colors"
                >
                  Ensemble Kalman Assimilation
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform Modules */}
          <div>
            <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-4">
              Platform Modules
            </h3>
            <ul className="space-y-2.5 font-sans">
              <li>
                <Link
                  href="/simulation"
                  className="hover:text-cyan-300 transition-colors flex items-center justify-between"
                >
                  <span>Hydrodynamic Simulator</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Live
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-cyan-300 transition-colors"
                >
                  Mission Telemetry Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/sensors"
                  className="hover:text-cyan-300 transition-colors"
                >
                  Edge Sensor Mesh Stream
                </Link>
              </li>
              <li>
                <Link
                  href="/forecasting"
                  className="hover:text-cyan-300 transition-colors"
                >
                  Precipitation Hyetographs
                </Link>
              </li>
              <li>
                <Link
                  href="/analytics"
                  className="hover:text-cyan-300 transition-colors"
                >
                  Catchment Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Research & Access */}
          <div>
            <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-4">
              Research &amp; Access
            </h3>
            <ul className="space-y-2.5 font-sans">
              <li>
                <a
                  href="#research"
                  className="hover:text-cyan-300 transition-colors"
                >
                  Scaling Benchmarks Matrix
                </a>
              </li>
              <li>
                <a
                  href="#research"
                  className="hover:text-cyan-300 transition-colors"
                >
                  Academic Foundations
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/skandakn/Crestix-Probe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-300 transition-colors flex items-center gap-1.5"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <Link
                  href="/login"
                  className="hover:text-cyan-300 transition-colors"
                >
                  Operator Authorization Portal
                </Link>
              </li>
              <li>
                <a href="#cta" className="hover:text-cyan-300 transition-colors">
                  Request Technical Whitepaper
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal, Data Integrity & Scroll-To-Top Strip */}
      <div className="border-t border-slate-800/80 bg-[#030508]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-[11px] text-slate-400">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span>© 2026 Crestix Probe. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span className="text-slate-400">
              Demonstration benchmark content is illustrative until measured
              field experiments are completed.
            </span>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
