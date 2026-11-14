import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  createApiErrorEnvelope,
  MOCK_SENSOR_LATEST,
  validateSensorPayload,
  validateTerrainUploadFile,
} from "../mocks/api-contracts";
import {
  SimulationControlHarness,
  SensorTelemetryHarness,
  TerrainValidationHarness,
} from "../harnesses/CrestixTestHarness";

describe("Core Feature Contracts & Data Integrity", () => {
  it("validates terrain file uploads and rejects unsupported or empty files", () => {
    expect(
      validateTerrainUploadFile({ name: "flume_dem.tif", size: 102400, type: "image/tiff" })
    ).toEqual({ valid: true });

    expect(
      validateTerrainUploadFile({ name: "empty.tif", size: 0, type: "image/tiff" }).valid
    ).toBe(false);

    expect(
      validateTerrainUploadFile({ name: "malware.exe", size: 2048 }).valid
    ).toBe(false);

    expect(
      validateTerrainUploadFile({ name: "huge.dem", size: 60 * 1024 * 1024 }).valid
    ).toBe(false);
  });

  it("displays terrain upload validation feedback in UI", () => {
    render(<TerrainValidationHarness />);
    const input = screen.getByTestId("terrain-upload-input") as HTMLInputElement;

    const badFile = new File(["bad"], "photo.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [badFile] } });
    expect(screen.getByTestId("terrain-upload-error")).toHaveTextContent(/Unsupported terrain format/i);

    const goodFile = new File(["dem-content"], "basin.tif", { type: "image/tiff" });
    fireEvent.change(input, { target: { files: [goodFile] } });
    expect(screen.getByTestId("terrain-upload-success")).toHaveTextContent(/Validated basin\.tif/i);
  });

  it("enforces sensor payload integrity and never conflates distance_cm with water_depth_cm", () => {
    const validCheck = validateSensorPayload(
      {
        experiment_id: "EXP001",
        position: "P2",
        timestamp: "2026-11-14T10:30:05Z",
        distance_cm: 8.2,
        water_depth_cm: 11.8,
        temperature_c: 29.0,
      },
      20.0
    );
    expect(validCheck.valid).toBe(true);
    expect(validCheck.calculatedDepthCm).toBe(11.8);

    const conflatedCheck = validateSensorPayload(
      {
        experiment_id: "EXP001",
        position: "P2",
        timestamp: "2026-11-14T10:30:05Z",
        distance_cm: 8.2,
        water_depth_cm: 8.2,
        temperature_c: 29.0,
      },
      20.0
    );
    expect(conflatedCheck.valid).toBe(false);
    expect(conflatedCheck.errors.join(" ")).toMatch(/conflated|mismatch/i);
  });

  it("switches probe positions P1, P2, P3 in SensorTelemetryHarness while keeping distance and depth distinct", () => {
    render(<SensorTelemetryHarness />);
    expect(screen.getByTestId("sensor-distance-card")).toHaveTextContent("8.2 cm");
    expect(screen.getByTestId("sensor-depth-card")).toHaveTextContent("11.8 cm");

    fireEvent.click(screen.getByTestId("sensor-pos-P1"));
    expect(screen.getByTestId("sensor-distance-card")).toHaveTextContent("9.5 cm");
    expect(screen.getByTestId("sensor-depth-card")).toHaveTextContent("10.5 cm");
  });

  it("operates simulation controls (Run, Pause, Reset) and displays honest stub notice", () => {
    render(<SimulationControlHarness />);
    expect(screen.getByTestId("sim-stub-notice")).toHaveTextContent(/STUBBED ADAPTER/i);
    expect(screen.getByTestId("sim-status-badge")).toHaveTextContent(/IDLE/i);

    fireEvent.click(screen.getByTestId("sim-run-btn"));
    expect(screen.getByTestId("sim-status-badge")).toHaveTextContent(/RUNNING/i);

    fireEvent.click(screen.getByTestId("sim-pause-btn"));
    expect(screen.getByTestId("sim-status-badge")).toHaveTextContent(/PAUSED/i);
  });

  it("constructs structured API error envelopes matching backend contract", () => {
    const err = createApiErrorEnvelope(
      "RESOURCE_NOT_FOUND",
      "Experiment 'EXP999' was not found.",
      "/api/experiments/EXP999"
    );
    expect(err.error.code).toBe("RESOURCE_NOT_FOUND");
    expect(err.error.path).toBe("/api/experiments/EXP999");
    expect(err.error.timestamp).toBeTruthy();
    expect(MOCK_SENSOR_LATEST.raw_distance_cm).not.toBe(MOCK_SENSOR_LATEST.calculated_water_depth_cm);
  });
});
