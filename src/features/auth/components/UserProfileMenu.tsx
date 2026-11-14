"use client";

/**
 * Crestix Probe - UserProfileMenu Component
 * Tactical HUD operator profile dropdown menu with clearance badge display,
 * session telemetry, profile drawer, and secure session termination (logout).
 */

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Shield,
  Clock,
  Terminal,
  Activity,
  ChevronDown,
  Building,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Save,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ClearanceLevel } from "../types";

export function UserProfileMenu() {
  const router = useRouter();
  const { user, session, logout, isMockAdapter, adapterName, updateProfile } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Edit profile state
  const [editName, setEditName] = useState("");
  const [editCallsign, setEditCallsign] = useState("");
  const [editOrg, setEditOrg] = useState("");
  const [editSuccess, setEditSuccess] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Remaining session duration
  const sessionHoursRemaining = useMemo(() => {
    if (!session?.expiresAt) return 24;
    const issued = session.issuedAt || (session.expiresAt - 24 * 60 * 60 * 1000);
    return Math.max(0, Math.round((session.expiresAt - issued) / (1000 * 60 * 60)));
  }, [session]);

  const openEditModal = () => {
    if (user) {
      setEditName(user.name);
      setEditCallsign(user.callsign || "");
      setEditOrg(user.organization || "");
    }
    setEditError(null);
    setEditSuccess(false);
    setIsOpen(false);
    setIsEditModalOpen(true);
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsEditModalOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setEditError(null);
    setEditSuccess(false);

    try {
      await updateProfile({
        name: editName,
        callsign: editCallsign,
        organization: editOrg,
      });
      setEditSuccess(true);
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditSuccess(false);
      }, 900);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  // Format clearance badge
  const clearanceDisplay: Record<ClearanceLevel, { badge: string; color: string }> = {
    LEVEL_1: { badge: "CLEARANCE L1", color: "text-slate-400 border-slate-700 bg-slate-900" },
    LEVEL_2: { badge: "CLEARANCE L2", color: "text-teal-400 border-teal-800/80 bg-teal-950/40" },
    LEVEL_3: { badge: "CLEARANCE L3", color: "text-cyan-400 border-cyan-800/80 bg-cyan-950/40" },
    LEVEL_4: { badge: "RESTRICTED L4", color: "text-amber-400 border-amber-800/80 bg-amber-950/40" },
    DIRECTORATE: { badge: "DIRECTORATE", color: "text-rose-400 border-rose-800/80 bg-rose-950/40" },
  };

  const clearanceInfo = clearanceDisplay[user.clearanceLevel] || {
    badge: "OPERATOR",
    color: "text-slate-400 border-slate-700 bg-slate-900",
  };

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Open operator dossier menu"
        className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-800 hover:border-cyan-500/50 bg-slate-900/80 hover:bg-slate-900 text-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/30 cursor-pointer group shadow-sm"
      >
        {/* Avatar with Clearance Ring */}
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-950 via-slate-900 to-slate-950 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs shadow-inner">
          {initials}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
        </div>

        {/* Text Details (Hidden on tiny screens) */}
        <div className="text-left hidden md:block">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold font-sans text-slate-100 group-hover:text-cyan-300 transition-colors">
              {user.name}
            </span>
            <span className={`text-[9px] font-mono px-1 py-0.2 rounded border ${clearanceInfo.color}`}>
              {clearanceInfo.badge}
            </span>
          </div>
          <div className="text-[10px] font-mono text-cyan-400/80">
            {user.callsign || "CRESTIX-OP"}
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-800/90 bg-slate-950/95 backdrop-blur-xl p-4 shadow-[0_15px_50px_rgba(0,0,0,0.7)] z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header Dossier */}
          <div className="pb-3 border-b border-slate-800/80">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-mono tracking-wider uppercase text-cyan-400">
                  OPERATOR DOSSIER
                </p>
                <h3 className="text-sm font-bold text-slate-100 font-sans mt-0.5">
                  {user.name}
                </h3>
                <p className="text-xs font-mono text-slate-400 truncate max-w-[220px]">
                  {user.email}
                </p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${clearanceInfo.color}`}>
                {clearanceInfo.badge}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-800 bg-slate-900 text-slate-300">
                CALLSIGN: {user.callsign}
              </span>
              {isMockAdapter && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-amber-600/40 bg-amber-950/30 text-amber-400">
                  MOCK ADAPTER
                </span>
              )}
            </div>
          </div>

          {/* Telemetry info */}
          <div className="py-2.5 space-y-1.5 text-[11px] font-mono text-slate-400 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Session Expiration:
              </span>
              <span className="text-slate-200">~{sessionHoursRemaining}h remaining</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-teal-400" />
                Security Adapter:
              </span>
              <span className="text-slate-200">{adapterName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Subsystem Link:
              </span>
              <span className="text-emerald-400 font-semibold">ENCRYPTED</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 space-y-1">
            <button
              type="button"
              role="menuitem"
              onClick={openEditModal}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono text-slate-300 hover:text-cyan-300 hover:bg-slate-900/80 transition-colors text-left cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Edit Operator Dossier</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors text-left cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>{isLoggingOut ? "Terminating Session..." : "Terminate Enclave Session"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs">
                <Shield className="w-4 h-4" />
                <span id="modal-title" className="font-bold uppercase tracking-wider">
                  Update Operator Dossier
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                aria-label="Close dialog"
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editSuccess && (
              <div className="mt-3 p-2.5 rounded border border-emerald-500/40 bg-emerald-950/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Dossier telemetry synchronized successfully.
              </div>
            )}

            {editError && (
              <div className="mt-3 p-2.5 rounded border border-rose-500/40 bg-rose-950/30 text-rose-400 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-3 font-mono text-xs">
              <div>
                <label htmlFor="edit-name" className="block text-slate-300 mb-1">
                  Operator Name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-cyan-500 text-slate-100 outline-none"
                />
              </div>

              <div>
                <label htmlFor="edit-callsign" className="block text-slate-300 mb-1">
                  Tactical Callsign
                </label>
                <input
                  id="edit-callsign"
                  type="text"
                  value={editCallsign}
                  onChange={(e) => setEditCallsign(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-cyan-500 text-slate-100 outline-none"
                />
              </div>

              <div>
                <label htmlFor="edit-org" className="block text-slate-300 mb-1">
                  Assigned Organization
                </label>
                <div className="relative">
                  <input
                    id="edit-org"
                    type="text"
                    value={editOrg}
                    onChange={(e) => setEditOrg(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-cyan-500 text-slate-100 outline-none"
                  />
                  <Building className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? "Saving..." : "Save Dossier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
