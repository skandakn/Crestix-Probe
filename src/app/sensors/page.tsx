import { Suspense } from "react";
import type { Metadata } from "next";
import { SensorMonitoringDashboard } from "../../features/sensors/SensorMonitoringDashboard";

export const metadata: Metadata = {
  title: "Live Hardware Sensor Monitoring | Crestix Probe",
  description:
    "ESP32 ultrasonic water-distance, calculated water depth, ambient temperature, and LDR telemetry monitoring for the physical flood terrain prototype.",
};

export default function SensorsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07090e]" />}>
      <SensorMonitoringDashboard />
    </Suspense>
  );
}
