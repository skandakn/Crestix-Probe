import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = "Telemetry Signal Disrupted",
  message = "Failed to synchronize downlink frames with probe subcarrier. Check gateway network and authentication tokens.",
  onRetry,
  retryLabel = "Re-establish Uplink",
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-xl bg-red-950/20 border border-red-500/30 text-slate-200",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-900/30 border border-red-500/40 text-red-400 mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-red-300 font-mono">{title}</h4>
      <p className="text-xs text-slate-400 mt-1 max-w-md">{message}</p>
      {onRetry && (
        <div className="mt-5">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="border-red-500/40 hover:bg-red-950/40 text-red-300 hover:text-white"
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
