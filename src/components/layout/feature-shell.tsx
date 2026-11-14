"use client";

import React, { useState } from "react";
import {
  Code,
  Layers,
  Terminal,
  Cpu,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabList, TabTrigger, TabContent } from "@/components/ui/tabs";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "./page-header";

export interface FeatureShellProps {
  moduleName: string;
  moduleRoute: string;
  owner: string;
  description: string;
  deliverables: string[];
  suggestedEndpoints?: string[];
  mockDataPath?: string;
  icon?: React.ReactNode;
}

export function FeatureShell({
  moduleName,
  moduleRoute,
  owner,
  description,
  deliverables,
  suggestedEndpoints = [],
  mockDataPath,
  icon,
}: FeatureShellProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      <PageHeader
        title={moduleName}
        description={description}
        badge={`Owner: ${owner}`}
        badgeVariant="cyan"
        breadcrumbs={[
          { label: "Mission Console", href: "/dashboard" },
          { label: moduleName },
        ]}
        actions={
          <Badge variant="teal" dot pulse size="md">
            FOUNDATION READY
          </Badge>
        }
      />

      {/* Development Status Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0b0f17] border border-cyan-500/30 text-xs shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 shrink-0">
            {icon || <Cpu className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-100 font-mono">{moduleRoute}</span>
              <span className="text-slate-500">•</span>
              <span className="text-cyan-400 font-semibold">{owner}</span>
            </div>
            <p className="text-slate-400 mt-0.5">
              This route shell is scaffolded with the foundation design system. Full feature implementation is reserved for {owner}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" size="sm">
            <Clock className="w-3 h-3 mr-1 text-amber-400 inline" />
            Awaiting Implementation
          </Badge>
        </div>
      </div>

      {/* Interactive Tabs for Developer & Architecture Guidance */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabList>
          <TabTrigger value="overview" icon={<Layers className="w-3.5 h-3.5" />}>
            Module Scope & Tasks
          </TabTrigger>
          <TabTrigger value="contracts" icon={<Code className="w-3.5 h-3.5" />}>
            Shared Contracts & Imports
          </TabTrigger>
          <TabTrigger value="states" icon={<Terminal className="w-3.5 h-3.5" />}>
            Preview State Components
          </TabTrigger>
        </TabList>

        {/* Tab 1: Overview */}
        <TabContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  Target Feature Deliverables
                </CardTitle>
                <CardDescription>
                  Requirements allocated to {owner}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  {deliverables.map((item, index) => (
                    <li key={index} className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Backend & Mock Integration
                </CardTitle>
                <CardDescription>
                  Conventions established by Member 1
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">
                    Associated Feature Directory
                  </span>
                  <code className="block p-2 rounded bg-[#07090e] border border-slate-800 text-cyan-300 font-mono">
                    src/features/{moduleRoute.replace("/", "")}/
                  </code>
                </div>

                {suggestedEndpoints.length > 0 && (
                  <div>
                    <span className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">
                      Planned API Endpoints
                    </span>
                    <div className="space-y-1">
                      {suggestedEndpoints.map((ep, idx) => (
                        <code
                          key={idx}
                          className="block p-1.5 rounded bg-[#07090e] border border-slate-800 text-teal-300 font-mono text-[11px]"
                        >
                          {ep}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                {mockDataPath && (
                  <div>
                    <span className="text-slate-400 block mb-1 font-mono uppercase text-[10px]">
                      Mock Data Path
                    </span>
                    <code className="block p-2 rounded bg-[#07090e] border border-slate-800 text-slate-300 font-mono">
                      {mockDataPath}
                    </code>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabContent>

        {/* Tab 2: Shared Contracts */}
        <TabContent value="contracts">
          <Card variant="default">
            <CardHeader>
              <CardTitle className="text-sm font-mono">Ready-to-Use Foundation Imports</CardTitle>
              <CardDescription>
                Copy and paste these standard contracts into your feature files:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-xs font-mono">
                <div className="p-3 rounded-lg bg-[#07090e] border border-slate-800">
                  <span className="text-slate-500 block mb-1">{"// 1. Reusable UI Components"}</span>
                  <pre className="text-cyan-300 overflow-x-auto">
{`import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Input,
  Tabs,
  Modal,
  Tooltip,
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/components/ui";`}
                  </pre>
                </div>

                <div className="p-3 rounded-lg bg-[#07090e] border border-slate-800">
                  <span className="text-slate-500 block mb-1">{"// 2. API Client with Type Envelope"}</span>
                  <pre className="text-teal-300 overflow-x-auto">
{`import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types/api";

const res = await apiClient.get<YourDataType>("/${moduleRoute.replace("/", "")}/telemetry");`}
                  </pre>
                </div>

                <div className="p-3 rounded-lg bg-[#07090e] border border-slate-800">
                  <span className="text-slate-500 block mb-1">{"// 3. Layout and Utilities"}</span>
                  <pre className="text-slate-300 overflow-x-auto">
{`import { PageHeader } from "@/components/layout";
import { cn, formatMissionTime } from "@/lib/utils";
import { DESIGN_TOKENS } from "@/config/theme";`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabContent>

        {/* Tab 3: Preview States */}
        <TabContent value="states">
          <div className="space-y-5">
            <div className="text-xs text-slate-400">
              Test how common lifecycle states look within the {moduleName} layout:
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xs font-mono text-cyan-300">Loading State</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <LoadingState
                    message={`Loading ${moduleName}...`}
                    subMessage="Awaiting packet stream"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xs font-mono text-teal-300">Empty State</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <EmptyState
                    title={`No ${moduleName} Data`}
                    description="Sensors have not transmitted readings for this sector yet."
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xs font-mono text-red-300">Error State</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ErrorState
                    title="Uplink Timeout"
                    message="Telemetry downlink dropped frame sequence #082"
                    onRetry={() => alert("Retry triggered for " + moduleName)}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabContent>
      </Tabs>
    </div>
  );
}
