import { SimulationScenario } from "../types";

export const SIMULATION_DISCLAIMER =
  "ILLUSTRATIVE BENCHMARK: All hydrodynamic wave propagation scenarios shown below are calibrated against synthetic shallow-water benchmarks and numerical test basins. Empirical real-world deployment data is subject to in-situ sensor calibration.";

export const SIMULATION_SCENARIOS: SimulationScenario[] = [
  {
    id: "cloudburst-100yr",
    name: "1000-Year Cloudburst Event",
    subtitle: "Central Urban Basin • High Impervious Surface Fraction (82%)",
    rainfallIntensity: "78.4 mm/h",
    durationMinutes: 60,
    returnPeriod: "1-in-1000 Year (P = 0.001)",
    description:
      "A severe convective cloudburst over downtown district with high asphalt density. Stormwater collector conduits reach 100% capacity at t=18 min, triggering street-level overland flash inundation.",
    timesteps: [
      {
        minute: 0,
        maxDepthMeters: 0.04,
        inundatedAreaKm2: 0.12,
        peakDischargeM3s: 1.2,
        riskLevel: "nominal",
        sensorReadings: [
          { nodeId: "CX-N01", label: "Sector Alpha (Culvert Outfall)", elevationM: 12.4, waterDepthM: 0.04, surfaceVelocityMs: 0.15, status: "nominal" },
          { nodeId: "CX-N02", label: "Sector Bravo (Viaduct Depression)", elevationM: 8.2, waterDepthM: 0.02, surfaceVelocityMs: 0.08, status: "nominal" },
          { nodeId: "CX-N03", label: "Sector Charlie (Canal Junction)", elevationM: 6.8, waterDepthM: 0.12, surfaceVelocityMs: 0.35, status: "nominal" },
          { nodeId: "CX-N04", label: "Sector Delta (Underpass Ingress)", elevationM: 5.1, waterDepthM: 0.01, surfaceVelocityMs: 0.05, status: "nominal" },
        ],
        floodZones: [
          { id: "fz-1", path: "M 180,228 H 320 V 258 H 180 Z", depthLevel: 1, velocityVector: { x: 0.2, y: 0.1 } },
        ],
      },
      {
        minute: 15,
        maxDepthMeters: 0.38,
        inundatedAreaKm2: 0.74,
        peakDischargeM3s: 14.8,
        riskLevel: "advisory",
        sensorReadings: [
          { nodeId: "CX-N01", label: "Sector Alpha (Culvert Outfall)", elevationM: 12.4, waterDepthM: 0.32, surfaceVelocityMs: 1.12, status: "rising" },
          { nodeId: "CX-N02", label: "Sector Bravo (Viaduct Depression)", elevationM: 8.2, waterDepthM: 0.28, surfaceVelocityMs: 0.85, status: "rising" },
          { nodeId: "CX-N03", label: "Sector Charlie (Canal Junction)", elevationM: 6.8, waterDepthM: 0.38, surfaceVelocityMs: 1.45, status: "rising" },
          { nodeId: "CX-N04", label: "Sector Delta (Underpass Ingress)", elevationM: 5.1, waterDepthM: 0.15, surfaceVelocityMs: 0.62, status: "nominal" },
        ],
        floodZones: [
          { id: "fz-1", path: "M 150,200 H 380 V 275 H 150 Z", depthLevel: 2, velocityVector: { x: 0.6, y: 0.3 } },
          { id: "fz-2", path: "M 420,150 H 600 V 210 H 420 Z", depthLevel: 1, velocityVector: { x: 0.4, y: 0.2 } },
        ],
      },
      {
        minute: 30,
        maxDepthMeters: 0.95,
        inundatedAreaKm2: 2.15,
        peakDischargeM3s: 42.6,
        riskLevel: "warning",
        sensorReadings: [
          { nodeId: "CX-N01", label: "Sector Alpha (Culvert Outfall)", elevationM: 12.4, waterDepthM: 0.76, surfaceVelocityMs: 2.35, status: "critical" },
          { nodeId: "CX-N02", label: "Sector Bravo (Viaduct Depression)", elevationM: 8.2, waterDepthM: 0.88, surfaceVelocityMs: 1.94, status: "critical" },
          { nodeId: "CX-N03", label: "Sector Charlie (Canal Junction)", elevationM: 6.8, waterDepthM: 0.95, surfaceVelocityMs: 2.65, status: "critical" },
          { nodeId: "CX-N04", label: "Sector Delta (Underpass Ingress)", elevationM: 5.1, waterDepthM: 0.62, surfaceVelocityMs: 1.48, status: "rising" },
        ],
        floodZones: [
          { id: "fz-1", path: "M 110,175 H 430 V 315 H 110 Z", depthLevel: 3, velocityVector: { x: 1.4, y: 0.8 } },
          { id: "fz-2", path: "M 390,120 H 670 V 240 H 390 Z", depthLevel: 2, velocityVector: { x: 0.9, y: 0.5 } },
          { id: "fz-3", path: "M 240,280 H 490 V 365 H 240 Z", depthLevel: 2, velocityVector: { x: 1.1, y: 0.6 } },
        ],
      },
      {
        minute: 45,
        maxDepthMeters: 1.54,
        inundatedAreaKm2: 3.86,
        peakDischargeM3s: 68.3,
        riskLevel: "critical",
        sensorReadings: [
          { nodeId: "CX-N01", label: "Sector Alpha (Culvert Outfall)", elevationM: 12.4, waterDepthM: 1.25, surfaceVelocityMs: 2.85, status: "critical" },
          { nodeId: "CX-N02", label: "Sector Bravo (Viaduct Depression)", elevationM: 8.2, waterDepthM: 1.42, surfaceVelocityMs: 2.45, status: "critical" },
          { nodeId: "CX-N03", label: "Sector Charlie (Canal Junction)", elevationM: 6.8, waterDepthM: 1.54, surfaceVelocityMs: 3.12, status: "critical" },
          { nodeId: "CX-N04", label: "Sector Delta (Underpass Ingress)", elevationM: 5.1, waterDepthM: 1.38, surfaceVelocityMs: 2.15, status: "critical" },
        ],
        floodZones: [
          { id: "fz-1", path: "M 80,150 H 480 V 345 H 80 Z", depthLevel: 4, velocityVector: { x: 1.9, y: 1.1 } },
          { id: "fz-2", path: "M 360,95 H 720 V 265 H 360 Z", depthLevel: 3, velocityVector: { x: 1.4, y: 0.7 } },
          { id: "fz-3", path: "M 200,255 H 550 V 395 H 200 Z", depthLevel: 4, velocityVector: { x: 1.7, y: 0.9 } },
        ],
      },
      {
        minute: 60,
        maxDepthMeters: 1.82,
        inundatedAreaKm2: 4.62,
        peakDischargeM3s: 54.1,
        riskLevel: "critical",
        sensorReadings: [
          { nodeId: "CX-N01", label: "Sector Alpha (Culvert Outfall)", elevationM: 12.4, waterDepthM: 1.48, surfaceVelocityMs: 2.20, status: "critical" },
          { nodeId: "CX-N02", label: "Sector Bravo (Viaduct Depression)", elevationM: 8.2, waterDepthM: 1.76, surfaceVelocityMs: 1.95, status: "critical" },
          { nodeId: "CX-N03", label: "Sector Charlie (Canal Junction)", elevationM: 6.8, waterDepthM: 1.82, surfaceVelocityMs: 2.50, status: "critical" },
          { nodeId: "CX-N04", label: "Sector Delta (Underpass Ingress)", elevationM: 5.1, waterDepthM: 1.69, surfaceVelocityMs: 1.80, status: "critical" },
        ],
        floodZones: [
          { id: "fz-1", path: "M 60,130 H 520 V 365 H 60 Z", depthLevel: 4, velocityVector: { x: 1.5, y: 0.8 } },
          { id: "fz-2", path: "M 330,75 H 750 V 285 H 330 Z", depthLevel: 4, velocityVector: { x: 1.2, y: 0.6 } },
          { id: "fz-3", path: "M 180,235 H 590 V 415 H 180 Z", depthLevel: 4, velocityVector: { x: 1.3, y: 0.7 } },
        ],
      },
    ],
  },
  {
    id: "culvert-surcharge",
    name: "Subsurface Conduit Surcharge",
    subtitle: "Underpass & Transport Corridor • Choke-Point Hydraulic Jump",
    rainfallIntensity: "52.0 mm/h",
    durationMinutes: 60,
    returnPeriod: "1-in-25 Year (P = 0.04)",
    description:
      "A storm drainage pipe capacity failure at a subterranean rail and highway underpass. Hydraulic head backpressure causes high-velocity geysering from surface storm manholes.",
    timesteps: [
      {
        minute: 0,
        maxDepthMeters: 0.02,
        inundatedAreaKm2: 0.05,
        peakDischargeM3s: 0.4,
        riskLevel: "nominal",
        sensorReadings: [
          { nodeId: "CX-N01", label: "Conduit Inflow Throat", elevationM: 14.1, waterDepthM: 0.05, surfaceVelocityMs: 0.3, status: "nominal" },
          { nodeId: "CX-N02", label: "Transit Tunnel Threshold", elevationM: 4.5, waterDepthM: 0.02, surfaceVelocityMs: 0.1, status: "nominal" },
          { nodeId: "CX-N03", label: "Pump Station Sump", elevationM: 2.1, waterDepthM: 0.18, surfaceVelocityMs: 0.2, status: "nominal" },
          { nodeId: "CX-N04", label: "Retention Basin Weir", elevationM: 9.8, waterDepthM: 0.01, surfaceVelocityMs: 0.05, status: "nominal" },
        ],
        floodZones: [
          { id: "fz-1", path: "M 280,248 H 410 V 275 H 280 Z", depthLevel: 1, velocityVector: { x: 0.1, y: 0.1 } },
        ],
      },
      {
        minute: 15,
        maxDepthMeters: 0.22,
        inundatedAreaKm2: 0.38,
        peakDischargeM3s: 6.2,
        riskLevel: "nominal",
        sensorReadings: [
          { nodeId: "CX-N01", label: "Conduit Inflow Throat", elevationM: 14.1, waterDepthM: 0.22, surfaceVelocityMs: 1.4, status: "rising" },
          { nodeId: "CX-N02", label: "Transit Tunnel Threshold", elevationM: 4.5, waterDepthM: 0.18, surfaceVelocityMs: 0.9, status: "rising" },
          { nodeId: "CX-N03", label: "Pump Station Sump", elevationM: 2.1, waterDepthM: 0.45, surfaceVelocityMs: 1.1, status: "rising" },
          { nodeId: "CX-N04", label: "Retention Basin Weir", elevationM: 9.8, waterDepthM: 0.08, surfaceVelocityMs: 0.2, status: "nominal" },
        ],
        floodZones: [
          { id: "fz-1", path: "M 240,230 H 460 V 295 H 240 Z", depthLevel: 1, velocityVector: { x: 0.4, y: 0.2 } },
        ],
      },
      {
        minute: 30,
        maxDepthMeters: 0.64,
        inundatedAreaKm2: 1.12,
        peakDischargeM3s: 21.4,
        riskLevel: "advisory",
        sensorReadings: [
          { nodeId: "CX-N01", label: "Conduit Inflow Throat", elevationM: 14.1, waterDepthM: 0.58, surfaceVelocityMs: 2.1, status: "rising" },
          { nodeId: "CX-N02", label: "Transit Tunnel Threshold", elevationM: 4.5, waterDepthM: 0.64, surfaceVelocityMs: 1.8, status: "critical" },
          { nodeId: "CX-N03", label: "Pump Station Sump", elevationM: 2.1, waterDepthM: 0.92, surfaceVelocityMs: 2.0, status: "critical" },
          { nodeId: "CX-N04", label: "Retention Basin Weir", elevationM: 9.8, waterDepthM: 0.34, surfaceVelocityMs: 0.7, status: "rising" },
        ],
        floodZones: [
          { id: "fz-1", path: "M 200,195 H 510 V 330 H 200 Z", depthLevel: 2, velocityVector: { x: 0.9, y: 0.4 } },
        ],
      },
      {
        minute: 45,
        maxDepthMeters: 1.18,
        inundatedAreaKm2: 1.89,
        peakDischargeM3s: 34.8,
        riskLevel: "warning",
        sensorReadings: [
          { nodeId: "CX-N01", label: "Conduit Inflow Throat", elevationM: 14.1, waterDepthM: 0.88, surfaceVelocityMs: 2.5, status: "critical" },
          { nodeId: "CX-N02", label: "Transit Tunnel Threshold", elevationM: 4.5, waterDepthM: 1.18, surfaceVelocityMs: 2.4, status: "critical" },
          { nodeId: "CX-N03", label: "Pump Station Sump", elevationM: 2.1, waterDepthM: 1.45, surfaceVelocityMs: 2.3, status: "critical" },
          { nodeId: "CX-N04", label: "Retention Basin Weir", elevationM: 9.8, waterDepthM: 0.72, surfaceVelocityMs: 1.2, status: "rising" },
        ],
        floodZones: [
          { id: "fz-1", path: "M 160,165 H 560 V 365 H 160 Z", depthLevel: 3, velocityVector: { x: 1.3, y: 0.7 } },
          { id: "fz-2", path: "M 320,280 H 590 V 385 H 320 Z", depthLevel: 2, velocityVector: { x: 0.8, y: 0.4 } },
        ],
      },
      {
        minute: 60,
        maxDepthMeters: 1.35,
        inundatedAreaKm2: 2.34,
        peakDischargeM3s: 28.5,
        riskLevel: "critical",
        sensorReadings: [
          { nodeId: "CX-N01", label: "Conduit Inflow Throat", elevationM: 14.1, waterDepthM: 0.95, surfaceVelocityMs: 2.2, status: "critical" },
          { nodeId: "CX-N02", label: "Transit Tunnel Threshold", elevationM: 4.5, waterDepthM: 1.35, surfaceVelocityMs: 2.1, status: "critical" },
          { nodeId: "CX-N03", label: "Pump Station Sump", elevationM: 2.1, waterDepthM: 1.62, surfaceVelocityMs: 2.1, status: "critical" },
          { nodeId: "CX-N04", label: "Retention Basin Weir", elevationM: 9.8, waterDepthM: 0.88, surfaceVelocityMs: 1.4, status: "critical" },
        ],
        floodZones: [
          { id: "fz-1", path: "M 140,145 H 580 V 385 H 140 Z", depthLevel: 4, velocityVector: { x: 1.2, y: 0.6 } },
          { id: "fz-2", path: "M 300,260 H 620 V 405 H 300 Z", depthLevel: 3, velocityVector: { x: 0.9, y: 0.5 } },
        ],
      },
    ],
  },
  {
    id: "riverine-surge",
    name: "Riverine Overtopping + Basin Flood",
    subtitle: "Riparian Floodplain Interface • Mixed Fluvial-Pluvial Dynamics",
    rainfallIntensity: "42.5 mm/h",
    durationMinutes: 60,
    returnPeriod: "1-in-50 Year (P = 0.02)",
    description:
      "Combined upstream river swell and local convective rainfall causing levee breach. High volume overflow into low-elevation residential perimeter with steady inundation creep.",
    timesteps: [
      {
        minute: 0,
        maxDepthMeters: 0.15,
        inundatedAreaKm2: 0.40,
        peakDischargeM3s: 22.0,
        riskLevel: "nominal",
        sensorReadings: [
          { nodeId: "CX-N01", label: "Mainstem Levee Crest", elevationM: 18.2, waterDepthM: 0.15, surfaceVelocityMs: 1.8, status: "nominal" },
          { nodeId: "CX-N02", label: "Floodplain Inundation Gage", elevationM: 11.4, waterDepthM: 0.05, surfaceVelocityMs: 0.2, status: "nominal" },
          { nodeId: "CX-N03", label: "Wetland Buffer Zone", elevationM: 8.9, waterDepthM: 0.22, surfaceVelocityMs: 0.4, status: "nominal" },
          { nodeId: "CX-N04", label: "Embankment Sump", elevationM: 7.2, waterDepthM: 0.08, surfaceVelocityMs: 0.1, status: "nominal" },
        ],
        floodZones: [
          { id: "fz-1", path: "M 100,112 H 700 V 142 H 100 Z", depthLevel: 1, velocityVector: { x: 1.5, y: 0.2 } },
        ],
      },
      {
        minute: 15,
        maxDepthMeters: 0.45,
        inundatedAreaKm2: 1.25,
        peakDischargeM3s: 58.0,
        riskLevel: "advisory",
        sensorReadings: [
          { nodeId: "CX-N01", label: "Mainstem Levee Crest", elevationM: 18.2, waterDepthM: 0.45, surfaceVelocityMs: 2.4, status: "rising" },
          { nodeId: "CX-N02", label: "Floodplain Inundation Gage", elevationM: 11.4, waterDepthM: 0.32, surfaceVelocityMs: 0.6, status: "rising" },
          { nodeId: "CX-N03", label: "Wetland Buffer Zone", elevationM: 8.9, waterDepthM: 0.54, surfaceVelocityMs: 0.8, status: "rising" },
          { nodeId: "CX-N04", label: "Embankment Sump", elevationM: 7.2, waterDepthM: 0.28, surfaceVelocityMs: 0.4, status: "rising" },
        ],
        floodZones: [
          { id: "fz-1", path: "M 80,105 H 720 V 175 H 80 Z", depthLevel: 2, velocityVector: { x: 1.9, y: 0.4 } },
        ],
      },
      {
        minute: 30,
        maxDepthMeters: 1.10,
        inundatedAreaKm2: 2.95,
        peakDischargeM3s: 112.5,
        riskLevel: "warning",
        sensorReadings: [
          { nodeId: "CX-N01", label: "Mainstem Levee Crest", elevationM: 18.2, waterDepthM: 0.95, surfaceVelocityMs: 3.2, status: "critical" },
          { nodeId: "CX-N02", label: "Floodplain Inundation Gage", elevationM: 11.4, waterDepthM: 0.85, surfaceVelocityMs: 1.2, status: "critical" },
          { nodeId: "CX-N03", label: "Wetland Buffer Zone", elevationM: 8.9, waterDepthM: 1.10, surfaceVelocityMs: 1.4, status: "critical" },
          { nodeId: "CX-N04", label: "Embankment Sump", elevationM: 7.2, waterDepthM: 0.74, surfaceVelocityMs: 0.9, status: "rising" },
        ],
        floodZones: [
          { id: "fz-1", path: "M 70,95 H 740 V 245 H 70 Z", depthLevel: 3, velocityVector: { x: 2.3, y: 0.6 } },
          { id: "fz-2", path: "M 120,235 H 680 V 325 H 120 Z", depthLevel: 2, velocityVector: { x: 1.1, y: 0.5 } },
        ],
      },
      {
        minute: 45,
        maxDepthMeters: 1.78,
        inundatedAreaKm2: 4.80,
        peakDischargeM3s: 148.0,
        riskLevel: "critical",
        sensorReadings: [
          { nodeId: "CX-N01", label: "Mainstem Levee Crest", elevationM: 18.2, waterDepthM: 1.55, surfaceVelocityMs: 3.8, status: "critical" },
          { nodeId: "CX-N02", label: "Floodplain Inundation Gage", elevationM: 11.4, waterDepthM: 1.45, surfaceVelocityMs: 1.8, status: "critical" },
          { nodeId: "CX-N03", label: "Wetland Buffer Zone", elevationM: 8.9, waterDepthM: 1.78, surfaceVelocityMs: 1.9, status: "critical" },
          { nodeId: "CX-N04", label: "Embankment Sump", elevationM: 7.2, waterDepthM: 1.35, surfaceVelocityMs: 1.4, status: "critical" },
        ],
        floodZones: [
          { id: "fz-1", path: "M 50,85 H 760 V 305 H 50 Z", depthLevel: 4, velocityVector: { x: 2.8, y: 0.8 } },
          { id: "fz-2", path: "M 90,285 H 710 V 395 H 90 Z", depthLevel: 3, velocityVector: { x: 1.5, y: 0.6 } },
        ],
      },
      {
        minute: 60,
        maxDepthMeters: 2.15,
        inundatedAreaKm2: 6.20,
        peakDischargeM3s: 135.0,
        riskLevel: "critical",
        sensorReadings: [
          { nodeId: "CX-N01", label: "Mainstem Levee Crest", elevationM: 18.2, waterDepthM: 1.95, surfaceVelocityMs: 3.4, status: "critical" },
          { nodeId: "CX-N02", label: "Floodplain Inundation Gage", elevationM: 11.4, waterDepthM: 1.88, surfaceVelocityMs: 1.7, status: "critical" },
          { nodeId: "CX-N03", label: "Wetland Buffer Zone", elevationM: 8.9, waterDepthM: 2.15, surfaceVelocityMs: 1.6, status: "critical" },
          { nodeId: "CX-N04", label: "Embankment Sump", elevationM: 7.2, waterDepthM: 1.72, surfaceVelocityMs: 1.5, status: "critical" },
        ],
        floodZones: [
          { id: "fz-1", path: "M 40,75 H 780 V 345 H 40 Z", depthLevel: 4, velocityVector: { x: 2.4, y: 0.7 } },
          { id: "fz-2", path: "M 70,325 H 730 V 425 H 70 Z", depthLevel: 4, velocityVector: { x: 1.6, y: 0.5 } },
        ],
      },
    ],
  },
];

