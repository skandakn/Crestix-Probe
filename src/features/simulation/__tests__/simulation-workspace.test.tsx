import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { SimulationWorkspace } from "../components/SimulationWorkspace";

describe("SimulationWorkspace Integration", () => {
  it("renders the master workspace with terrain presets and controls", async () => {
    await act(async () => {
      render(<SimulationWorkspace />);
    });

    expect(screen.getByText("Flood Simulation Workspace")).toBeDefined();
    expect(screen.getByText("Member 5 Workspace")).toBeDefined();
    expect(screen.getByText("Terrain Digital Elevation Model (DEM)")).toBeDefined();
    expect(screen.getByText("Launch Simulation")).toBeDefined();
  });

  it("launches simulation and generates frames successfully", async () => {
    await act(async () => {
      render(<SimulationWorkspace />);
    });

    const launchButton = screen.getByText("Launch Simulation");
    await act(async () => {
      fireEvent.click(launchButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/computed successfully/i)).toBeDefined();
    });

    // Check that status is updated to completed
    expect(screen.getAllByText("completed").length).toBeGreaterThan(0);
  });
});
