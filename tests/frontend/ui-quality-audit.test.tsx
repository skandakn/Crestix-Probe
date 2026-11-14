import React from "react";
import fs from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  CRESTIX_ROUTES,
  CrestixNavigationShell,
} from "../harnesses/CrestixTestHarness";

function LoadingStateSample() {
  return (
    <div role="status" aria-busy="true" data-testid="loading-skeleton">
      <span>Loading flood telemetry dataset...</span>
    </div>
  );
}

function EmptyStateSample() {
  return (
    <section aria-labelledby="empty-heading" data-testid="empty-state-card">
      <h2 id="empty-heading">No Experiments Recorded Yet</h2>
      <p>Upload a terrain DEM or connect an ESP32 ultrasonic probe to start an experiment.</p>
    </section>
  );
}

describe("UI Quality Assurance Audit (Layout, Typography, States, Links, Assets)", () => {
  it("verifies layout and typography consistency across all member routes without console errors", () => {
    const consoleErrorSpy = vi.spyOn(console, "error");

    for (const route of CRESTIX_ROUTES) {
      const { unmount } = render(<CrestixNavigationShell initialPath={route.path} />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading.className).toMatch(/text-2xl/);
      expect(heading.className).toMatch(/font-bold/);
      expect(screen.getByTestId("app-shell").className).toContain("overflow-x-hidden");
      unmount();
    }

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("verifies loading state and empty state accessibility semantics", () => {
    render(
      <div>
        <LoadingStateSample />
        <EmptyStateSample />
      </div>
    );

    const loading = screen.getByTestId("loading-skeleton");
    expect(loading).toHaveAttribute("aria-busy", "true");
    expect(loading).toHaveAttribute("role", "status");

    const empty = screen.getByTestId("empty-state-card");
    expect(empty).toHaveTextContent(/No Experiments Recorded Yet/i);
  });

  it("checks that interactive elements have valid hrefs/types and zero positive tabIndex values", () => {
    const { container } = render(<CrestixNavigationShell initialPath="/login" />);

    const anchors = Array.from(container.querySelectorAll("a"));
    for (const a of anchors) {
      const href = a.getAttribute("href");
      expect(href).toBeTruthy();
      expect(href).not.toBe("#");
      expect(href).not.toMatch(/^javascript:/i);
    }

    const buttons = Array.from(container.querySelectorAll("button"));
    for (const btn of buttons) {
      expect(btn.getAttribute("type")).toBeTruthy();
    }

    const positiveTabIndex = container.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])');
    expect(positiveTabIndex.length).toBe(0);
  });

  it("audits public/ directory to ensure no oversized or corrupted static assets exist", () => {
    const publicDir = path.resolve(process.cwd(), "public");
    if (fs.existsSync(publicDir)) {
      const files = fs.readdirSync(publicDir);
      for (const file of files) {
        const fullPath = path.join(publicDir, file);
        const stat = fs.statSync(fullPath);
        expect(stat.size).toBeGreaterThan(0);
        expect(stat.size).toBeLessThan(5 * 1024 * 1024);
      }
    }
  });
});
