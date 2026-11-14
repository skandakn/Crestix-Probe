"use client";

/**
 * Crestix Probe - TerrainBackground Component
 * Renders subtle topographical elevation contour curves, planetary coordinates,
 * and radar grid patterns characteristic of the Crestix scientific design system.
 */

import React from "react";

export function TerrainBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none bg-[#05070c]"
    >
      {/* Deep space radial glow */}
      <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-cyan-950/25 blur-[140px]" />
      <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-blue-950/20 blur-[150px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full bg-teal-950/10 blur-[180px]" />

      {/* Topographical contour elevation pattern SVG */}
      <svg
        className="absolute inset-0 h-full w-full opacity-15 stroke-cyan-500/30"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        fill="none"
      >
        {/* Topo lines - simulated elevation terrain */}
        <path
          d="M-100 200 C 300 120, 500 320, 900 220 C 1200 140, 1400 280, 1600 210"
          strokeWidth="1"
          strokeDasharray="4 6"
        />
        <path
          d="M-100 260 C 260 180, 480 380, 880 280 C 1180 190, 1380 340, 1600 270"
          strokeWidth="1.2"
        />
        <path
          d="M-100 330 C 220 250, 460 440, 860 340 C 1150 250, 1360 410, 1600 340"
          strokeWidth="1"
        />
        <path
          d="M-100 410 C 200 320, 430 520, 830 410 C 1120 310, 1330 490, 1600 420"
          strokeWidth="1.4"
          strokeDasharray="8 8"
        />
        <path
          d="M-100 500 C 180 400, 400 610, 800 490 C 1090 380, 1300 580, 1600 510"
          strokeWidth="1"
        />
        <path
          d="M-100 600 C 160 490, 370 710, 770 580 C 1060 460, 1270 680, 1600 610"
          strokeWidth="1.2"
        />
        <path
          d="M-100 710 C 140 590, 340 820, 740 680 C 1030 550, 1240 790, 1600 720"
          strokeWidth="1"
          strokeDasharray="3 6"
        />

        {/* Orthogonal Telemetry Grid */}
        <line x1="180" y1="0" x2="180" y2="900" strokeWidth="0.5" stroke="rgba(56, 189, 248, 0.12)" />
        <line x1="480" y1="0" x2="480" y2="900" strokeWidth="0.5" stroke="rgba(56, 189, 248, 0.08)" />
        <line x1="780" y1="0" x2="780" y2="900" strokeWidth="0.5" stroke="rgba(56, 189, 248, 0.12)" strokeDasharray="2 4" />
        <line x1="1080" y1="0" x2="1080" y2="900" strokeWidth="0.5" stroke="rgba(56, 189, 248, 0.08)" />
        <line x1="1380" y1="0" x2="1380" y2="900" strokeWidth="0.5" stroke="rgba(56, 189, 248, 0.12)" />

        <line x1="0" y1="180" x2="1440" y2="180" strokeWidth="0.5" stroke="rgba(56, 189, 248, 0.08)" />
        <line x1="0" y1="360" x2="1440" y2="360" strokeWidth="0.5" stroke="rgba(56, 189, 248, 0.12)" strokeDasharray="3 5" />
        <line x1="0" y1="540" x2="1440" y2="540" strokeWidth="0.5" stroke="rgba(56, 189, 248, 0.08)" />
        <line x1="0" y1="720" x2="1440" y2="720" strokeWidth="0.5" stroke="rgba(56, 189, 248, 0.12)" />

        {/* Coordinate Crosshairs */}
        <g stroke="rgba(56, 189, 248, 0.35)" strokeWidth="1">
          <path d="M 175 180 h 10 M 180 175 v 10" />
          <path d="M 775 360 h 10 M 780 355 v 10" />
          <path d="M 1075 540 h 10 M 1080 535 v 10" />
          <path d="M 475 720 h 10 M 480 715 v 10" />
        </g>
      </svg>

      {/* Topographic Elevation Annotations */}
      <div className="absolute top-10 left-8 font-mono text-[10px] tracking-widest text-cyan-500/40 uppercase hidden sm:block">
        ELEV: +1,480m // GEO-SECTOR 09-D
      </div>
      <div className="absolute top-10 right-8 font-mono text-[10px] tracking-widest text-cyan-500/40 uppercase hidden sm:block">
        LAT: 28°35&apos;11&quot;N // LON: 80°39&apos;02&quot;W
      </div>
      <div className="absolute bottom-6 left-8 font-mono text-[10px] tracking-widest text-cyan-500/30 uppercase hidden sm:block">
        CRESTIX PROBE DEEP SPACE INSTRUMENTATION
      </div>
      <div className="absolute bottom-6 right-8 font-mono text-[10px] tracking-widest text-cyan-500/30 uppercase hidden sm:block">
        SUBSYSTEM AUTH-ENCLAVE v3.4.1
      </div>

      {/* Scanline overlay */}
      <div
        className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-25"
      />
    </div>
  );
}
