import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CrestixErrorBoundary } from "../harnesses/CrestixTestHarness";

function FaultySensorWidget({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("ESP32 WebSocket stream frame deserialization failed.");
  }
  return <div data-testid="healthy-widget">Telemetry stream operational</div>;
}

describe("Error Boundary Testing (Task 7)", () => {
  it("renders child module normally when no error is thrown", () => {
    render(
      <CrestixErrorBoundary>
        <FaultySensorWidget shouldThrow={false} />
      </CrestixErrorBoundary>
    );

    expect(screen.getByTestId("healthy-widget")).toHaveTextContent(
      "Telemetry stream operational"
    );
    expect(screen.queryByTestId("error-boundary-fallback")).not.toBeInTheDocument();
  });

  it("catches rendering exceptions and displays accessible alert fallback", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <CrestixErrorBoundary fallbackTitle="Telemetry Subsystem Failure">
        <FaultySensorWidget shouldThrow={true} />
      </CrestixErrorBoundary>
    );

    const alertRegion = screen.getByRole("alert");
    expect(alertRegion).toBeInTheDocument();
    expect(screen.getByText("Telemetry Subsystem Failure")).toBeInTheDocument();
    expect(screen.getByTestId("error-boundary-message")).toHaveTextContent(
      "ESP32 WebSocket stream frame deserialization failed."
    );

    spy.mockRestore();
  });

  it("recovers and re-renders module when Retry Module button is triggered", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const onReset = vi.fn();

    function RecoverableHarness() {
      const [broken, setBroken] = useState(true);
      return (
        <CrestixErrorBoundary
          onReset={() => {
            setBroken(false);
            onReset();
          }}
        >
          <FaultySensorWidget shouldThrow={broken} />
        </CrestixErrorBoundary>
      );
    }

    render(<RecoverableHarness />);
    expect(screen.getByTestId("error-boundary-fallback")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("error-boundary-retry"));

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("healthy-widget")).toBeInTheDocument();
    spy.mockRestore();
  });
});
