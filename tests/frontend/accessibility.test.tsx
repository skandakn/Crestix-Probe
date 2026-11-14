import React from "react";
import { render, screen } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";
import {
  CRESTIX_ROUTES,
  CrestixErrorBoundary,
  CrestixNavigationShell,
} from "../harnesses/CrestixTestHarness";

async function runAxeAudit(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      // jsdom does not compute layout color contrast
      "color-contrast": { enabled: false },
    },
  });
  return results.violations;
}

describe("Accessibility Checks (Task 6)", () => {
  it.each(CRESTIX_ROUTES.map((r) => r.path))(
    "has zero axe-core WCAG violations on route %s",
    async (routePath) => {
      const { container } = render(<CrestixNavigationShell initialPath={routePath} />);
      const violations = await runAxeAudit(container);
      expect(violations).toEqual([]);
    }
  );

  it("provides a skip-to-workspace keyboard link and labeled form controls on auth pages", () => {
    render(<CrestixNavigationShell initialPath="/login" />);

    const skipLink = screen.getByRole("link", { name: /Skip to main workspace/i });
    expect(skipLink).toHaveAttribute("href", "#main-workspace");

    expect(screen.getByLabelText(/Institutional Email/i)).toBeRequired();
    expect(screen.getByLabelText(/Password/i)).toBeRequired();
  });

  it("ensures error boundary fallback uses assertive live region for screen readers", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    function Broken(): React.ReactElement {
      throw new Error("A11y check error");
    }
    const { container } = render(
      <CrestixErrorBoundary>
        <Broken />
      </CrestixErrorBoundary>
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");
    const violations = await runAxeAudit(container);
    expect(violations).toEqual([]);
    spy.mockRestore();
  });
});
