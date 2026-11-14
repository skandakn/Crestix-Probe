import type { SensorReading } from "./types.ts";

export const CSV_HEADERS = [
  "reading_id",
  "experiment_id",
  "timestamp_iso",
  "device_millis",
  "position_id",
  "source_mode",
  "measured_distance_cm",
  "reference_height_cm",
  "calculated_water_depth_cm",
  "calibration_underflow_warning",
  "ambient_temperature_c",
  "ldr_light_level_lux",
  "rssi_dbm",
  "fault_code",
] as const;

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates an RFC-4180 compliant CSV string from historical sensor readings.
 * Strictly separates `measured_distance_cm`, `reference_height_cm`, and `calculated_water_depth_cm`,
 * and explicitly preserves `source_mode` (LIVE vs SIMULATED), `position_id`, `experiment_id`, and `timestamp_iso`.
 */
export function buildSensorReadingsCsv(readings: SensorReading[]): string {
  const headerRow = CSV_HEADERS.join(",");
  const rows = readings.map((r) =>
    [
      escapeCsvCell(r.readingId),
      escapeCsvCell(r.experimentId),
      escapeCsvCell(r.timestamp),
      escapeCsvCell(r.deviceMillis),
      escapeCsvCell(r.position),
      escapeCsvCell(r.sourceMode),
      escapeCsvCell(r.measuredDistanceCm !== null ? r.measuredDistanceCm.toFixed(2) : ""),
      escapeCsvCell(r.referenceHeightCm.toFixed(2)),
      escapeCsvCell(
        r.calculatedWaterDepthCm !== null ? r.calculatedWaterDepthCm.toFixed(2) : ""
      ),
      escapeCsvCell(r.calibrationUnderflowWarning),
      escapeCsvCell(r.ambientTemperatureC !== null ? r.ambientTemperatureC.toFixed(1) : ""),
      escapeCsvCell(r.ldrLightLevelLux !== null ? r.ldrLightLevelLux : ""),
      escapeCsvCell(r.rssiDbm !== null ? r.rssiDbm : ""),
      escapeCsvCell(r.faultCode),
    ].join(",")
  );

  return [headerRow, ...rows].join("\n");
}

/**
 * Triggers a browser download of the generated CSV file.
 */
export function downloadSensorReadingsCsv(
  readings: SensorReading[],
  experimentId: string,
  positionFilter: string = "ALL"
): string {
  const csvContent = buildSensorReadingsCsv(readings);
  const safeExp = (experimentId || "EXP").replace(/[^a-zA-Z0-9_-]/g, "_");
  const timestampSlug = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `crestix-sensor-telemetry_${safeExp}_${positionFilter}_${timestampSlug}.csv`;

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return filename;
}
