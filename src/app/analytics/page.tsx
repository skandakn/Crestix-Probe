import React from "react";
import { BarChart3 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { FeatureShell } from "@/components/layout/feature-shell";

export default function AnalyticsPage() {
  return (
    <AppShell title="Mission Analytics">
      <FeatureShell
        moduleName="Longitudinal Mission Analytics"
        moduleRoute="/analytics"
        owner="Member 6"
        description="Historic telemetry data warehousing, statistical regression trends, anomaly clustering, and mission reporting."
        icon={<BarChart3 className="w-5 h-5 text-cyan-400" />}
        deliverables={[
          "Historical mission metrics aggregation (total distance, power consumed, packets received)",
          "Subsystem degradation curves (solar panel dusting rate, battery cycle efficiency)",
          "Telemetry anomaly clustering and out-of-bounds deviation log",
          "Automated PDF / CSV / JSON mission report export generator",
          "Custom query builder for querying multi-sol telemetry records",
        ]}
        suggestedEndpoints={[
          "GET /api/analytics/aggregates?timeframe=sol_all",
          "GET /api/analytics/degradation-trends",
          "POST /api/analytics/export-report",
        ]}
        mockDataPath="src/features/analytics/mock-analytics.ts"
      />
    </AppShell>
  );
}
