import { describe, it } from "vitest";
import assert from "node:assert";
import { SIMULATION_SCENARIOS, SIMULATION_DISCLAIMER } from "../data/simulationData";
import { TECHNOLOGY_PILLARS } from "../data/techData";
import { WORKFLOW_STAGES } from "../data/workflowData";
import { PRODUCT_FEATURES } from "../data/featuresData";
import { HARDWARE_COMPONENTS, PROTOTYPE_METRICS, SAMPLE_SERIAL_PACKETS } from "../data/hardwareData";
import { BENCHMARK_COMPARISONS, RESEARCH_DISCLAIMER, ACADEMIC_CITATIONS } from "../data/researchData";

describe("Crestix Probe Landing Page Specifications & Contracts", () => {
  it("verifies simulation scenarios and hydrodynamic time steps", () => {
    assert.strictEqual(SIMULATION_SCENARIOS.length, 3, "Must provide 3 hydrodynamic scenarios");
    assert.ok(SIMULATION_DISCLAIMER.includes("ILLUSTRATIVE BENCHMARK"), "Disclaimer must flag illustrative benchmarks");

    for (const sc of SIMULATION_SCENARIOS) {
      assert.ok(sc.id && sc.name && sc.rainfallIntensity, "Scenario metadata must be complete");
      assert.strictEqual(sc.timesteps.length, 5, "Each scenario must have 5 time steps (0 to 60m)");
      for (const ts of sc.timesteps) {
        assert.ok(ts.minute >= 0 && ts.minute <= 60, "Minute must be bounded between 0 and 60");
        assert.ok(ts.sensorReadings.length >= 4, "Must track at least 4 sensor nodes");
      }
    }
  });

  it("verifies Tri-Pillar scientific architecture data", () => {
    assert.strictEqual(TECHNOLOGY_PILLARS.length, 3, "Must have exactly 3 technology pillars");
    const [p1, p2, p3] = TECHNOLOGY_PILLARS;

    // Pillar 1: Shallow Water Equations
    assert.ok(p1.title.includes("Shallow Water Equations"));
    assert.ok(p1.primaryEquation.includes("∂h/∂t"));

    // Pillar 2: Fourier Neural Operators
    assert.ok(p2.title.includes("Fourier & Physics-Informed"));
    assert.ok(p2.primaryEquation.includes("F⁻¹"));

    // Pillar 3: Sensor Ingestion
    assert.ok(p3.title.includes("Sensor Ingestion"));
    assert.ok(p3.primaryEquation.includes("x̂k"));
  });

  it("verifies 5-stage end-to-end workflow data", () => {
    assert.strictEqual(WORKFLOW_STAGES.length, 5, "Workflow must feature 5 stages");
    assert.strictEqual(WORKFLOW_STAGES[0].step, "01");
    assert.strictEqual(WORKFLOW_STAGES[4].step, "05");

    const titles = WORKFLOW_STAGES.map((s) => s.title);
    assert.ok(titles[0].includes("Topographic"));
    assert.ok(titles[1].includes("Precipitation"));
    assert.ok(titles[2].includes("Hydrodynamic Solver"));
    assert.ok(titles[3].includes("Neural Operator"));
    assert.ok(titles[4].includes("Sensor Validation"));
  });

  it("verifies product features and capabilities", () => {
    assert.strictEqual(PRODUCT_FEATURES.length, 6, "Must provide 6 product features");
    for (const f of PRODUCT_FEATURES) {
      assert.ok(f.title && f.description && f.technicalSpec);
      assert.strictEqual(f.metrics.length, 3, "Each feature must have 3 metrics");
    }
  });

  it("verifies hardware prototype specifications and serial monitor data", () => {
    assert.strictEqual(HARDWARE_COMPONENTS.length, 4, "Must define 4 hardware subsystems");
    assert.strictEqual(PROTOTYPE_METRICS.totalNodesFieldTested, 16);
    assert.strictEqual(PROTOTYPE_METRICS.firmwareVersion, "CX-OS 1.4.2-LTS");

    assert.ok(SAMPLE_SERIAL_PACKETS.length >= 3, "Must provide sample serial monitor packets");
    for (const pkt of SAMPLE_SERIAL_PACKETS) {
      assert.ok(pkt.payload.node_id.startsWith("CX-NODE"));
      assert.strictEqual(pkt.payload.crc_ok, true);
    }
  });

  it("verifies research benchmark matrix and illustrative data integrity", () => {
    assert.ok(RESEARCH_DISCLAIMER.badge.includes("ILLUSTRATIVE"));
    assert.strictEqual(BENCHMARK_COMPARISONS.length, 4, "Must compare 4 grid resolutions");
    for (const bm of BENCHMARK_COMPARISONS) {
      assert.strictEqual(bm.calibrationStatus, "Illustrative Prototype");
    }
    assert.strictEqual(ACADEMIC_CITATIONS.length, 4, "Must include 4 academic citations");
  });
});

