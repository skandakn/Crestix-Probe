export const siteConfig = {
  name: "Crestix Probe",
  shortName: "CRESTIX",
  tagline: "Autonomous Exploration & Surface Telemetry Architecture",
  version: "0.1.0-alpha",
  missionCode: "CX-PROBE-01",
  links: {
    github: "https://github.com/skandakn/Crestix-Probe",
    docs: "/dashboard",
  },
  probeStatus: {
    telemetryOnline: true,
    orbitPhase: "Descent Insertion",
    batteryLevel: 94,
    signalLatencyMs: 142,
    subsystemsActive: 12,
  },
} as const;

export type SiteConfig = typeof siteConfig;
