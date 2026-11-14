"use client";

/**
 * Crestix Probe - User Workspace Dashboard
 * Protected primary operations hub displaying mission telemetry,
 * active subsystems, sensor grids, and the UserProfileMenu.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Radio,
  Activity,
  Layers,
  Cpu,
  RefreshCw,
  HardDrive,
  Globe2,
  Terminal,
} from "lucide-react";
import {
  ProtectedRoute,
  UserProfileMenu,
  TerrainBackground,
  useAuth,
} from "@/features/auth";

export default function DashboardPage() {
  const { user, session, isMockAdapter, adapterName } = useAuth();
  const [missionTime, setMissionTime] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [telemetrySyncCount, setTelemetrySyncCount] = useState(148);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setMissionTime(
        `${now.toISOString().replace("T", " ").substring(0, 19)} UTC`
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleManualSync = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setTelemetrySyncCount((prev) => prev + 1);
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen w-full flex flex-col bg-[#06080e] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {/* Topographic Background */}
        <TerrainBackground />

        {/* Global Dashboard Navigation */}
        <header className="relative z-20 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-3 group focus:outline-none"
            >
              <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-950 via-slate-900 to-slate-950 border border-cyan-500/40 group-hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <Compass className="w-5 h-5 text-cyan-400 group-hover:rotate-45 transition-transform duration-300" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping opacity-75" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs tracking-widest uppercase text-cyan-400 font-bold">
                    CRESTIX PROBE
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-cyan-500/30 bg-cyan-950/40 text-cyan-300">
                    WORKSPACE
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-400 hidden md:block">
                  SECTOR: EPSILON // MISSION T-482
                </p>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-slate-800 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                TRANSPONDER: 8.4 GHz
              </span>
              <span>&bull;</span>
              <span className="text-slate-300">EPOCH: {missionTime || "SYNCING..."}</span>
            </div>
          </div>

          {/* User Profile and Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isRefreshing}
              title="Synchronize telemetry data"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 text-xs font-mono transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
              <span>SYNC TELEMETRY</span>
            </button>

            {/* Profile Dropdown Component */}
            <UserProfileMenu />
          </div>
        </header>

        {/* Dashboard Main Viewport */}
        <main className="relative z-10 flex-1 px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Welcome Mission Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-r from-slate-950/95 via-slate-900/80 to-cyan-950/30 p-6 backdrop-blur-xl shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/50 text-cyan-400 text-[11px] font-mono mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  AUTHENTICATED OPERATOR SESSION ACTIVE
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-sans text-slate-100 tracking-tight">
                  Welcome to Command, {user?.name || "Operator"}
                </h1>
                <p className="mt-1 text-xs sm:text-sm font-mono text-slate-400">
                  Callsign: <span className="text-cyan-300 font-semibold">{user?.callsign || "CRESTIX-OP"}</span> &bull; Clearance:{" "}
                  <span className="text-amber-400 font-semibold">{user?.clearanceLevel}</span> &bull; Organization:{" "}
                  <span className="text-slate-300">{user?.organization || "Crestix Science Division"}</span>
                </p>
              </div>

              {/* Status Pill */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm text-left">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Enclave Adapter</div>
                  <div className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    {adapterName}
                  </div>
                </div>

                <div className="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm text-left">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Buffer Packets</div>
                  <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    {telemetrySyncCount} PACKETS
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dev Mock Warning if applicable */}
          {isMockAdapter && (
            <div className="p-3.5 rounded-xl border border-amber-600/40 bg-amber-950/20 text-amber-300 text-xs font-mono flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>
                  <strong>DEVELOPMENT NOTICE:</strong> Running on isolated MockAuthAdapter. Sessions persist in local storage. Seamlessly switchable to Member 9&apos;s backend adapter via <code className="px-1 py-0.5 rounded bg-black/40 text-amber-200">NEXT_PUBLIC_AUTH_ADAPTER=api</code> without UI changes.
                </span>
              </div>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold">
                MOCK DEV MODE
              </span>
            </div>
          )}

          {/* Mission Instrument Telemetry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Sensor Pod 1: Planetary Probe Orientation */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-5 backdrop-blur-md hover:border-cyan-500/40 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
                  <Globe2 className="w-4 h-4" />
                  <span>TARGET TELEMETRY</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/30 text-emerald-400">
                  LOCKED
                </span>
              </div>
              <div className="mt-3.5 space-y-2 font-mono text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Target Body:</span>
                  <span className="text-slate-100 font-semibold">99942 Apophis</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Heliocentric Dist:</span>
                  <span className="text-slate-100">1.0984 AU</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Relative Velocity:</span>
                  <span className="text-cyan-300">30.73 km/s</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Optical Horizon:</span>
                  <span className="text-emerald-400">NOMINAL</span>
                </div>
              </div>
            </div>

            {/* Sensor Pod 2: Active Security Enclave */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-5 backdrop-blur-md hover:border-cyan-500/40 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-teal-400 font-mono text-xs font-bold">
                  <Cpu className="w-4 h-4" />
                  <span>SECURITY ENCLAVE</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/30 text-cyan-400">
                  ENCRYPTED
                </span>
              </div>
              <div className="mt-3.5 space-y-2 font-mono text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Active Token:</span>
                  <span className="text-slate-300 font-mono text-[10px] truncate max-w-[140px]">
                    {session?.token.substring(0, 18)}...
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Expires At:</span>
                  <span className="text-slate-200">
                    {session?.expiresAt ? new Date(session.expiresAt).toLocaleTimeString() : "24h"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>MFA Status:</span>
                  <span className={user?.mfaEnabled ? "text-emerald-400" : "text-slate-400"}>
                    {user?.mfaEnabled ? "ACTIVE (U2F)" : "STANDARD"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Clearance Level:</span>
                  <span className="text-amber-400">{user?.clearanceLevel}</span>
                </div>
              </div>
            </div>

            {/* Sensor Pod 3: Subsystem Storage & Comms */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-5 backdrop-blur-md hover:border-cyan-500/40 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
                  <HardDrive className="w-4 h-4" />
                  <span>DATA REPOSITORY</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700 bg-slate-900 text-slate-300">
                  74.2% READY
                </span>
              </div>
              <div className="mt-3.5 space-y-2 font-mono text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Spectra Storage:</span>
                  <span className="text-slate-100">1.48 TB / 2.0 TB</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Downlink Throughput:</span>
                  <span className="text-cyan-300">4.82 Gbps</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Signal Noise Ratio:</span>
                  <span className="text-emerald-400">+28.4 dB</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Telemetry Queue:</span>
                  <span className="text-slate-300">0 PENDING ERRORS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subsystem Health Matrix */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
              <div>
                <h3 className="text-sm font-bold font-sans text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  CRESTIX PROBE SUBSYSTEM HEALTH MATRIX
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  Real-time diagnostics across orbital instruments and payload modules
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                ALL SYSTEMS NOMINAL
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40">
                <div className="text-slate-400 text-[10px]">SUB-01 // ENCLAVE AUTH</div>
                <div className="text-cyan-400 font-bold text-sm mt-1">OPERATIONAL</div>
                <div className="text-[10px] text-slate-500 mt-1">Latency: 12ms &bull; Zero Faults</div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40">
                <div className="text-slate-400 text-[10px]">SUB-02 // SPECTROMETER</div>
                <div className="text-emerald-400 font-bold text-sm mt-1">ACTIVE SCAN</div>
                <div className="text-[10px] text-slate-500 mt-1">Integration: 240ms &bull; SNR: 99.4%</div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40">
                <div className="text-slate-400 text-[10px]">SUB-03 // THERMAL ARRAY</div>
                <div className="text-cyan-400 font-bold text-sm mt-1">142.6 K</div>
                <div className="text-[10px] text-slate-500 mt-1">Radiator: Staged &bull; Delta: 0.1 K</div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40">
                <div className="text-slate-400 text-[10px]">SUB-04 // DEEP SPACE COMMS</div>
                <div className="text-emerald-400 font-bold text-sm mt-1">CARRIER LOCKED</div>
                <div className="text-[10px] text-slate-500 mt-1">Antenna: High-Gain &bull; 34m DSN</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
