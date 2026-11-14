"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Cpu,
  Activity,
  Mountain,
  Download,
} from "lucide-react";
import { usePWA } from "./pwa-provider";

interface BottomNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Forecast", href: "/forecasting", icon: TrendingUp },
  { label: "Simulation", href: "/simulation", icon: Cpu },
  { label: "Sensors", href: "/sensors", icon: Activity },
  { label: "Terrain", href: "/terrain", icon: Mountain },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isInstallable, promptInstall } = usePWA();

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/90 backdrop-blur-xl border-t border-black/[0.06] px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.04)]"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-150 min-h-[48px] touch-manipulation focus:outline-none ${
                isActive
                  ? "text-[#0071e3] font-semibold"
                  : "text-[#86868b] hover:text-[#1d1d1f]"
              }`}
            >
              <div
                className={`relative p-1 rounded-xl transition-colors ${
                  isActive ? "bg-blue-50 border border-blue-200/60" : ""
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-[#0071e3] scale-105" : "text-[#86868b]"}`} />
                {isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#0071e3] animate-pulse" />
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 truncate max-w-[62px] ${isActive ? "text-[#0071e3] font-medium" : "text-[#86868b]"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* PWA Install Quick Trigger if available */}
        {isInstallable && (
          <button
            type="button"
            onClick={promptInstall}
            className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-[#0071e3] hover:text-[#0077ed] transition-colors min-h-[48px] touch-manipulation cursor-pointer"
            aria-label="Install Crestix Probe App"
          >
            <div className="p-1 rounded-xl bg-blue-50 border border-blue-200">
              <Download className="w-5 h-5 text-[#0071e3] animate-bounce" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 text-[#0071e3] font-bold">
              Install
            </span>
          </button>
        )}
      </div>
    </nav>
  );
}
