import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LandingPage } from "../components/LandingPage";
import { SimulationPreview } from "../components/SimulationPreview";
import { TechnologyPillars } from "../components/TechnologyPillars";
import { WorkflowPipeline } from "../components/WorkflowPipeline";
import { ResearchBenchmarks } from "../components/ResearchBenchmarks";
import { HardwareProbe } from "../components/HardwareProbe";
import { CallToAction } from "../components/CallToAction";

describe("Crestix Probe Landing Page Suite", () => {
  it("renders the master landing page with branding and core sections", () => {
    render(<LandingPage />);

    // Brand Identity
    expect(screen.getAllByText(/CRESTIX/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Predicting the Flow of Tomorrow/i)[0]).toBeInTheDocument();

    // Section 2: Hero
    expect(
      screen.getByText(/Physics-Informed Real-Time Urban Flood Forecasting at/i)
    ).toBeInTheDocument();

    // Section 3: Simulation Lab
    expect(
      screen.getByText(/Real-Time Flood Propagation Simulator/i)
    ).toBeInTheDocument();

    // Section 4: Problem Statement
    expect(
      screen.getByText(/Why Traditional Flood Forecasting Fails in Modern Cities/i)
    ).toBeInTheDocument();

    // Section 5: Technology Pillars
    expect(
      screen.getByText(/The Three Pillars of Crestix Probe/i)
    ).toBeInTheDocument();

    // Section 6: Product Features
    expect(
      screen.getByText(/Engineered for Mission-Critical Flood Intelligence/i)
    ).toBeInTheDocument();

    // Section 7: Workflow Pipeline
    expect(
      screen.getByText(/From Topography to Real-Time In-Situ Verification/i)
    ).toBeInTheDocument();

    // Section 8: Research Benchmarks
    expect(
      screen.getByText(/Computational Scaling & Error Profiles/i)
    ).toBeInTheDocument();

    // Section 9: Hardware Probe
    expect(
      screen.getByText(/Autonomous ESP32 Ultrasonic Field Probe/i)
    ).toBeInTheDocument();

    // Section 10: Call To Action
    expect(
      screen.getByText(/Deploy Crestix Probe Today/i)
    ).toBeInTheDocument();

    // Section 11: Footer
    expect(
      screen.getByText(/All rights reserved/i)
    ).toBeInTheDocument();
  });

  describe("Interactive Simulation Component", () => {
    it("allows switching scenarios and time-steps", () => {
      render(<SimulationPreview />);

      // Verify scenario switch
      const conduitBtn = screen.getByText(/Subsurface Conduit Surcharge/i);
      expect(conduitBtn).toBeInTheDocument();
      fireEvent.click(conduitBtn);

      // Verify time-step buttons exist
      const t45Btn = screen.getByText("45m");
      expect(t45Btn).toBeInTheDocument();
      fireEvent.click(t45Btn);

      expect(screen.getByText(/t = 45 min/i)).toBeInTheDocument();
    });

    it("displays prominent illustrative benchmark disclaimer", () => {
      render(<SimulationPreview />);
      expect(
        screen.getByText(/ILLUSTRATIVE BENCHMARK/i)
      ).toBeInTheDocument();
    });
  });

  describe("Technology Pillars Component", () => {
    it("switches between shallow-water equations, neural operators, and sensor validation", () => {
      render(<TechnologyPillars />);

      // Switch to Pillar 2
      const fnoTab = screen.getAllByText(/Fourier & Physics-Informed Neural Operators/i)[0];
      fireEvent.click(fnoTab);

      expect(
        screen.getAllByText(/Sub-Second Mesh-Independent Surrogate Solving with PINO Regularization/i).length
      ).toBeGreaterThan(0);

      // Switch to Pillar 3
      const sensorTab = screen.getAllByText(/In-Situ Sensor Ingestion & State Assimilation/i)[0];
      fireEvent.click(sensorTab);

      expect(
        screen.getAllByText(/Real-Time Ultrasonic Water-Level Telemetry for Closed-Loop Drift Correction/i).length
      ).toBeGreaterThan(0);
    });
  });

  describe("Workflow Pipeline Component", () => {
    it("allows navigating through all 5 stages", () => {
      render(<WorkflowPipeline />);

      expect(screen.getAllByText(/STAGE 04/i).length).toBeGreaterThan(0);

      // Click Stage 1 (Topographic Ingestion)
      const stage1Btn = screen.getAllByText(/Topographic & Built-Environment Ingestion/i)[0];
      fireEvent.click(stage1Btn);

      expect(screen.getByText(/STAGE 01 DEEP-DIVE/i)).toBeInTheDocument();
      expect(screen.getByText(/0.5m Airborne LiDAR GeoTIFFs/i)).toBeInTheDocument();
    });
  });

  describe("Research Benchmarks Component", () => {
    it("renders synthetic benchmark scaling table and academic citations", () => {
      render(<ResearchBenchmarks />);

      expect(screen.getByText(/BENCHMARK MATRIX/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Illustrative Prototype/i).length).toBeGreaterThan(0);

      // Switch to academic citations tab
      const citationsTab = screen.getByText(/Academic Literature & Citations/i);
      fireEvent.click(citationsTab);

      expect(screen.getByText(/Fourier Neural Operator for Parametric Partial Differential Equations/i)).toBeInTheDocument();
    });
  });

  describe("Hardware Probe Component", () => {
    it("renders ESP32 specifications and switches to live serial terminal stream", () => {
      render(<HardwareProbe />);

      expect(screen.getByText(/Espressif ESP32-WROOM-32D/i)).toBeInTheDocument();
      expect(screen.getByText(/JSN-SR04T-2.0 \/ AJ-SR04M/i)).toBeInTheDocument();

      // Switch to serial stream
      const terminalTab = screen.getByText(/Live Serial Terminal Stream/i);
      fireEvent.click(terminalTab);

      expect(screen.getByText(/MQTT INGESTION MONITOR/i)).toBeInTheDocument();
    });
  });

  describe("Call To Action Component", () => {
    it("submits the pilot deployment request form", () => {
      render(<CallToAction />);

      const orgInput = screen.getByPlaceholderText(/City Flood Resilience Office/i);
      const emailInput = screen.getByPlaceholderText(/engineer@watershed.gov/i);
      const submitBtn = screen.getByText(/Request Pilot Technical Package/i);

      fireEvent.change(orgInput, { target: { value: "Metro Flood Agency" } });
      fireEvent.change(emailInput, { target: { value: "lead@metroflood.org" } });
      fireEvent.click(submitBtn);

      expect(screen.getByText(/Pilot Request Initialized/i)).toBeInTheDocument();
      expect(screen.getByText(/lead@metroflood.org/i)).toBeInTheDocument();
    });
  });
});
