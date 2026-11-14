"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Radio,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SIDEBAR_SECTIONS } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";

export interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

export function Sidebar({
  isOpen,
  isCollapsed,
  onCloseMobile,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0b0f17] border-r border-slate-800 transition-all duration-300 ease-in-out",
          // Width based on collapse state on desktop
          isCollapsed ? "lg:w-[72px]" : "lg:w-64",
          // Mobile visibility
          isOpen
            ? "translate-x-0 w-64 shadow-2xl shadow-cyan-950/40"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand / Logo Area */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80 bg-[#07090e]/60 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-3 overflow-hidden group focus:outline-none"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-950 via-[#0b0f17] to-teal-950 border border-cyan-500/40 shadow-sm shadow-cyan-500/20 group-hover:border-cyan-400 transition-all shrink-0">
              <Radio className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform animate-pulse" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold tracking-wider text-white font-mono flex items-center gap-1.5">
                  {siteConfig.shortName}
                  <span className="text-[10px] font-normal px-1 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                    PROBE
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 tracking-tight truncate">
                  {siteConfig.missionCode}
                </span>
              </div>
            )}
          </Link>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-[#151d2c] lg:hidden touch-manipulation cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Link Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {SIDEBAR_SECTIONS.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <h4 className="px-3 pb-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold">
                  {section.title}
                </h4>
              )}

              <nav className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  const navLinkContent = (
                    <Link
                      href={item.href}
                      onClick={onCloseMobile}
                      className={cn(
                        "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-cyan-400 touch-manipulation",
                        isActive
                          ? "bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950/30 font-semibold"
                          : "text-slate-400 hover:text-slate-100 hover:bg-[#151d2c] border border-transparent"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive
                            ? "text-cyan-400"
                            : "text-slate-400 group-hover:text-cyan-300"
                        )}
                      />

                      {!isCollapsed && (
                        <div className="flex items-center justify-between w-full min-w-0">
                          <span className="truncate">{item.title}</span>
                          {item.badge && (
                            <Badge
                              variant={item.badgeVariant || "default"}
                              size="sm"
                              className="ml-auto text-[9px] px-1.5 py-0"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Active indicator bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-cyan-400" />
                      )}
                    </Link>
                  );

                  // If sidebar is collapsed on desktop, wrap in tooltip
                  if (isCollapsed) {
                    return (
                      <Tooltip
                        key={item.href}
                        position="right"
                        content={
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-white">{item.title}</span>
                            {item.description && (
                              <span className="text-[10px] text-slate-400">
                                {item.description}
                              </span>
                            )}
                          </div>
                        }
                      >
                        {navLinkContent}
                      </Tooltip>
                    );
                  }

                  return <div key={item.href}>{navLinkContent}</div>;
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer with collapse toggle and system telemetry pill */}
        <div className="p-3 border-t border-slate-800 bg-[#07090e]/60 shrink-0">
          {!isCollapsed && (
            <div className="p-2.5 mb-2 rounded-lg bg-[#101520] border border-slate-800/80 text-[11px] font-mono">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span>DOWNLINK LOCK</span>
                <span className="text-teal-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  NOMINAL
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-teal-500 to-cyan-400 h-full w-[94%]" />
              </div>
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-full p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#151d2c] border border-transparent hover:border-slate-700 transition-colors text-xs font-mono"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            ) : (
              <div className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4 text-slate-400" />
                <span>COLLAPSE CONSOLE</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
