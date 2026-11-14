"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Waves,
  Radio,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";
import { cn } from "../utils/cn";

interface NavLink {
  label: string;
  href: string;
  badge?: string;
}

const NAV_LINKS: NavLink[] = [
  { label: "Overview", href: "#overview" },
  { label: "Simulation", href: "#simulation", badge: "Sequence" },
  { label: "Hardware Node", href: "#hardware", badge: "Live ESP32" },
  { label: "The Crisis", href: "#problem" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Section spy
      const sections = NAV_LINKS.map((link) => link.href.substring(1));
      for (const sectionId of sections.reverse()) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const targetId = href.substring(1);
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth" });
        setActiveSection(targetId);
      }
      setMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/85 backdrop-blur-md border-b border-black/[0.06] py-3 shadow-[0_2px_16px_rgba(0,0,0,0.04)]"
          : "bg-white/60 backdrop-blur-sm border-b border-black/[0.03] py-4"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            href="#overview"
            onClick={(e) => handleNavClick(e, "#overview")}
            className="group flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] rounded-xl p-1 transition-transform"
            aria-label="Crestix Probe Home"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0071e3] via-[#0284c7] to-[#06b6d4] text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <Waves className="w-5 h-5 text-white" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold tracking-wider text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors">
                  CRESTIX
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-[#0071e3] font-semibold tracking-wider">
                  PROBE
                </span>
              </div>
              <span className="text-[10px] font-mono tracking-widest text-[#86868b] uppercase">
                Physics-Informed AI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (Apple segmented capsule) */}
          <nav
            className="hidden xl:flex items-center gap-1 bg-[#f5f5f7] px-2 py-1.5 rounded-full border border-black/[0.04]"
            aria-label="Main Navigation"
          >
            {NAV_LINKS.map((link) => {
              const isActive = activeSection === link.href.substring(1);
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={cn(
                    "relative px-3 py-1.5 rounded-full text-xs font-medium tracking-normal transition-all duration-200",
                    isActive
                      ? "text-[#1d1d1f] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] font-semibold"
                      : "text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.03]"
                  )}
                >
                  {link.label}
                  {link.badge && (
                    <span className="ml-1.5 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-blue-50 text-[#0071e3] border border-blue-200/50">
                      {link.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          {/* Telemetry Status & Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Live Status Pill */}
            <div className="hidden 2xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f5f5f7] border border-black/[0.05] text-[11px] font-mono text-[#515154]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>SURROGATE: ACTIVE</span>
              <span className="text-zinc-300">|</span>
              <span className="text-[#0071e3] font-semibold">t &lt; 42ms</span>
            </div>

            {/* Launch Platform Link (Apple Action Blue) */}
            <Link
              href="/simulation"
              className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-xs tracking-normal shadow-sm shadow-blue-500/25 transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Hamburger Button */}
          <div className="flex xl:hidden items-center gap-2">
            <Link
              href="/simulation"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#0071e3] text-white text-xs font-medium"
            >
              <span>Demo</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full bg-[#f5f5f7] border border-zinc-200 text-[#1d1d1f] hover:bg-zinc-200/80 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-[#1d1d1f]" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div
        className={cn(
          "xl:hidden fixed inset-x-0 top-[65px] bottom-0 bg-white/98 backdrop-blur-xl border-t border-black/[0.06] transition-all duration-300 overflow-y-auto z-40 px-6 py-6 shadow-2xl",
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto translate-y-0"
            : "opacity-0 pointer-events-none -translate-y-4"
        )}
      >
        <div className="flex flex-col gap-2">
          <div className="px-3 py-2 text-[10px] font-mono tracking-widest text-[#86868b] uppercase border-b border-zinc-100 mb-2">
            Navigation Index
          </div>
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.href.substring(1);
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-[#0071e3] font-semibold border border-blue-200/50"
                    : "text-[#1d1d1f] hover:bg-[#f5f5f7]"
                )}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100/70 text-[#0071e3] border border-blue-200/60">
                    {link.badge}
                  </span>
                )}
              </a>
            );
          })}

          <div className="pt-6 mt-4 border-t border-zinc-100 flex flex-col gap-3">
            <Link
              href="/simulation"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium text-sm shadow-md shadow-blue-500/20"
            >
              <span>Launch Flood Simulator</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/sensors"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-white border border-zinc-200 text-[#1d1d1f] text-sm font-mono hover:bg-[#f5f5f7]"
            >
              <Radio className="w-4 h-4 text-[#0071e3]" />
              <span>Sensor Mesh Live Stream</span>
            </Link>

            <div className="mt-4 p-4 rounded-2xl bg-[#f5f5f7] border border-zinc-200/70 text-xs text-[#6e6e73] font-mono">
              <div className="flex items-center gap-2 text-emerald-600 mb-1 font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>SYSTEM STATUS: OPERATIONAL</span>
              </div>
              <p className="text-[11px] text-[#86868b]">
                Fourier Neural Operator v2.4 • In-Situ Telemetry Online (16 Active Nodes)
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
