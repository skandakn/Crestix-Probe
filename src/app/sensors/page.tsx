import React from "react";
import { Activity } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { FeatureShell } from "@/components/layout/feature-shell";

export default function SensorsPage() {
  return (
    <AppShell title="Sensors & Telemetry">
      <FeatureShell
        moduleName="Multi-Spectral Sensor Arrays"
        moduleRoute="/sensors"
        owner="Member 5"
        description="Comprehensive real-time telemetry feed from onboard instruments including LiDAR, spectrometer, magnetometer, and thermocouples."
        icon={<Activity className="w-5 h-5 text-cyan-400" />}
        deliverables={[
          "Instrument telemetry health matrix with real-time signal strength (dBm)",
          "Multi-channel sensor stream graphs (thermal, magnetic, radiation, atmospheric)",
          "Telemetry frame loss monitor and packet CRC error rate counter",
          "Automated sensor calibration routine triggers and baseline adjustments",
          "Raw byte stream hexadecimal inspector for payload packets",
        ]}
        suggestedEndpoints={[
          "GET /api/sensors/stream (SSE or WebSocket)",
          "GET /api/sensors/health",
          "POST /api/sensors/calibrate/:sensorId",
        ]}
        mockDataPath="src/features/sensors/mock-sensors.ts"
      />
    </AppShell>
  );
}
