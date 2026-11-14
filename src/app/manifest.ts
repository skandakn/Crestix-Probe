import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Crestix Probe — Urban Flood Forecasting & Telemetry Command",
    short_name: "Crestix Probe",
    description:
      "Real-time physics-informed urban flood forecasting, hydrodynamic simulation, and ESP32 telemetry enclave.",
    start_url: "/",
    id: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#06080e",
    theme_color: "#06080e",
    lang: "en-US",
    categories: ["utilities", "weather", "productivity", "education"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Mission Dashboard",
        short_name: "Dashboard",
        description: "View live telemetry overview and mission statistics",
        url: "/dashboard",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "AI Flood Forecasting",
        short_name: "Forecasting",
        description: "Run neural operator flood depth forecasts",
        url: "/forecasting",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "2D Flood Simulation",
        short_name: "Simulation",
        description: "Run hydrodynamic shallow-water simulation",
        url: "/simulation",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "ESP32 Live Sensors",
        short_name: "Sensors",
        description: "Live ultrasonic telemetry from physical rig",
        url: "/sensors",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Model Validation Analytics",
        short_name: "Analytics",
        description: "Benchmark metrics and comparative model analysis",
        url: "/analytics",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  };
}
