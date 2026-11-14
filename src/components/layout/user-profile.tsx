"use client";

import React, { useState } from "react";
import { MOCK_CURRENT_USER } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export function UserProfileArea() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const user = MOCK_CURRENT_USER;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-lg border border-slate-800 bg-[#0b0f17] hover:bg-[#151d2c] hover:border-slate-700 transition-all cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-cyan-400"
        aria-label="User profile options"
      >
        <div className="relative flex items-center justify-center w-8 h-8 rounded-md bg-gradient-to-br from-cyan-900 to-slate-900 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold">
          {user.callsign.substring(0, 2)}
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-teal-400 ring-2 ring-[#0b0f17]" />
        </div>
        <div className="hidden md:flex flex-col">
          <span className="text-xs font-semibold text-slate-100 leading-tight">
            {user.callsign}
          </span>
          <span className="text-[10px] font-mono text-slate-400 leading-tight">
            LVL {user.probeClearanceLevel} • {user.name.split(" ")[1]}
          </span>
        </div>
      </button>

      {/* Operator Profile Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Probe Operator Credentials"
        description="Active console authorization session for Crestix Probe"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-mono text-slate-400">
              Clearance: TOP_SECRET_SCI
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-[#07090e] border border-slate-800">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 font-mono text-base font-bold">
              {user.callsign.substring(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-white">{user.name}</h4>
                <Badge variant="cyan" size="sm" dot>
                  ONLINE
                </Badge>
              </div>
              <p className="text-xs font-mono text-cyan-400 mt-0.5">Callsign: {user.callsign}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-md bg-[#101520] border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Assigned Role
              </span>
              <span className="font-semibold text-slate-200 capitalize">
                {user.role.replace("_", " ")}
              </span>
            </div>
            <div className="p-3 rounded-md bg-[#101520] border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Clearance Level
              </span>
              <span className="font-semibold text-teal-300">
                Level {user.probeClearanceLevel} (Commander)
              </span>
            </div>
            <div className="p-3 rounded-md bg-[#101520] border border-slate-800 col-span-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Ground Control Station
              </span>
              <span className="font-semibold text-slate-200">{user.station}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Session Encryption: AES-256-GCM</span>
            <span className="text-teal-400 font-mono">Telemetry Lock: 100%</span>
          </div>
        </div>
      </Modal>
    </>
  );
}
