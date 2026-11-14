"use client";

import React from "react";
import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { SimulationPreview } from "./SimulationPreview";
import { ProblemStatement } from "./ProblemStatement";
import { TechnologyPillars } from "./TechnologyPillars";
import { ProductFeatures } from "./ProductFeatures";
import { WorkflowPipeline } from "./WorkflowPipeline";
import { ResearchBenchmarks } from "./ResearchBenchmarks";
import { HardwareProbe } from "./HardwareProbe";
import { CallToAction } from "./CallToAction";
import { Footer } from "./Footer";
import { BackToTop } from "./BackToTop";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#1d1d1f] flex flex-col selection:bg-blue-500/15 selection:text-[#0071e3] font-sans antialiased">
      {/* 1. Navigation Bar with Crestix Probe Branding */}
      <Navbar />

      <main className="flex-1 flex flex-col w-full">
        {/* 2. Hero Section with Headline and Flood Simulation Visual */}
        <Hero />

        {/* 3. Interactive Truthful Flood Propagation Preview */}
        <SimulationPreview />

        {/* 4. Problem Statement: Urban Inundation Crisis */}
        <ProblemStatement />

        {/* 5. Technology Pillars: 2D SWE, FNO/PINO, and In-Situ Hardware */}
        <TechnologyPillars />

        {/* 6. Product Features: High-Performance Capabilities */}
        <ProductFeatures />

        {/* 7. Workflow: Terrain -> Rainfall -> Simulation -> AI Forecast -> Sensor Validation */}
        <WorkflowPipeline />

        {/* 8. Research & Performance: Illustrative Scientific Benchmarks */}
        <ResearchBenchmarks />

        {/* 9. Physical Prototype: ESP32 & Ultrasonic Sensor Integration */}
        <HardwareProbe />

        {/* 10. Final Call-to-Action */}
        <CallToAction />
      </main>

      {/* 11. Footer */}
      <Footer />

      {/* Floating Back To Top */}
      <BackToTop />
    </div>
  );
}
