"use client";

import React, { useSyncExternalStore } from "react";
import { Download, Menu, Radio } from "lucide-react";
import { UserProfileArea } from "./user-profile";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { formatMissionTime } from "@/lib/utils";
import { usePWA } from "@/components/pwa/pwa-provider";

export interface HeaderProps {
  onToggleSidebarMobile: () => void;
  title?: string;
  isCollapsed?: boolean;
}

function subscribeTime(callback: () => void) {
  const timer = setInterval(callback, 1000);
  return () => clearInterval(timer);
}

export function Header({ onToggleSidebarMobile, title }: HeaderProps) {
  const { isInstallable, promptInstall } = usePWA();
  const currentTime = useSyncExternalStore(
    subscribeTime,
    () => formatMissionTime(),
    () => ""
  );

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-[#07090e]/90 backdrop-blur-md border-b border-slate-800">
      {/* Left: Mobile hamburger & breadcrumb/page title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebarMobile}
          className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-[#151d2c] border border-slate-800 lg:hidden focus:outline-none touch-manipulation cursor-pointer"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-xs font-mono text-cyan-400 font-semibold">
              {siteConfig.missionCode}
            </span>
            <span className="hidden sm:inline-block text-slate-600">/</span>
            <h1 className="text-sm md:text-base font-semibold text-white tracking-tight truncate max-w-[200px] sm:max-w-none">
              {title || "Command Console"}
            </h1>
          </div>
        </div>
      </div>

      {/* Center: Live Telemetry Indicator */}
      <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0b0f17] border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
          <span className="text-slate-300">DOWNLINK:</span>
          <span className="text-teal-300 font-bold">142 ms</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0b0f17] border border-slate-800">
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300">ORBIT:</span>
          <span className="text-cyan-300">{siteConfig.probeStatus.orbitPhase}</span>
        </div>

        {currentTime && (
          <div className="text-slate-400 text-[11px] px-2 py-0.5 rounded bg-[#0b0f17] border border-slate-800/80">
            {currentTime}
          </div>
        )}
      </div>

      {/* Right: PWA Install, User Profile & Status Badges */}
      <div className="flex items-center gap-2 sm:gap-3">
        {isInstallable && (
          <button
            type="button"
            onClick={promptInstall}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/40 text-teal-300 hover:bg-teal-500/20 text-xs font-medium transition-colors cursor-pointer touch-manipulation"
            aria-label="Install Crestix PWA to device"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xs:inline text-[11px]">Install App</span>
          </button>
        )}

        <Badge
          variant="cyan"
          size="sm"
          dot
          pulse
          className="hidden sm:inline-flex"
        >
          TELEM-ONLINE
        </Badge>

        <UserProfileArea />
      </div>
    </header>
  );
}
