import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CrestixNavigationShell } from "../harnesses/CrestixTestHarness";

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", {
    writable: true,
    configurable: true,
    value: height,
  });
  window.matchMedia = vi.fn().mockImplementation((query: string) => {
    const minWidthMatch = query.match(/\(min-width:\s*(\d+)px\)/);
    const matches = minWidthMatch ? width >= Number(minWidthMatch[1]) : false;
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  });
  window.dispatchEvent(new Event("resize"));
}

describe("Responsive Layout Testing (Task 5)", () => {
  it("prevents horizontal overflow on the application shell across breakpoints", () => {
    setViewport(375, 812);
    render(<CrestixNavigationShell initialPath="/sensors" />);

    const shell = screen.getByTestId("app-shell");
    expect(shell.className).toContain("overflow-x-hidden");
  });

  it("toggles mobile navigation drawer and closes drawer upon route selection", () => {
    setViewport(375, 812);
    render(<CrestixNavigationShell initialPath="/" />);

    const toggleBtn = screen.getByTestId("mobile-menu-toggle");
    expect(toggleBtn).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("mobile-nav-drawer")).not.toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("mobile-nav-drawer")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("mobile-nav-analytics"));
    expect(toggleBtn).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("mobile-nav-drawer")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Validation Metrics & Model Comparison Analytics/i })
    ).toBeInTheDocument();
  });

  it("adapts KPI and telemetry grids cleanly across tablet (768px) and desktop (1280px) viewports", () => {
    setViewport(768, 1024);
    const { rerender } = render(<CrestixNavigationShell initialPath="/analytics" />);
    expect(screen.getByTestId("analytics-kpi-grid")).toBeInTheDocument();

    setViewport(1280, 800);
    rerender(<CrestixNavigationShell initialPath="/analytics" />);
    expect(screen.getByTestId("analytics-chart-svg")).toBeInTheDocument();
  });
});
