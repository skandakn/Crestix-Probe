"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Waves,
  Radio,
  Menu,
  X,
  ArrowRight,
  Activity,
} from "lucide-react";
import { cn } from "../utils/cn";

interface NavLink {
  label: string;
  href: string;
  badge?: string;
}

const NAV_LINKS: NavLink[] = [
  { label: "Overview", href: "#overview" },
  { label: "Simulation", href: "#simulation", badge: "Interactive" },
  { label: "The Crisis", href: "#problem" },
  { label: "Technology", href: "#technology" },
  { label: "Workflow", href: "#workflow" },
  { label: "Features", href: "#features" },
  { label: "Hardware Node", href: "#hardware", badge: "ESP32" },
  { label: "Research", href: "#research" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);

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
          ? "bg-[#07090e]/90 backdrop-blur-md border-b border-cyan-500/15 py-3 shadow-2xl shadow-black/80"
          : "bg-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            href="#overview"
            onClick={(e) => handleNavClick(e, "#overview")}
            className="group flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg p-1"
            aria-label="Crestix Probe Home"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-950/80 via-charcoal-900 to-teal-950/80 border border-cyan-500/30 group-hover:border-cyan-400/70 transition-all duration-300 shadow-lg shadow-cyan-950/50">
              <Waves className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold tracking-wider text-slate-100 group-hover:text-cyan-300 transition-colors">
                  CRESTIX
                </span>
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 font-semibold tracking-widest">
                  PROBE
                </span>
              </div>
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                Physics-Informed AI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            className="hidden xl:flex items-center gap-1 bg-[#0b0f17]/80 px-3 py-1.5 rounded-full border border-slate-800/80 shadow-inner"
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
                    "relative px-3 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200",
                    isActive
                      ? "text-cyan-300 bg-cyan-950/50 shadow-sm shadow-cyan-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  )}
                >
                  {link.label}
                  {link.badge && (
                    <span className="ml-1.5 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {link.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-cyan-400 rounded-full" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Telemetry Status & Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Live Status Pill */}
            <div className="hidden 2xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SURROGATE: ACTIVE</span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-400">t &lt; 42ms</span>
            </div>

            {/* Launch Platform Link */}
            <Link
              href="/simulation"
              className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-slate-950 font-semibold text-xs tracking-wide shadow-md shadow-cyan-900/40 transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Operator Portal Link */}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-mono transition-all duration-200"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Telemetry</span>
            </Link>
          </div>

          {/* Mobile Menu Hamburger Button */}
          <div className="flex xl:hidden items-center gap-2">
            <Link
              href="/simulation"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-cyan-600 text-slate-950 text-xs font-semibold"
            >
              <span>Demo</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-cyan-400" />
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
          "xl:hidden fixed inset-x-0 top-[72px] bottom-0 bg-[#07090e]/95 backdrop-blur-xl border-t border-slate-800/80 transition-all duration-300 overflow-y-auto z-40 px-6 py-6",
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto translate-y-0"
            : "opacity-0 pointer-events-none -translate-y-4"
        )}
      >
        <div className="flex flex-col gap-2">
          <div className="px-3 py-2 text-[10px] font-mono tracking-widest text-slate-500 uppercase border-b border-slate-800 mb-2">
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
                  "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-cyan-950/60 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-300 hover:bg-slate-900/60 hover:text-white"
                )}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {link.badge}
                  </span>
                )}
              </a>
            );
          })}

          <div className="pt-6 mt-4 border-t border-slate-800 flex flex-col gap-3">
            <Link
              href="/simulation"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-slate-950 font-semibold text-sm shadow-lg shadow-cyan-950/60"
            >
              <span>Launch Flood Simulator</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/sensors"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-sm font-mono hover:text-white"
            >
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Sensor Mesh Live Stream</span>
            </Link>

            <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>SYSTEM STATUS: OPERATIONAL</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Fourier Neural Operator v2.4 • In-Situ Telemetry Online (16 Active Nodes)
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
