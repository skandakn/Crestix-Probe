import type { UserProfile } from "@/types/user";

/**
 * Standard simulated delay for mock API handlers in development.
 */
export async function withMockDelay<T>(data: T, delayMs: number = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delayMs));
}

export const MOCK_CURRENT_USER: UserProfile = {
  id: "usr_cx_0921",
  name: "Dr. Elena Rostova",
  callsign: "AURA-LEAD",
  email: "elena.rostova@crestix-mission.org",
  role: "mission_commander",
  probeClearanceLevel: 5,
  station: "Station Alpha (Primary Command)",
};

export const MOCK_TELEMETRY_SUMMARY = {
  probeId: "CX-PROBE-01",
  missionTime: "MET 142d 08h 22m 19s",
  coordinates: {
    latitude: "-14.2338° S",
    longitude: "175.4921° E",
    elevationMeters: 4218.4,
  },
  environmental: {
    surfaceTemperatureC: -58.4,
    atmosphericPressureKpa: 0.82,
    radiationMsvH: 1.24,
    windVelocityKmh: 14.8,
  },
  subsystems: [
    { name: "Power Distribution (RTG)", status: "nominal", value: "94.2%" },
    { name: "Long-Range Uplink", status: "nominal", value: "-82 dBm" },
    { name: "LiDAR Mapping Sensor", status: "calibrated", value: "Active" },
    { name: "Thermal Regulators", status: "nominal", value: "21.0°C" },
    { name: "Auxiliary Thruster Pack", status: "standby", value: "Ready" },
  ],
};
