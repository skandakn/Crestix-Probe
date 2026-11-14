import React from "react";
import { Mountain } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { FeatureShell } from "@/components/layout/feature-shell";

export default function TerrainPage() {
  return (
    <AppShell title="Terrain Mapping">
      <FeatureShell
        moduleName="Terrain Elevation & LiDAR Mapping"
        moduleRoute="/terrain"
        owner="Member 2"
        description="3D topological elevation maps, obstacle detection, crater profiling, and traverse waypoint planning for Crestix Probe."
        icon={<Mountain className="w-5 h-5 text-cyan-400" />}
        deliverables={[
          "3D interactive surface heightmap renderer using WebGL or Three.js",
          "LiDAR point-cloud visualization and slope gradient heatmaps",
          "Geological hazard zone marking (crevasses, boulders > 0.5m, steep inclines)",
          "Probe traverse pathing calculator with safe zone boundaries",
          "Elevation contour profile graphs along planned route",
        ]}
        suggestedEndpoints={[
          "GET /api/terrain/elevation-grid?bounds=...",
          "GET /api/terrain/hazards?radius=...",
          "POST /api/terrain/path-plan",
        ]}
        mockDataPath="src/features/terrain/mock-terrain.ts"
      />
    </AppShell>
  );
}
