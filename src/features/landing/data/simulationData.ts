import { SimulationScenario } from "../types";

export const SIMULATION_DISCLAIMER =
  "ILLUSTRATIVE BENCHMARK: All hydrodynamic wave propagation scenarios shown below are calibrated against synthetic shallow-water benchmarks and numerical test basins. Empirical real-world deployment data is subject to in-situ sensor calibration.";

export const SIMULATION_SCENARIOS: SimulationScenario[] = [
  {
    id: "cloudburst-100yr",
    name: "100-Year Cloudburst Event",
    subtitle: "Central Urban Basin • High Impervious Surface Fraction (82%)",
    rainfallIntensity: "78.4 mm/h",
    durationMinutes: 60,
    returnPeriod: "1-in-100 Year (P = 0.01)",
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
          { id: "fz-1", path: "M 180,240 Q 220,230 260,245 T 320,250", depthLevel: 1, velocityVector: { x: 0.2, y: 0.1 } },
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
          { id: "fz-1", path: "M 150,220 Q 220,190 290,225 T 380,230 L 370,270 Q 280,260 200,275 Z", depthLevel: 2, velocityVector: { x: 0.6, y: 0.3 } },
          { id: "fz-2", path: "M 420,160 Q 480,140 540,170 T 600,180 L 590,210 Q 510,195 430,205 Z", depthLevel: 1, velocityVector: { x: 0.4, y: 0.2 } },
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
          { id: "fz-1", path: "M 110,200 Q 210,160 310,210 T 430,215 L 420,310 Q 290,295 160,320 Z", depthLevel: 3, velocityVector: { x: 1.4, y: 0.8 } },
          { id: "fz-2", path: "M 390,130 Q 480,105 570,145 T 670,160 L 650,240 Q 530,220 400,235 Z", depthLevel: 2, velocityVector: { x: 0.9, y: 0.5 } },
          { id: "fz-3", path: "M 240,290 Q 320,270 410,295 T 490,320 L 470,360 Q 350,350 250,370 Z", depthLevel: 2, velocityVector: { x: 1.1, y: 0.6 } },
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
          { id: "fz-1", path: "M 80,180 Q 210,130 330,195 T 480,200 L 460,340 Q 300,320 130,350 Z", depthLevel: 4, velocityVector: { x: 1.9, y: 1.1 } },
          { id: "fz-2", path: "M 360,110 Q 480,80 600,125 T 720,140 L 700,270 Q 550,245 370,265 Z", depthLevel: 3, velocityVector: { x: 1.4, y: 0.7 } },
          { id: "fz-3", path: "M 200,270 Q 320,240 440,275 T 550,305 L 530,390 Q 380,380 210,400 Z", depthLevel: 4, velocityVector: { x: 1.7, y: 0.9 } },
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
          { id: "fz-1", path: "M 60,160 Q 200,110 350,180 T 520,185 L 490,360 Q 310,340 100,370 Z", depthLevel: 4, velocityVector: { x: 1.5, y: 0.8 } },
          { id: "fz-2", path: "M 330,90 Q 470,60 620,110 T 750,125 L 730,290 Q 560,265 340,285 Z", depthLevel: 4, velocityVector: { x: 1.2, y: 0.6 } },
          { id: "fz-3", path: "M 180,250 Q 310,220 460,255 T 590,285 L 560,410 Q 390,400 180,420 Z", depthLevel: 4, velocityVector: { x: 1.3, y: 0.7 } },
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
          { id: "fz-1", path: "M 280,260 Q 320,250 360,265 T 410,270", depthLevel: 1, velocityVector: { x: 0.1, y: 0.1 } },
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
          { id: "fz-1", path: "M 240,240 Q 320,220 390,245 T 460,250 L 450,290 Q 370,280 260,295 Z", depthLevel: 1, velocityVector: { x: 0.4, y: 0.2 } },
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
          { id: "fz-1", path: "M 200,210 Q 310,180 420,225 T 510,230 L 490,320 Q 380,310 210,335 Z", depthLevel: 2, velocityVector: { x: 0.9, y: 0.4 } },
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
          { id: "fz-1", path: "M 160,180 Q 300,150 450,205 T 560,210 L 530,350 Q 400,340 180,370 Z", depthLevel: 3, velocityVector: { x: 1.3, y: 0.7 } },
          { id: "fz-2", path: "M 320,290 Q 420,270 510,295 T 590,320 L 570,380 Q 450,370 330,390 Z", depthLevel: 2, velocityVector: { x: 0.8, y: 0.4 } },
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
          { id: "fz-1", path: "M 140,160 Q 290,130 470,190 T 580,200 L 550,370 Q 410,360 160,390 Z", depthLevel: 4, velocityVector: { x: 1.2, y: 0.6 } },
          { id: "fz-2", path: "M 300,270 Q 410,250 520,280 T 620,300 L 590,400 Q 470,390 310,410 Z", depthLevel: 3, velocityVector: { x: 0.9, y: 0.5 } },
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
          { id: "fz-1", path: "M 100,120 Q 250,110 400,130 T 700,125", depthLevel: 1, velocityVector: { x: 1.5, y: 0.2 } },
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
          { id: "fz-1", path: "M 80,110 Q 240,95 420,120 T 720,115 L 710,180 Q 410,175 90,170 Z", depthLevel: 2, velocityVector: { x: 1.9, y: 0.4 } },
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
          { id: "fz-1", path: "M 70,100 Q 230,80 430,110 T 740,105 L 720,250 Q 400,240 80,240 Z", depthLevel: 3, velocityVector: { x: 2.3, y: 0.6 } },
          { id: "fz-2", path: "M 120,240 Q 280,230 460,260 T 680,270 L 660,330 Q 440,320 130,320 Z", depthLevel: 2, velocityVector: { x: 1.1, y: 0.5 } },
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
          { id: "fz-1", path: "M 50,90 Q 220,70 440,100 T 760,95 L 740,310 Q 390,300 60,300 Z", depthLevel: 4, velocityVector: { x: 2.8, y: 0.8 } },
          { id: "fz-2", path: "M 90,290 Q 270,280 480,310 T 710,320 L 690,400 Q 460,390 100,390 Z", depthLevel: 3, velocityVector: { x: 1.5, y: 0.6 } },
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
          { id: "fz-1", path: "M 40,80 Q 210,60 450,90 T 780,85 L 750,350 Q 380,340 50,340 Z", depthLevel: 4, velocityVector: { x: 2.4, y: 0.7 } },
          { id: "fz-2", path: "M 70,330 Q 260,320 490,350 T 730,360 L 710,430 Q 470,420 80,420 Z", depthLevel: 4, velocityVector: { x: 1.6, y: 0.5 } },
        ],
      },
    ],
  },
];
