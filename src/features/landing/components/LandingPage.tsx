"use client";

import React from "react";
import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { SimulationPreview } from "./SimulationPreview";
import { ProblemStatement } from "./ProblemStatement";
import { ModelBenchmarks } from "./ModelBenchmarks";
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

        {/* 5. Empirical Model Benchmarks: AUROC, PR-AUC & F1-Score */}
        <ModelBenchmarks />

        {/* 6. Physical Prototype: ESP32 & Ultrasonic Sensor Integration */}
        <HardwareProbe />

        {/* 7. Final Call-to-Action */}
        <CallToAction />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Back To Top */}
      <BackToTop />
    </div>
  );
}
