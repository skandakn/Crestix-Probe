"use client";

/**
 * Crestix Probe - AuthLayout Component
 * Scientific dark frame providing topographical terrain backdrop,
 * mission telemetry status indicators, and responsive card styling.
 */

import React from "react";
import Link from "next/link";
import { Compass, ShieldCheck, Radio, AlertOctagon } from "lucide-react";
import { TerrainBackground } from "./TerrainBackground";
import { useAuth } from "../context/AuthContext";

export interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footerContent,
}: AuthLayoutProps) {
  const { isMockAdapter } = useAuth();

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-[#06080e] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Topographical Terrain */}
      <TerrainBackground />

      {/* Top Telemetry Header */}
      <header className="relative z-10 w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 group focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded-md"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-950 via-slate-900 to-slate-950 border border-cyan-500/30 group-hover:border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all">
            <Compass className="w-5 h-5 text-cyan-400 group-hover:rotate-45 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping opacity-75" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs tracking-widest uppercase text-cyan-400 font-bold">
                CRESTIX PROBE
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-slate-700 bg-slate-900 text-slate-400">
                v3.4
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 hidden sm:block">
              DEEP SPACE TELEMETRY &amp; ENCLAVE COMMAND
            </p>
          </div>
        </Link>

        {/* Status Indicators */}
        <div className="flex items-center gap-3">
          {isMockAdapter && (
            <div
              title="Mock authentication adapter active for isolated development"
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[11px] font-mono"
            >
              <AlertOctagon className="w-3 h-3 text-amber-400" />
              <span className="hidden md:inline">DEV:</span> MOCK ADAPTER
            </div>
          )}

          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md border border-slate-800 bg-slate-900/60 text-slate-300 text-[11px] font-mono">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>LINK: NOMINAL</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-cyan-900/40 bg-cyan-950/20 text-cyan-300 text-[11px] font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>SHA-256 SECURE</span>
          </div>
        </div>
      </header>

      {/* Main Form Center Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Scientific Card Frame */}
          <div className="relative rounded-2xl border border-slate-800/90 bg-slate-950/85 p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_60px_-15px_rgba(6,182,212,0.18)]">
            {/* Corner Decorative Tech Markers */}
            <div className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-cyan-500/50" />
            <div className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-cyan-500/50" />
            <div className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-cyan-500/50" />
            <div className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-cyan-500/50" />

            {/* Header info */}
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-950/40 text-cyan-400 text-xs font-mono tracking-widest uppercase mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                SECURITY CLEARANCE GATEWAY
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl font-sans">
                {title}
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm font-mono text-slate-400">
                {subtitle}
              </p>
            </div>

            {/* Form Slot */}
            {children}

            {/* Optional footer content */}
            {footerContent && (
              <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
                {footerContent}
              </div>
            )}
          </div>

          {/* Sub-card security advisory */}
          <div className="mt-4 text-center">
            <p className="text-[10px] font-mono text-slate-400 tracking-wider">
              AUTHORIZED ACCESS ONLY // ALL TERMINAL INTERACTIONS MONITORED
            </p>
          </div>
        </div>
      </main>

      {/* Ground Station Footer */}
      <footer className="relative z-10 w-full border-t border-slate-900 bg-slate-950/80 backdrop-blur-md px-6 py-3 text-center sm:flex sm:justify-between sm:items-center text-[11px] font-mono text-slate-400">
        <div>
          CRESTIX PROBE FLIGHT DATA SYSTEMS &copy; 2026
        </div>
        <div className="flex justify-center gap-4 mt-2 sm:mt-0 text-slate-400">
          <span>OPERATIONS PROTOCOL V3</span>
          <span className="hidden md:inline">&bull;</span>
          <span className="hidden md:inline">SYSTEM TELEMETRY NOMINAL</span>
        </div>
      </footer>
    </div>
  );
}
