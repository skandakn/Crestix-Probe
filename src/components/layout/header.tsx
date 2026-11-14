"use client";

import React, { useSyncExternalStore } from "react";
import { Menu, Radio } from "lucide-react";
import { UserProfileArea } from "./user-profile";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { formatMissionTime } from "@/lib/utils";

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
  const currentTime = useSyncExternalStore(
    subscribeTime,
    () => formatMissionTime(),
    () => ""
  );

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-[#07090e]/85 backdrop-blur-md border-b border-slate-800">
      {/* Left: Mobile hamburger & breadcrumb/page title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebarMobile}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#151d2c] border border-slate-800 lg:hidden focus:outline-none"
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
            <h1 className="text-sm md:text-base font-semibold text-white tracking-tight">
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

      {/* Right: User Profile & Status Badges */}
      <div className="flex items-center gap-3">
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
