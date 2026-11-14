"use client";

/**
 * Crestix Probe - ProtectedRoute Component
 * Route boundary component that verifies authentication, renders a radar telemetry scanner
 * during hydration, and redirects unauthorized operators to /login.
 */

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Compass, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ClearanceLevel } from "../types";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredClearance?: ClearanceLevel;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredClearance,
  redirectTo = "/login",
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, status, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const search = typeof window !== "undefined" ? window.location.search : "";
      const fullPath = search ? `${pathname}${search}` : pathname;
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(fullPath || "/dashboard")}`;
      router.replace(redirectUrl);
    }
  }, [isLoading, isAuthenticated, router, pathname, redirectTo]);

  // Loading state with radar scan
  if (isLoading || status === "loading") {
    if (fallback) return <>{fallback}</>;

    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-screen w-full flex flex-col items-center justify-center bg-[#06080e] text-slate-200 select-none"
      >
        <div className="relative flex items-center justify-center w-24 h-24 mb-6">
          {/* Animated radar rings */}
          <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border border-cyan-500/40 animate-pulse" />
          <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-slate-950 border border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <Compass className="w-7 h-7 text-cyan-400 animate-spin [animation-duration:4s]" />
          </div>
        </div>

        <div className="text-center font-mono space-y-1">
          <div className="text-xs tracking-widest uppercase text-cyan-400 font-bold">
            SCANNING ENCLAVE CLEARANCE
          </div>
          <p className="text-[11px] text-slate-500">
            DECRYPTING OPERATOR SESSION TELEMETRY...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // Clearance check if specified
  if (requiredClearance) {
    const clearanceRanks: Record<ClearanceLevel, number> = {
      LEVEL_1: 1,
      LEVEL_2: 2,
      LEVEL_3: 3,
      LEVEL_4: 4,
      DIRECTORATE: 5,
    };

    const userRank = clearanceRanks[user.clearanceLevel] || 1;
    const requiredRank = clearanceRanks[requiredClearance] || 1;

    if (userRank < requiredRank) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#06080e] p-6 text-slate-200">
          <div className="max-w-md w-full rounded-2xl border border-rose-900/60 bg-slate-950/90 p-8 text-center backdrop-blur-md shadow-2xl">
            <div className="mx-auto w-12 h-12 rounded-full border border-rose-500/40 bg-rose-950/40 flex items-center justify-center text-rose-400 mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold font-sans text-rose-200">
              Clearance Level Insufficient
            </h2>
            <p className="mt-2 text-xs font-mono text-slate-400">
              Required: <span className="text-rose-400">{requiredClearance}</span>. Current Operator:{" "}
              <span className="text-slate-300">{user.clearanceLevel}</span>.
            </p>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="mt-6 px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Return to Primary Workspace
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
