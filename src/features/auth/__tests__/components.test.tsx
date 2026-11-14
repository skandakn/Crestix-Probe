import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PasswordInput } from "../components/PasswordInput";
import { LoginForm } from "../components/LoginForm";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { AuthProvider } from "../context/AuthContext";
import { setActiveAdapter, MockAuthAdapter } from "../adapters";

// Mock next/navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

describe("Auth Component Interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setActiveAdapter(new MockAuthAdapter({ latencyMs: 0 }));
  });

  describe("PasswordInput Component", () => {
    it("should render as password type by default and toggle visibility on button click", () => {
      render(
        <PasswordInput
          id="test-password"
          label="Access Key"
          placeholder="Enter key"
        />
      );

      const input = screen.getByLabelText("Access Key") as HTMLInputElement;
      expect(input.type).toBe("password");

      const toggleButton = screen.getByRole("button", {
        name: /show security key phrase/i,
      });
      expect(toggleButton).toHaveAttribute("aria-pressed", "false");

      // Click toggle
      fireEvent.click(toggleButton);

      expect(input.type).toBe("text");
      expect(toggleButton).toHaveAttribute("aria-pressed", "true");
      expect(toggleButton).toHaveAttribute(
        "aria-label",
        "Hide security key phrase"
      );

      // Click again
      fireEvent.click(toggleButton);
      expect(input.type).toBe("password");
      expect(toggleButton).toHaveAttribute("aria-pressed", "false");
    });

    it("should display accessible error message when error prop is passed", () => {
      render(
        <PasswordInput
          id="test-password"
          label="Access Key"
          error="Access key is required."
        />
      );

      const input = screen.getByLabelText("Access Key");
      expect(input).toHaveAttribute("aria-invalid", "true");

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Access key is required.");
    });
  });

  describe("LoginForm Component", () => {
    it("should display validation errors when submitting empty form", async () => {
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      const submitBtn = screen.getByRole("button", {
        name: /authenticate operator/i,
      });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/operator email identifier is required/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/access key phrase is required/i)
        ).toBeInTheDocument();
      });
    });

    it("should autofill credentials when clicking quick test account", async () => {
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      );

      const leadBtn = screen.getByRole("button", {
        name: /lead operator/i,
      });
      fireEvent.click(leadBtn);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(
          /telemetry address \/ email/i
        ) as HTMLInputElement;
        expect(emailInput.value).toBe("probe.lead@crestix.space");
      });
    });
  });

  describe("ProtectedRoute Component", () => {
    it("should show radar loading scan when initializing session", async () => {
      render(
        <AuthProvider>
          <ProtectedRoute>
            <div data-testid="protected-content">Secret Telemetry</div>
          </ProtectedRoute>
        </AuthProvider>
      );

      // Initially shows scanning enclave
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(
        screen.getByText(/scanning enclave clearance/i)
      ).toBeInTheDocument();

      // Wait for provider hydration to settle
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          "/login?redirect=%2Fdashboard"
        );
      });
    });
  });
});
