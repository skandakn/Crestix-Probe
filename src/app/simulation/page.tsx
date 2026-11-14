import React from "react";
import { Cpu } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { FeatureShell } from "@/components/layout/feature-shell";

export default function SimulationPage() {
  return (
    <AppShell title="Probe Simulation">
      <FeatureShell
        moduleName="Physics & Descent Simulation"
        moduleRoute="/simulation"
        owner="Member 3"
        description="Orbital mechanics, descent thruster vectors, delta-V fuel budgets, and touchdown impact physics simulation."
        icon={<Cpu className="w-5 h-5 text-cyan-400" />}
        deliverables={[
          "Physics simulation loop for orbital descent and deceleration burn",
          "Reaction Control System (RCS) thruster impulse vectors in 3D",
          "Propellant mass expenditure vs. delta-V velocity curve",
          "Interactive simulation timeline controls (Play, Pause, Fast-forward, Scrub)",
          "Monte Carlo touchdown dispersion ellipses and landing accuracy",
        ]}
        suggestedEndpoints={[
          "POST /api/simulation/run-trajectory",
          "GET /api/simulation/state?step=...",
          "POST /api/simulation/abort-scenario",
        ]}
        mockDataPath="src/features/simulation/mock-simulation.ts"
      />
    </AppShell>
  );
}
