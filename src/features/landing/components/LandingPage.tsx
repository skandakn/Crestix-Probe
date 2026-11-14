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
    <div className="min-h-screen bg-[#07090e] text-[#f8fafc] flex flex-col selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* 1. Navigation Bar with Crestix Probe Branding */}
      <Navbar />

      <main className="flex-1 flex flex-col w-full">
        {/* 2. Hero Section with Headline and Simulation Visual */}
        <Hero />

        {/* 3. Interactive Truthful Flood Propagation Preview */}
        <SimulationPreview />

        {/* 4. Problem Statement: Urban Inundation Crisis */}
        <ProblemStatement />

        {/* 5. Technology Explanation: SWE, FNO/PINO & Sensor Validation */}
        <TechnologyPillars />

        {/* 6. Product Features Section */}
        <ProductFeatures />

        {/* 7. 5-Stage Pipeline Workflow */}
        <WorkflowPipeline />

        {/* 8. Research & Performance Section (Clearly Labelled Illustrative) */}
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
