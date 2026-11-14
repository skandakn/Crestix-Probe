import React, { act } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import manifest from "@/app/manifest";
import { PWAProvider, usePWA } from "@/components/pwa/pwa-provider";
import { MobileBottomNav } from "@/components/pwa/mobile-bottom-nav";

// Test consumer component
function TestPWAConsumer() {
  const { isOnline, isInstalled, isInstallable, promptInstall } = usePWA();
  return (
    <div>
      <span data-testid="pwa-online-status">{isOnline ? "ONLINE" : "OFFLINE"}</span>
      <span data-testid="pwa-installed-status">{isInstalled ? "INSTALLED" : "BROWSER"}</span>
      <span data-testid="pwa-installable-status">{isInstallable ? "READY" : "NOT_READY"}</span>
      <button data-testid="trigger-install-btn" onClick={() => promptInstall()}>
        Install
      </button>
    </div>
  );
}

describe("Progressive Web App (PWA) & Mobile UX Verification", () => {
  describe("Web App Manifest Specification", () => {
    it("generates a valid Next.js manifest object with standalone display and theme colors", () => {
      const manifestObj = manifest();

      expect(manifestObj.name).toContain("Crestix Probe");
      expect(manifestObj.short_name).toBe("Crestix Probe");
      expect(manifestObj.display).toBe("standalone");
      expect(manifestObj.theme_color).toBe("#06080e");
      expect(manifestObj.background_color).toBe("#06080e");
      expect(manifestObj.start_url).toBe("/");
      expect(manifestObj.icons).toBeDefined();
      expect(manifestObj.icons?.length).toBeGreaterThanOrEqual(4);

      // Check standard 192 and 512 icons
      const sizes = manifestObj.icons?.map((i) => i.sizes);
      expect(sizes).toContain("192x192");
      expect(sizes).toContain("512x512");

      // Check maskable icons
      const purposes = manifestObj.icons?.map((i) => i.purpose);
      expect(purposes).toContain("maskable");

      // Check shortcuts for mobile quick actions
      expect(manifestObj.shortcuts).toBeDefined();
      expect(manifestObj.shortcuts?.length).toBeGreaterThanOrEqual(3);
    });

    it("verifies static public/manifest.json matches PWA criteria", () => {
      const manifestPath = path.join(process.cwd(), "public", "manifest.json");
      expect(fs.existsSync(manifestPath)).toBe(true);

      const raw = fs.readFileSync(manifestPath, "utf-8");
      const parsed = JSON.parse(raw);

      expect(parsed.name).toContain("Crestix Probe");
      expect(parsed.display).toBe("standalone");
      expect(parsed.icons.some((i: { sizes: string }) => i.sizes === "192x192")).toBe(true);
      expect(parsed.icons.some((i: { sizes: string }) => i.sizes === "512x512")).toBe(true);
    });
  });

  describe("Service Worker & Offline Fallback Assets", () => {
    it("verifies public/sw.js exists with cache-first and navigation offline fallback logic", () => {
      const swPath = path.join(process.cwd(), "public", "sw.js");
      expect(fs.existsSync(swPath)).toBe(true);

      const swContent = fs.readFileSync(swPath, "utf-8");
      expect(swContent).toContain("crestix-probe-v1");
      expect(swContent).toContain("addEventListener('install'");
      expect(swContent).toContain("addEventListener('activate'");
      expect(swContent).toContain("addEventListener('fetch'");
      expect(swContent).toContain("/offline.html");
    });

    it("verifies offline fallback HTML page exists with dark theme styling", () => {
      const offlinePath = path.join(process.cwd(), "public", "offline.html");
      expect(fs.existsSync(offlinePath)).toBe(true);

      const html = fs.readFileSync(offlinePath, "utf-8");
      expect(html).toContain("No Uplink Connectivity");
      expect(html).toContain("#06080e");
      expect(html).toContain("Attempt Downlink Reconnect");
    });

    it("verifies all PWA icons exist in public directory", () => {
      const iconFiles = [
        "public/icons/icon-192x192.png",
        "public/icons/icon-512x512.png",
        "public/icons/icon-maskable-192x192.png",
        "public/icons/icon-maskable-512x512.png",
        "public/icons/apple-touch-icon.png",
        "public/icons/icon.svg",
        "public/favicon.svg",
      ];

      for (const file of iconFiles) {
        expect(fs.existsSync(path.join(process.cwd(), file))).toBe(true);
      }
    });
  });

  describe("PWA Provider & Lifecycle Hook", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("renders children and provides default online state", () => {
      render(
        <PWAProvider>
          <TestPWAConsumer />
        </PWAProvider>
      );

      expect(screen.getByTestId("pwa-online-status")).toHaveTextContent("ONLINE");
      expect(screen.getByTestId("pwa-installed-status")).toHaveTextContent("BROWSER");
    });

    it("detects when connectivity drops and displays offline ribbon", () => {
      render(
        <PWAProvider>
          <TestPWAConsumer />
        </PWAProvider>
      );

      // Simulate offline event
      act(() => {
        fireEvent(window, new Event("offline"));
      });

      expect(screen.getByTestId("pwa-online-status")).toHaveTextContent("OFFLINE");
      expect(screen.getByText(/OFFLINE MODE ACTIVE/i)).toBeInTheDocument();

      // Simulate back online
      act(() => {
        fireEvent(window, new Event("online"));
      });
      expect(screen.getByTestId("pwa-online-status")).toHaveTextContent("ONLINE");
      expect(screen.queryByText(/OFFLINE MODE ACTIVE/i)).not.toBeInTheDocument();
    });

    it("captures beforeinstallprompt event and exposes install banner", async () => {
      sessionStorage.clear();

      render(
        <PWAProvider>
          <TestPWAConsumer />
        </PWAProvider>
      );

      const mockPrompt = vi.fn().mockResolvedValue(undefined);
      const mockChoice = Promise.resolve({ outcome: "accepted" as const, platform: "web" });

      const installEvent = new Event("beforeinstallprompt");
      Object.assign(installEvent, { prompt: mockPrompt, userChoice: mockChoice });

      act(() => {
        fireEvent(window, installEvent);
      });

      expect(screen.getByTestId("pwa-installable-status")).toHaveTextContent("READY");
      expect(screen.getByText(/Install Crestix Probe App/i)).toBeInTheDocument();

      // Trigger install click
      const installBtn = screen.getByRole("button", { name: /Install to Device/i });
      await act(async () => {
        fireEvent.click(installBtn);
      });
      expect(mockPrompt).toHaveBeenCalled();
    });
  });

  describe("Mobile Bottom Navigation Bar", () => {
    it("renders thumb-friendly mobile navigation with links to core modules", () => {
      render(
        <PWAProvider>
          <MobileBottomNav />
        </PWAProvider>
      );

      const nav = screen.getByRole("navigation", { name: /Mobile Bottom Navigation/i });
      expect(nav).toBeInTheDocument();

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Forecast")).toBeInTheDocument();
      expect(screen.getByText("Simulation")).toBeInTheDocument();
      expect(screen.getByText("Sensors")).toBeInTheDocument();
      expect(screen.getByText("Terrain")).toBeInTheDocument();
    });
  });
});
