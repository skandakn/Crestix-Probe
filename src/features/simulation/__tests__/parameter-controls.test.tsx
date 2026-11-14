import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ParameterControls } from "../components/ParameterControls";
import { SimulationRunRequest } from "../types/contract";

describe("ParameterControls Component", () => {
  const mockConfig: SimulationRunRequest = {
    terrainId: "test-terrain",
    gridDimensions: { rows: 20, cols: 20, cellSizeMeters: 10 },
    rainfall: { intensityMmPerHour: 50, durationMinutes: 60 },
    initialWaterDepthMeters: 0.05,
    surfaceRoughnessManning: 0.035,
    boundaryConditions: {
      north: "closed",
      south: "open",
      east: "closed",
      west: "closed",
    },
    timeStepSeconds: 30,
    totalDurationMinutes: 120,
  };

  it("renders rainfall, roughness, depth, and boundary condition controls", () => {
    render(
      <ParameterControls
        config={mockConfig}
        onChangeConfig={vi.fn()}
        onStartSimulation={vi.fn()}
        onResetSimulation={vi.fn()}
        isLoading={false}
        activeAdapterType="mock"
        onToggleAdapter={vi.fn()}
        hasFrames={false}
      />
    );

    expect(screen.getByText("Rainfall Intensity")).toBeDefined();
    expect(screen.getByText("Rainfall Duration")).toBeDefined();
    expect(screen.getByText("Initial Water Depth")).toBeDefined();
    expect(screen.getByText(/Surface Roughness/i)).toBeDefined();
    expect(screen.getByText(/Grid Boundary Conditions/i)).toBeDefined();
  });

  it("calls onStartSimulation when Launch Simulation button is clicked", () => {
    const handleStart = vi.fn();
    render(
      <ParameterControls
        config={mockConfig}
        onChangeConfig={vi.fn()}
        onStartSimulation={handleStart}
        onResetSimulation={vi.fn()}
        isLoading={false}
        activeAdapterType="mock"
        onToggleAdapter={vi.fn()}
        hasFrames={false}
      />
    );

    const launchButton = screen.getByText("Launch Simulation");
    fireEvent.click(launchButton);
    expect(handleStart).toHaveBeenCalledTimes(1);
  });

  it("switches between mock adapter and http adapter", () => {
    const handleToggle = vi.fn();
    render(
      <ParameterControls
        config={mockConfig}
        onChangeConfig={vi.fn()}
        onStartSimulation={vi.fn()}
        onResetSimulation={vi.fn()}
        isLoading={false}
        activeAdapterType="mock"
        onToggleAdapter={handleToggle}
        hasFrames={false}
      />
    );

    const httpBtn = screen.getByText("Live HTTP API");
    fireEvent.click(httpBtn);
    expect(handleToggle).toHaveBeenCalledWith("http");
  });
});
