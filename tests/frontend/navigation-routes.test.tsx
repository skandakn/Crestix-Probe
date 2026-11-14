import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  CRESTIX_ROUTES,
  CrestixNavigationShell,
  RouteModuleView,
} from "../harnesses/CrestixTestHarness";

describe("Navigation and Route Tests (Task 8)", () => {
  it("renders all primary Crestix Probe navigation links with aria-current on active route", () => {
    render(<CrestixNavigationShell initialPath="/" />);

    const homeBtn = screen.getByTestId("nav-link-home");
    expect(homeBtn).toHaveAttribute("aria-current", "page");

    for (const route of CRESTIX_ROUTES) {
      const id = route.path === "/" ? "nav-link-home" : `nav-link-${route.path.slice(1)}`;
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
  });

  it("navigates across all core member routes and updates active view heading", () => {
    const onNavigate = vi.fn();
    render(<CrestixNavigationShell initialPath="/" onNavigate={onNavigate} />);

    fireEvent.click(screen.getByTestId("nav-link-terrain"));
    expect(onNavigate).toHaveBeenCalledWith("/terrain");
    expect(
      screen.getByRole("heading", { name: /Terrain & Digital Elevation Model/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("nav-link-simulation"));
    expect(
      screen.getByRole("heading", { name: /2D Shallow-Water Simulation Workbench/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("nav-link-forecast"));
    expect(
      screen.getByRole("heading", { name: /AI Flood Depth Forecasting Interface/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("nav-link-sensors"));
    expect(
      screen.getByRole("heading", { name: /ESP32 Ultrasonic Live Sensor Telemetry/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("nav-link-analytics"));
    expect(
      screen.getByRole("heading", { name: /Validation Metrics & Model Comparison Analytics/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("nav-link-login"));
    expect(screen.getByRole("heading", { name: /Researcher Sign In/i })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("nav-link-register"));
    expect(
      screen.getByRole("heading", { name: /Create Researcher Account/i })
    ).toBeInTheDocument();
  });

  it("renders accessible 404 alert when an unknown route is requested", () => {
    render(<RouteModuleView path="/non-existent-route" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /404 — Route Not Found/i })).toBeInTheDocument();
  });
});
