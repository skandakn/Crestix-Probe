import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ColorLegend } from "../components/ColorLegend";
import { DEFAULT_DEPTH_THRESHOLDS } from "../types/contract";

describe("ColorLegend Component", () => {
  it("renders all 4 flood depth categories: Dry, Shallow, Moderate, and Deep", () => {
    const handleOpenSettings = vi.fn();
    render(
      <ColorLegend
        thresholds={DEFAULT_DEPTH_THRESHOLDS}
        onOpenSettings={handleOpenSettings}
        maxDepthInFrame={0.85}
      />
    );

    expect(screen.getByText("Dry Area")).toBeDefined();
    expect(screen.getByText("Shallow Water")).toBeDefined();
    expect(screen.getByText("Moderate Depth")).toBeDefined();
    expect(screen.getByText("Deep Water")).toBeDefined();
  });

  it("renders the required non-universal safety standard disclaimer", () => {
    render(
      <ColorLegend
        thresholds={DEFAULT_DEPTH_THRESHOLDS}
        onOpenSettings={vi.fn()}
      />
    );

    expect(screen.getByText(/Notice:/i)).toBeDefined();
    expect(
      screen.getByText(/not universal safety standards or regulatory flood hazards/i)
    );
  });

  it("triggers onOpenSettings when Tune Thresholds button is clicked", () => {
    const handleOpenSettings = vi.fn();
    render(
      <ColorLegend
        thresholds={DEFAULT_DEPTH_THRESHOLDS}
        onOpenSettings={handleOpenSettings}
      />
    );

    const button = screen.getByText("Tune Thresholds");
    fireEvent.click(button);
    expect(handleOpenSettings).toHaveBeenCalledTimes(1);
  });
});
