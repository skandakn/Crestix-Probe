import React from "react";
import { TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { FeatureShell } from "@/components/layout/feature-shell";

export default function ForecastingPage() {
  return (
    <AppShell title="Environmental Forecasting">
      <FeatureShell
        moduleName="Atmospheric & Weather Forecasting"
        moduleRoute="/forecasting"
        owner="Member 4"
        description="Predictive environmental modeling, atmospheric pressure shifts, solar radiation flux, and dust storm risk forecasts."
        icon={<TrendingUp className="w-5 h-5 text-cyan-400" />}
        deliverables={[
          "Multi-horizon surface temperature forecast charts (1h, 6h, 24h, 7d)",
          "Atmospheric pressure gradient and boundary layer wind shear analysis",
          "Solar irradiance curve & dust opacity attenuation tracker",
          "Severe environmental event early warning alerts (dust storm, radiation surge)",
          "Predictive model confidence intervals and historical accuracy scoring",
        ]}
        suggestedEndpoints={[
          "GET /api/forecasting/weather-series?horizon=24h",
          "GET /api/forecasting/solar-flux?sol=...",
          "GET /api/forecasting/hazard-alerts",
        ]}
        mockDataPath="src/features/forecasting/mock-forecast.ts"
      />
    </AppShell>
  );
}
