import { SimulationWorkspace } from "@/features/simulation/components/SimulationWorkspace";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flood Simulation Workspace | CRESTIX PROBE",
  description:
    "Interactive 2D hydrodynamic flood propagation workspace. Configure rainfall, terrain conditions, and surface roughness.",
};

export default function SimulationPage() {
  return (
    <main className="min-h-screen bg-slate-950 py-6">
      <SimulationWorkspace />
    </main>
  );
}
